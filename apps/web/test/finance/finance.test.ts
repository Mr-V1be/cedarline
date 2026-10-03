import { Money } from '@kedrovnik/pricing'
import { describe, expect, it } from 'vitest'

import { FinanceError } from '@/modules/finance/domain/finance-error'
import {
  validateFinancingTerms,
  type FinancingTerms,
} from '@/modules/finance/domain/financing-terms'
import {
  annuityPayment,
  installmentPlan,
  mortgagePlan,
  percentOf,
} from '@/modules/finance/domain/payment-plan'

const terms: FinancingTerms = {
  mortgage: {
    margin: 300,
    minDownPercent: 20,
    defaultDownPercent: 30,
    minYears: 3,
    maxYears: 30,
    defaultYears: 20,
  },
  installment: {
    interestFreeMonths: 6,
    maxMonths: 24,
    defaultMonths: 12,
    minDownPercent: 30,
    defaultDownPercent: 40,
    keyRateShare: 50,
  },
}
const keyRate = { rate: 1400, effectiveFrom: new Date('2026-07-27') }
const price = Money.ofRubles(5_000_000)

describe('annuity', () => {
  it('matches the textbook formula, rounded up to the kopeck', () => {
    // 1 000 000 ₽ at 12 % a year for 12 months: 88 848.79 ₽ a month.
    expect(annuityPayment(Money.ofRubles(1_000_000), 1200, 12)).toBe(8_884_879)
  })

  it('splits an interest-free loan evenly', () => {
    expect(annuityPayment(Money.ofRubles(1_200_000), 0, 12)).toBe(Money.ofRubles(100_000))
  })
})

describe('mortgage', () => {
  it('charges the key rate plus the bank margin on the loan', () => {
    const plan = mortgagePlan(
      { price, downPayment: percentOf(price, 30), term: 20 },
      terms,
      keyRate,
    )
    expect(plan.rate).toBe(1700)
    expect(plan.loan).toBe(Money.ofRubles(3_500_000))
    expect(plan.months).toBe(240)
    expect(plan.total).toBe(Money.add(plan.downPayment, Money.ofKopecks(plan.monthly * 240)))
    expect(plan.overpayment).toBeGreaterThan(0)
  })

  it('refuses a down payment below the minimum and a term outside the range', () => {
    const tooLow = () =>
      mortgagePlan({ price, downPayment: percentOf(price, 10), term: 20 }, terms, keyRate)
    expect(tooLow).toThrow(FinanceError)
    const tooLong = () =>
      mortgagePlan({ price, downPayment: percentOf(price, 30), term: 31 }, terms, keyRate)
    expect(tooLong).toThrow(/term/)
  })
})

describe('instalments', () => {
  it('cost nothing extra within the interest-free period', () => {
    const plan = installmentPlan(
      { price, downPayment: percentOf(price, 40), term: 6 },
      terms,
      keyRate,
    )
    expect(plan.rate).toBe(0)
    expect(plan.overpayment).toBe(0)
    expect(plan.total).toBe(price)
    expect(plan.monthly).toBe(Money.ofRubles(500_000))
  })

  it('charge the configured share of the key rate beyond it', () => {
    const plan = installmentPlan(
      { price, downPayment: percentOf(price, 40), term: 12 },
      terms,
      keyRate,
    )
    expect(plan.rate).toBe(700)
    expect(plan.overpayment).toBeGreaterThan(0)
  })
})

describe('financing terms', () => {
  it('accept consistent terms and refuse a default outside its range', () => {
    expect(validateFinancingTerms(terms)).toBe(terms)
    const broken = { ...terms, mortgage: { ...terms.mortgage, defaultYears: 40 } }
    expect(() => validateFinancingTerms(broken)).toThrow(FinanceError)
  })
})
