import { initialConfiguration } from '@kedrovnik/configurator'
import { beforeEach, describe, expect, it } from 'vitest'

import { saveConfiguration } from '@/modules/configurator/application/save-configuration'
import type { DeliveryOutcome, Lead, LeadReceipt } from '@/modules/leads/domain/lead-record'
import { submitLead, type SubmitLeadDeps } from '@/modules/leads/application/submit-lead'
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

describe('submitLead', () => {
  let saved: MemorySavedConfigurations
  let journal: Array<{ primary: LeadReceipt; outcomes: readonly DeliveryOutcome[] }>
  let cms: RecordingSink

  const deps = (secondary: LeadSink[] = []): SubmitLeadDeps => ({
    saved,
    proposals: proposalDeps(saved, new MemoryDocuments()).deps,
    sinks: [cms, ...secondary],
    notifier: {
      notify: () =>
        Promise.resolve([
          { channel: 'mail:client', status: 'delivered', at: new Date() },
          { channel: 'mail:manager', status: 'delivered', at: new Date() },
        ]),
    },
    journal: {
      record: (primary, outcomes) => {
        journal.push({ primary, outcomes })
        return Promise.resolve()
      },
    },
    describe: (input) => Promise.resolve(`${input.projectTitle} · ${input.completeness}`),
    clock: () => new Date('2026-10-03T10:00:00Z'),
  })

  beforeEach(async () => {
    saved = new MemorySavedConfigurations()
    journal = []
    cms = new RecordingSink('cms')
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
    expect(result).toEqual({ ok: true, reference: 'cms-1' })
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
  })

  it('answers bots in kind and stores nothing', async () => {
    const result = await submitLead(deps(), { form, code: CODE, locale: 'ru', trap: 'http://spam' })
    expect(result).toEqual({ ok: true, reference: 'received' })
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
