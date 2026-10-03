import type { LeadDelivery } from '../ports/lead-delivery'
import type { LeadSink } from '../ports/lead-sink'

/** Another lead sink (an external CRM) as a delivery channel after the system of record. */
export const sinkDelivery = (sink: LeadSink): LeadDelivery => ({
  channel: sink.channel,
  audience: 'staff',
  deliver: async (lead) => ({ reference: (await sink.submit(lead)).reference }),
})
