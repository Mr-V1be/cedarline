import { createTranslator } from 'next-intl'
import type { Payload } from 'payload'

import type { Locale } from '@/i18n/locales'
import { loadMessages } from '@/i18n/messages'

import type { DeliveryOutcome, Lead, LeadReceipt } from '../domain/lead-record'
import type { LeadNotifier } from '../ports/lead-notifier'
import { renderMailHtml, renderMailText, type MailContent } from './mail-layout'

const SYSTEM = { overrideAccess: true, depth: 0 } as const
/** Staff read leads in the primary language of the company. */
const STAFF_LOCALE: Locale = 'ru'

async function translators(locale: Locale) {
  const messages = await loadMessages(locale)
  return {
    mail: createTranslator({ locale, messages, namespace: 'mail' }),
    common: createTranslator({ locale, messages, namespace: 'common' }),
  }
}

const rubles = (locale: Locale, amount: number) =>
  new Intl.NumberFormat(locale === 'ru' ? 'ru-RU' : 'en-GB', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(amount)

/** Emails through Payload's mail adapter (SMTP: Mailpit locally) with the proposal attached. */
export class PayloadLeadNotifier implements LeadNotifier {
  constructor(private readonly payload: Payload) {}

  async notify(lead: Lead, receipts: readonly LeadReceipt[]): Promise<readonly DeliveryOutcome[]> {
    const site = await this.payload.findGlobal({ ...SYSTEM, slug: 'site', locale: lead.locale })
    const attachments = [
      {
        filename: lead.proposal.filename,
        content: lead.proposal.data,
        contentType: 'application/pdf',
      },
    ]
    const send = async (channel: string, to: string, subject: string, content: MailContent) => {
      const brand = (await translators(lead.locale)).common('brand.name')
      try {
        await this.payload.sendEmail({
          to,
          subject,
          html: renderMailHtml(content, brand),
          text: renderMailText(content),
          attachments,
        })
        return { channel, status: 'delivered', at: new Date() } satisfies DeliveryOutcome
      } catch (error) {
        return {
          channel,
          status: 'failed',
          error: error instanceof Error ? error.message : String(error),
          at: new Date(),
        } satisfies DeliveryOutcome
      }
    }

    const client = await this.clientMail(lead, site)
    const staff = await this.staffMail(lead, receipts)
    return [
      await send('mail:client', lead.contact.email, client.subject, client.content),
      await send('mail:manager', site.leadsEmail, staff.subject, staff.content),
    ]
  }

  private async clientMail(lead: Lead, site: { phone: string; email: string }) {
    const { mail, common } = await translators(lead.locale)
    const { summary } = lead
    const content: MailContent = {
      preheader: mail('client.preheader', { project: summary.projectTitle }),
      heading: mail('client.greeting', { name: lead.contact.name }),
      paragraphs: [mail('client.intro'), mail('client.keep')],
      rows: [
        { label: mail('rows.project'), value: summary.projectTitle },
        { label: mail('rows.configuration'), value: summary.description },
        { label: mail('rows.total'), value: rubles(lead.locale, summary.total) },
        { label: mail('rows.term'), value: common('units.weeks', { count: summary.totalWeeks }) },
      ],
      action: { label: mail('client.open'), href: summary.link },
      footer: [
        mail('client.contacts', { phone: site.phone, email: site.email }),
        mail('client.signature'),
        common('footer.demo'),
      ],
    }
    return { subject: mail('client.subject', { project: summary.projectTitle }), content }
  }

  private async staffMail(lead: Lead, receipts: readonly LeadReceipt[]) {
    const { mail, common } = await translators(STAFF_LOCALE)
    const { summary, contact } = lead
    const cms = receipts.find((receipt) => receipt.channel === 'cms')
    const crm = receipts.filter((receipt) => receipt.channel !== 'cms')
    const reference = cms?.reference ?? summary.code
    const content: MailContent = {
      preheader: mail('manager.intro'),
      heading: mail('manager.heading', { reference }),
      paragraphs: [mail('manager.intro')],
      rows: [
        { label: mail('rows.name'), value: contact.name },
        { label: mail('rows.phone'), value: contact.phone },
        { label: mail('rows.email'), value: contact.email },
        { label: mail('rows.comment'), value: contact.comment === '' ? '—' : contact.comment },
        { label: mail('rows.project'), value: summary.projectTitle },
        { label: mail('rows.configuration'), value: summary.description },
        { label: mail('rows.total'), value: rubles(STAFF_LOCALE, summary.total) },
        { label: mail('rows.term'), value: common('units.weeks', { count: summary.totalWeeks }) },
        { label: mail('rows.link'), value: summary.link },
        ...crm.map((receipt) => ({
          label: mail('rows.crm'),
          value: mail('manager.crmLead', {
            channel: receipt.channel,
            reference: receipt.reference,
          }),
        })),
      ],
      action: cms?.url === undefined ? null : { label: mail('manager.open'), href: cms.url },
      footer: [mail('manager.footer', { language: lead.locale.toUpperCase() })],
    }
    return {
      subject: mail('manager.subject', {
        reference,
        project: summary.projectTitle,
        total: rubles(STAFF_LOCALE, summary.total),
      }),
      content,
    }
  }
}
