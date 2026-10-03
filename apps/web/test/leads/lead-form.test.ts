import { describe, expect, it } from 'vitest'

import { normalisePhone, validateLeadForm } from '@/modules/leads/domain/lead'

const valid = {
  name: ' Анна Смирнова ',
  phone: '8 (000) 412-37-85',
  email: 'Anna@Example.ru',
  comment: '',
  consent: 'true',
}

describe('lead form', () => {
  it.each([
    // Demo numbers come from the 0xx range, which no Russian number starts with.
    ['8 000 412-37-85', '+70004123785'],
    ['+7 (000) 412 37 85', '+70004123785'],
    ['0004123785', null],
    ['+44 20 7946 0958', '+442079460958'],
    ['555-12-34', null],
    ['44 20 7946 0958', null],
  ])('normalises %s', (raw, expected) => {
    expect(normalisePhone(raw)).toBe(expected)
  })

  it('accepts and normalises a complete form', () => {
    expect(validateLeadForm(valid)).toEqual({
      ok: true,
      contact: {
        name: 'Анна Смирнова',
        phone: '+70004123785',
        email: 'anna@example.ru',
        comment: '',
      },
    })
  })

  it('names every problem by field', () => {
    expect(
      validateLeadForm({
        name: '',
        phone: '12',
        email: 'anna@',
        comment: 'x'.repeat(1001),
        consent: false,
      }),
    ).toEqual({
      ok: false,
      errors: {
        name: 'required',
        phone: 'invalid',
        email: 'invalid',
        comment: 'tooLong',
        consent: 'required',
      },
    })
    expect(validateLeadForm({ ...valid, phone: '', email: '' })).toMatchObject({
      errors: { phone: 'required', email: 'required' },
    })
  })
})
