import { FinanceError } from './finance-error'
import type { BasisPoints } from './key-rate'

/** Mortgage through a partner bank: the key rate plus the bank's margin. */
export interface MortgageTerms {
  readonly margin: BasisPoints
  readonly minDownPercent: number
  readonly defaultDownPercent: number
  readonly minYears: number
  readonly maxYears: number
  readonly defaultYears: number
}

/** The factory's own instalment plan: interest-free at first, then a share of the key rate. */
export interface InstallmentTerms {
  readonly interestFreeMonths: number
  readonly maxMonths: number
  readonly defaultMonths: number
  readonly minDownPercent: number
  readonly defaultDownPercent: number
  /** Rate after the interest-free period, as a percentage of the key rate. */
  readonly keyRateShare: number
}

/** Financing offered on the site; edited in the CMS. */
export interface FinancingTerms {
  readonly mortgage: MortgageTerms
  readonly installment: InstallmentTerms
}

const PERCENT = 100

function assertRange(name: string, min: number, value: number, max: number) {
  if (!(Number.isInteger(min) && Number.isInteger(value) && Number.isInteger(max))) {
    throw new FinanceError('INVALID_TERMS', `${name} must be whole numbers`)
  }
  if (!(min <= value && value <= max)) {
    throw new FinanceError('INVALID_TERMS', `${name}: ${min} ≤ ${value} ≤ ${max} does not hold`)
  }
}

/** Invariants of the terms; the CMS refuses to save terms that break them. */
export function validateFinancingTerms(terms: FinancingTerms): FinancingTerms {
  const { mortgage, installment } = terms
  if (!Number.isInteger(mortgage.margin) || mortgage.margin < 0) {
    throw new FinanceError('INVALID_TERMS', 'The bank margin must be zero or more')
  }
  assertRange(
    'Mortgage down payment',
    mortgage.minDownPercent,
    mortgage.defaultDownPercent,
    PERCENT - 1,
  )
  assertRange('Mortgage term', mortgage.minYears, mortgage.defaultYears, mortgage.maxYears)
  assertRange(
    'Instalment down payment',
    installment.minDownPercent,
    installment.defaultDownPercent,
    PERCENT - 1,
  )
  assertRange('Instalment term', 1, installment.defaultMonths, installment.maxMonths)
  assertRange('Interest-free period', 0, installment.interestFreeMonths, installment.maxMonths)
  assertRange('Key rate share', 0, installment.keyRateShare, PERCENT)
  return terms
}
