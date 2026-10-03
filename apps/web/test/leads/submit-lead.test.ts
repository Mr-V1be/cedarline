import { initialConfiguration } from '@kedrovnik/configurator'
import { beforeEach, describe, expect, it } from 'vitest'

import { saveConfiguration } from '@/modules/configurator/application/save-configuration'
import { retryDelivery } from '@/modules/leads/application/retry-delivery'
import { submitLead, type SubmitLeadDeps } from '@/modules/leads/application/submit-lead'
import type { DeliveryOutcome, Lead, LeadReceipt } from '@/modules/leads/domain/lead-record'
import { sinkDelivery } from '@/modules/leads/infrastructure/sink-delivery'
import type { LeadDelivery } from '@/modules/leads/ports/lead-delivery'
import type { LeadSink } from '@/modules/leads/ports/lead-sink'

import {
  MemoryDocuments,
  MemorySavedConfigurations,
  codesFrom,
  configuratorDeps,
  proposalDeps,
} from '../support/fakes'
import { seedModel } from '../support/seed-model'

const model = seedModel('sosny')
const CODE = 'snwsnwsnwsnw'
const form = {
  name: 'Иван',
  phone: '+7 921 000-00-00',
  email: 'ivan@example.ru',
  comment: 'Участок в Луге',
  consent: 'true',
}

class RecordingSink implements LeadSink {
  readonly leads: Lead[] = []
  constructor(
    readonly channel: string,
    private readonly fail = false,
  ) {}
  submit(lead: Lead): Promise<LeadReceipt> {
    if (this.fail) return Promise.reject(new Error(`${this.channel} is down`))
    this.leads.push(lead)
    return Promise.resolve({
      channel: this.channel,
      reference: `${this.channel}-${this.leads.length}`,
    })
  }
}

/** A letter channel that keeps a copy (the demo mailbox) and can be switched off. */
class RecordingMail implements LeadDelivery {
  readonly sent: Lead[] = []
  failing = false
  constructor(
    readonly channel: string,
    readonly audience: 'customer' | 'staff',
  ) {}
  deliver(lead: Lead) {
    if (this.failing) return Promise.reject(new Error(`${this.channel} is down`))
    this.sent.push(lead)
    return Promise.resolve({ viewKey: `${this.channel}-key-${this.sent.length}` })
  }
}

describe('submitLead', () => {
  let saved: MemorySavedConfigurations
  let journal: Array<{ reference: string; outcomes: readonly DeliveryOutcome[] }>
  let retries: Array<{ reference: string; channel: string }>
  let cms: RecordingSink
  let customerMail: RecordingMail
  let staffMail: RecordingMail

  const deps = (secondary: LeadSink[] = []): SubmitLeadDeps => ({
    saved,
    proposals: proposalDeps(saved, new MemoryDocuments()).deps,
    primary: cms,
    deliveries: [...secondary.map(sinkDelivery), customerMail, staffMail],
    journal: {
      record: (reference, outcomes) => {
        journal.push({ reference, outcomes })
        return Promise.resolve()
      },
      delivered: (reference) => Promise.resolve([{ channel: 'cms', reference }]),
    },
    queue: {
      retry: (reference, channel) => {
        retries.push({ reference, channel })
        return Promise.resolve()
      },
    },
    describe: (input) => Promise.resolve(`${input.projectTitle} · ${input.completeness}`),
    letterPath: (key) => `/mail/${key}`,
    clock: () => new Date('2026-10-03T10:00:00Z'),
  })

  beforeEach(async () => {
    saved = new MemorySavedConfigurations()
    journal = []
    retries = []
    cms = new RecordingSink('cms')
    customerMail = new RecordingMail('mail:client', 'customer')
    staffMail = new RecordingMail('mail:manager', 'staff')
    await saveConfiguration(
      {
        ...configuratorDeps(model, { sosny: 'Сосны' }),
        saved,
        documents: new MemoryDocuments(),
        renders: { normalise: (image) => Promise.resolve(image) },
        codes: codesFrom(CODE),
        clock: () => new Date('2026-10-03T09:00:00Z'),
      },
      { configuration: initialConfiguration(model), locale: 'ru', render: null },
    )
  })

  it('stores the lead with its proposal, hands it on and logs every delivery', async () => {
    const crm = new RecordingSink('bitrix24')
    const result = await submitLead(deps([crm]), { form, code: CODE, locale: 'ru', trap: '' })
    // The customer is offered their own letter, never the staff copy.
    expect(result).toEqual({ ok: true, reference: 'cms-1', letter: '/mail/mail:client-key-1' })
    const [lead] = cms.leads
    expect(lead?.contact.phone).toBe('+79210000000')
    expect(lead?.summary.description).toBe('Сосны · Тёплый контур')
    expect(lead?.summary.link).toBe(`https://kedrovnik.example/c/${CODE}`)
    expect(lead?.proposal.data.toString()).toContain('%PDF')
    expect(crm.leads).toHaveLength(1)
    expect(journal[0]?.outcomes.map((outcome) => [outcome.channel, outcome.status])).toEqual([
      ['bitrix24', 'delivered'],
      ['mail:client', 'delivered'],
      ['mail:manager', 'delivered'],
    ])
    expect(retries).toEqual([])
  })

  it('keeps the lead when a secondary sink fails and records why', async () => {
    const result = await submitLead(deps([new RecordingSink('bitrix24', true)]), {
      form,
      code: CODE,
      locale: 'ru',
      trap: '',
    })
    expect(result.ok).toBe(true)
    expect(journal[0]?.outcomes[0]).toMatchObject({
      channel: 'bitrix24',
      status: 'failed',
      error: 'bitrix24 is down',
    })
    expect(retries).toEqual([{ reference: 'cms-1', channel: 'bitrix24' }])
  })

  it('queues a failed letter for retries and delivers it on the retry', async () => {
    staffMail.failing = true
    const result = await submitLead(deps(), { form, code: CODE, locale: 'ru', trap: '' })
    expect(result.ok).toBe(true)
    expect(retries).toEqual([{ reference: 'cms-1', channel: 'mail:manager' }])
    const [lead] = cms.leads
    if (lead === undefined) throw new Error('no lead')
    staffMail.failing = false
    const { journal: log } = deps()
    const outcome = await retryDelivery(
      {
        archive: { load: () => Promise.resolve(lead) },
        deliveries: deps().deliveries,
        journal: log,
        clock: () => new Date('2026-10-03T10:05:00Z'),
      },
      'cms-1',
      'mail:manager',
    )
    expect(outcome).toMatchObject({ channel: 'mail:manager', status: 'delivered' })
    expect(staffMail.sent).toHaveLength(1)
    expect(journal.at(-1)?.outcomes).toEqual([outcome])
  })

  it('answers bots in kind and stores nothing', async () => {
    const result = await submitLead(deps(), { form, code: CODE, locale: 'ru', trap: 'http://spam' })
    expect(result).toEqual({ ok: true, reference: 'received', letter: null })
    expect(cms.leads).toHaveLength(0)
  })

  it('returns field errors and unknown codes without side effects', async () => {
    expect(
      await submitLead(deps(), {
        form: { ...form, email: 'nope' },
        code: CODE,
        locale: 'ru',
        trap: '',
      }),
    ).toEqual({ ok: false, reason: 'invalid', errors: { email: 'invalid' } })
    expect(
      await submitLead(deps(), { form, code: 'zzzzzzzzzzzz', locale: 'ru', trap: '' }),
    ).toEqual({
      ok: false,
      reason: 'unknown-configuration',
    })
    expect(cms.leads).toHaveLength(0)
  })

  it('fails loudly when the system of record is down', async () => {
    cms = new RecordingSink('cms', true)
    await expect(submitLead(deps(), { form, code: CODE, locale: 'ru', trap: '' })).rejects.toThrow(
      'cms is down',
    )
  })
})
