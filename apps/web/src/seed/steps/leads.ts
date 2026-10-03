import { readFileSync } from 'node:fs'

import type { Payload } from 'payload'

import { siteServices } from '@/composition/site-services'
import { openConfigurator } from '@/modules/configurator/application/open-configurator'
import { saveConfiguration } from '@/modules/configurator/application/save-configuration'
import { submitLead } from '@/modules/leads/application/submit-lead'

import { DEMO_LEADS } from '../data/leads'
import { renderFile } from './media'
import { SEED } from './upsert'

/**
 * Sample leads made the way visitors make them: a saved configuration with its render, the PDF
 * proposal, the letters in the demo mailbox and the deliveries. Keyed by the customer's address,
 * so a repeated seed adds nothing.
 */
export async function seedLeads(payload: Payload): Promise<number> {
  const services = siteServices(payload, 'ru')
  let created = 0
  for (const lead of DEMO_LEADS) {
    const where = { email: { equals: lead.email } }
    const { totalDocs } = await payload.count({ ...SEED, collection: 'leads', where })
    if (totalDocs > 0) continue
    const view = await openConfigurator(services.configurator, lead.project, 'ru')
    if (view === null) throw new Error(`Demo lead: project ${lead.project} is not offered`)
    const saved = await saveConfiguration(services.saving, {
      configuration: { ...view.initial, ...lead.changes },
      locale: 'ru',
      render: readFileSync(renderFile(lead.render)),
    })
    if (!saved.ok) throw new Error(`Demo lead for ${lead.project}: ${saved.reason} configuration`)
    const result = await submitLead(services.leads, {
      form: {
        name: lead.name,
        phone: lead.phone,
        email: lead.email,
        comment: lead.comment,
        consent: 'true',
      },
      code: saved.code,
      locale: 'ru',
      trap: '',
    })
    if (!result.ok) throw new Error(`Demo lead for ${lead.email} was refused: ${result.reason}`)
    if (lead.status !== 'new' || lead.notes !== '') {
      await payload.update({
        ...SEED,
        collection: 'leads',
        where,
        data: { status: lead.status, notes: lead.notes },
      })
    }
    created += 1
  }
  return created
}
