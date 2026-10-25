import type { Payload } from 'payload'

import { storeDisplayCurrency } from '@/modules/pricing/domain/exchange-rate'

import type { Lead, LeadReceipt } from '../domain/lead-record'
import type { LeadSink } from '../ports/lead-sink'

const SYSTEM = { overrideAccess: true, depth: 0 } as const

/** Internal leads: the lead becomes a CMS document the sales team works with. */
export class CmsLeadSink implements LeadSink {
  readonly channel = 'cms'

  constructor(
    private readonly payload: Payload,
    private readonly adminUrl: (id: number) => string,
  ) {}

  async submit(lead: Lead): Promise<LeadReceipt> {
    const project = await this.payload.find({
      ...SYSTEM,
      collection: 'projects',
      limit: 1,
      where: { slug: { equals: lead.projectSlug } },
      select: {},
    })
    const document = await this.payload.create({
      ...SYSTEM,
      collection: 'leads',
      data: {
        status: 'new',
        name: lead.contact.name,
        phone: lead.contact.phone,
        email: lead.contact.email,
        comment: lead.contact.comment,
        summary: lead.summary.description,
        link: lead.summary.link,
        total: lead.summary.total,
        display: storeDisplayCurrency(lead.summary.prices),
        locale: lead.locale,
        configuration: lead.configurationId,
        ...(project.docs[0] === undefined ? {} : { project: project.docs[0].id }),
        proposal: lead.proposal.documentId,
        consentAt: lead.submittedAt.toISOString(),
        deliveries: [],
      },
    })
    return {
      channel: this.channel,
      reference: String(document.id),
      url: this.adminUrl(document.id),
    }
  }
}
