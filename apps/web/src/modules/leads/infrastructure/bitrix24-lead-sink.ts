import { BASE_CURRENCY } from '@/modules/pricing/domain/currencies'

import type { Lead, LeadReceipt } from '../domain/lead-record'
import type { LeadSink } from '../ports/lead-sink'

/** A CRM that does not answer within this time is treated as down; the lead is already safe. */
const TIMEOUT_MS = 10_000

interface Bitrix24Response {
  readonly result?: unknown
  readonly error?: string
  readonly error_description?: string
}

/**
 * External CRM in the Bitrix24 REST dialect: an incoming webhook
 * (`https://<portal>/rest/<user>/<token>/`) and the `crm.lead.add` method. The webhook URL is
 * configuration; the demo points it to the local CRM mock.
 */
export class Bitrix24LeadSink implements LeadSink {
  readonly channel = 'bitrix24'

  constructor(private readonly webhookUrl: string) {}

  async submit(lead: Lead): Promise<LeadReceipt> {
    const { contact, summary } = lead
    const response = await fetch(new URL('crm.lead.add.json', this.webhookUrl), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      body: JSON.stringify({
        fields: {
          TITLE: summary.description,
          NAME: contact.name,
          PHONE: [{ VALUE: contact.phone, VALUE_TYPE: 'WORK' }],
          EMAIL: [{ VALUE: contact.email, VALUE_TYPE: 'WORK' }],
          COMMENTS: [contact.comment, summary.link].filter((line) => line !== '').join('\n\n'),
          SOURCE_ID: 'WEB',
          SOURCE_DESCRIPTION: `configurator ${summary.code}`,
          // The CRM works in the tariff's currency, like the CMS.
          OPPORTUNITY: summary.total,
          CURRENCY_ID: BASE_CURRENCY,
        },
        params: { REGISTER_SONET_EVENT: 'Y' },
      }),
    })
    const body = (await response.json().catch(() => ({}))) as Bitrix24Response
    if (!response.ok || body.error !== undefined) {
      throw new Error(
        `Bitrix24 answered ${response.status}: ${body.error ?? ''} ${body.error_description ?? ''}`.trim(),
      )
    }
    if (typeof body.result !== 'number' && typeof body.result !== 'string') {
      throw new Error('Bitrix24 returned no lead id')
    }
    return { channel: this.channel, reference: String(body.result) }
  }
}
