import { Money } from '@cedarline/pricing'
import { createTranslator } from 'next-intl'
import type { Payload } from 'payload'

import { LOCALE_DEFINITIONS, type Locale } from '@/i18n/locales'
import { loadMessages } from '@/i18n/messages'
import type { Mailer, OutgoingMail } from '@/modules/mail/ports/mailer'
import {
  createPriceFormatter,
  formatExchangeRate,
} from '@/modules/pricing/application/price-formatter'
import { BASE_DISPLAY } from '@/modules/pricing/domain/exchange-rate'

import type { Lead, LeadReceipt } from '../domain/lead-record'
import type { LeadDelivery } from '../ports/lead-delivery'
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

/** Staff work in the tariff's currency. */
const staffPrices = createPriceFormatter(BASE_DISPLAY)

/** The lead's total in whole rubles, written as the customer read it on the site. */
const customerTotal = (lead: Lead) =>
  createPriceFormatter(lead.summary.prices).format(Money.ofRubles(lead.summary.total), 'exact')

/**
 * The two letters about a new lead: the customer's, with the proposal attached, and the sales
 * team's, with the contact and links to the lead. Composed in each reader's language.
 */
export class PayloadLeadMails {
  constructor(private readonly payload: Payload) {}

  private letter(lead: Lead, to: string, subject: string, content: MailContent) {
    return {
      to,
      subject,
      html: renderMailHtml(content),
      text: renderMailText(content),
      attachments: [
        {
          filename: lead.proposal.filename,
          content: lead.proposal.data,
          contentType: 'application/pdf',
        },
      ],
    } satisfies OutgoingMail
  }

  async forCustomer(lead: Lead): Promise<OutgoingMail> {
    const site = await this.payload.findGlobal({ ...SYSTEM, slug: 'site', locale: lead.locale })
    const { subject, content } = await this.clientMail(lead, site)
    return this.letter(lead, lead.contact.email, subject, content)
  }

  async forStaff(lead: Lead, receipts: readonly LeadReceipt[]): Promise<OutgoingMail> {
    const site = await this.payload.findGlobal({ ...SYSTEM, slug: 'site', locale: lead.locale })
    const { subject, content } = await this.staffMail(lead, receipts)
    return this.letter(lead, site.leadsEmail, subject, content)
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
        { label: mail('rows.total'), value: customerTotal(lead) },
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
    const staffTotal = staffPrices.format(Money.ofRubles(summary.total), 'exact')
    const { rate } = summary.prices
    // A customer who read another currency: what they saw and at which rate, beside the rubles.
    const customerPrice =
      rate === null
        ? []
        : [
            {
              label: mail('rows.customerPrice'),
              value: mail('manager.customerPrice', {
                amount: customerTotal(lead),
                rate: formatExchangeRate(rate),
                currency: rate.currency,
                date: new Intl.DateTimeFormat(LOCALE_DEFINITIONS[STAFF_LOCALE].tag, {
                  dateStyle: 'long',
                }).format(new Date(rate.setOn)),
              }),
            },
          ]
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
        { label: mail('rows.total'), value: staffTotal },
        ...customerPrice,
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
        total: staffTotal,
      }),
      content,
    }
  }
}

/** The letters as delivery channels: each one is retried on its own when it fails. */
export function mailDeliveries(mails: PayloadLeadMails, mailer: Mailer): LeadDelivery[] {
  return [
    {
      channel: 'mail:client',
      audience: 'customer',
      deliver: async (lead) => {
        const sent = await mailer.send(await mails.forCustomer(lead))
        return sent.viewKey === null ? {} : { viewKey: sent.viewKey }
      },
    },
    {
      channel: 'mail:manager',
      audience: 'staff',
      deliver: async (lead, delivered) => {
        await mailer.send(await mails.forStaff(lead, delivered))
        return {}
      },
    },
  ]
}
