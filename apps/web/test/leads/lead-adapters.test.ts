import { afterEach, describe, expect, it, vi } from 'vitest'

import type { Lead } from '@/modules/leads/domain/lead-record'
import { BASE_DISPLAY } from '@/modules/pricing/domain/exchange-rate'
import { Bitrix24LeadSink } from '@/modules/leads/infrastructure/bitrix24-lead-sink'
import { escapeHtml, renderMailHtml } from '@/modules/leads/infrastructure/mail-layout'

const lead: Lead = {
  contact: {
    name: 'Анна',
    phone: '+70004123785',
    email: 'anna@example.ru',
    comment: 'После 18:00',
  },
  locale: 'ru',
  submittedAt: new Date('2026-10-03T10:00:00Z'),
  configurationId: 7,
  projectSlug: 'kedr',
  summary: {
    code: 'abcdefghjkmn',
    projectTitle: 'Кедр',
    description: 'Кедр · 10 × 9 м · Под ключ',
    total: 6_308_000,
    prices: BASE_DISPLAY,
    totalWeeks: 18,
    link: 'https://cedarline.example/c/abcdefghjkmn',
  },
  proposal: { documentId: 3, filename: 'kp.pdf', data: Buffer.from('%PDF') },
}

describe('Bitrix24 lead sink', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('adds a lead through the incoming webhook', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ result: 41 })))
    vi.stubGlobal('fetch', fetch)
    const receipt = await new Bitrix24LeadSink('https://crm.example/rest/1/token/').submit(lead)
    expect(receipt).toEqual({ channel: 'bitrix24', reference: '41' })
    const [url, init] = fetch.mock.calls[0] as [URL, RequestInit]
    expect(String(url)).toBe('https://crm.example/rest/1/token/crm.lead.add.json')
    const body = JSON.parse(init.body as string) as { fields: Record<string, unknown> }
    expect(body.fields).toMatchObject({
      TITLE: 'Кедр · 10 × 9 м · Под ключ',
      NAME: 'Анна',
      PHONE: [{ VALUE: '+70004123785', VALUE_TYPE: 'WORK' }],
      OPPORTUNITY: 6_308_000,
      CURRENCY_ID: 'RUB',
    })
  })

  it('reports CRM errors', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify({ error: 'INVALID_CREDENTIALS' }), { status: 401 }),
        ),
    )
    await expect(
      new Bitrix24LeadSink('https://crm.example/rest/1/x/').submit(lead),
    ).rejects.toThrow('INVALID_CREDENTIALS')
  })
})

describe('mail layout', () => {
  it('escapes every value', () => {
    expect(escapeHtml('<b>"&\'</b>')).toBe('&lt;b&gt;&quot;&amp;&#39;&lt;/b&gt;')
    const html = renderMailHtml({
      preheader: 'p',
      heading: '<script>',
      paragraphs: ['a & b'],
      rows: [{ label: 'Имя', value: '<img src=x>' }],
      action: { label: 'Open', href: 'https://x.example/?a=1&b="2"' },
      footer: [],
    })
    expect(html).not.toContain('<script>')
    expect(html).not.toContain('<img src=x>')
    expect(html).toContain('href="https://x.example/?a=1&amp;b=&quot;2&quot;"')
  })
})
