import { describe, expect, it } from 'vitest'

import { normalisePhone, validateLeadForm } from '@/modules/leads/domain/lead'

const valid = {
  name: ' Анна Смирнова ',
  phone: '8 (921) 555-12-34',
  email: 'Anna@Example.ru',
  comment: '',
  consent: 'true',
}

describe('lead form', () => {
  it.each([
    ['8 921 555-12-34', '+79215551234'],
    ['+7 (921) 555 12 34', '+79215551234'],
    ['9215551234', '+79215551234'],
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
        phone: '+79215551234',
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
