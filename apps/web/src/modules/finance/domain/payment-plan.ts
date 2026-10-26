import { Money } from '@cedarline/pricing'

import { FinanceError } from './finance-error'
import type { FinancingTerms } from './financing-terms'
import type { BasisPoints, KeyRate } from './key-rate'

/** Ways to pay for a house over time; the calculator offers each with its own term unit. */
export const FINANCING_KINDS = {
  mortgage: { termUnit: 'years' },
  installment: { termUnit: 'months' },
} as const
export type FinancingKind = keyof typeof FINANCING_KINDS
export const FINANCING_KIND_KEYS = Object.keys(FINANCING_KINDS) as FinancingKind[]

export interface PlanRequest {
  readonly price: Money
  readonly downPayment: Money
  /** Term in the kind's unit: years for a mortgage, months for an instalment plan. */
  readonly term: number
}

export interface PaymentPlan {
  readonly kind: FinancingKind
  readonly rate: BasisPoints
  readonly downPayment: Money
  readonly loan: Money
  readonly months: number
  readonly monthly: Money
  /** Everything paid over the term above the loan. */
  readonly overpayment: Money
  /** Down payment plus every monthly payment. */
  readonly total: Money
}

const MONTHS_PER_YEAR = 12
const BASIS_POINTS_PER_UNIT = 10_000
const PERCENT = 100

/**
 * Annuity: equal monthly payments that repay the loan with interest on the remaining balance,
 * rounded up to the kopeck so the last payment never falls short.
 */
export function annuityPayment(loan: Money, annualRate: BasisPoints, months: number): Money {
  if (loan === 0) return Money.zero
  if (annualRate === 0) return Money.ofKopecks(Math.ceil(loan / months))
  const monthlyRate = annualRate / BASIS_POINTS_PER_UNIT / MONTHS_PER_YEAR
  const factor = monthlyRate / (1 - (1 + monthlyRate) ** -months)
  return Money.ofKopecks(Math.ceil(loan * factor))
}

/** Share of the price, rounded up to the kopeck. */
export const percentOf = (price: Money, percent: number): Money =>
  Money.ofKopecks(Math.ceil((price * percent) / PERCENT))

function assertRequest(request: PlanRequest, minDownPercent: number) {
  if (!(request.price > 0)) throw new FinanceError('INVALID_PRICE', 'The price must be positive')
  if (
    request.downPayment < percentOf(request.price, minDownPercent) ||
    request.downPayment >= request.price
  ) {
    throw new FinanceError(
      'DOWN_PAYMENT_OUT_OF_RANGE',
      `The down payment must be from ${minDownPercent} % to less than the price`,
    )
  }
}

function plan(
  kind: FinancingKind,
  request: PlanRequest,
  months: number,
  rate: BasisPoints,
): PaymentPlan {
  const loan = Money.subtract(request.price, request.downPayment)
  const monthly = annuityPayment(loan, rate, months)
  // Without interest the last payment is the remainder, so nothing is paid above the loan.
  const paid = rate === 0 ? loan : Money.ofKopecks(monthly * months)
  return {
    kind,
    rate,
    downPayment: request.downPayment,
    loan,
    months,
    monthly,
    overpayment: Money.subtract(paid, loan),
    total: Money.add(request.downPayment, paid),
  }
}

/** Mortgage: the key rate plus the bank's margin, term in years. */
export function mortgagePlan(
  request: PlanRequest,
  terms: FinancingTerms,
  keyRate: KeyRate,
): PaymentPlan {
  const { mortgage } = terms
  assertRequest(request, mortgage.minDownPercent)
  if (
    !Number.isInteger(request.term) ||
    request.term < mortgage.minYears ||
    request.term > mortgage.maxYears
  ) {
    throw new FinanceError(
      'TERM_OUT_OF_RANGE',
      `The term must be ${mortgage.minYears}–${mortgage.maxYears} years`,
    )
  }
  return plan('mortgage', request, request.term * MONTHS_PER_YEAR, keyRate.rate + mortgage.margin)
}

/** Instalments: free of interest within the free period, a share of the key rate beyond it. */
export function installmentPlan(
  request: PlanRequest,
  terms: FinancingTerms,
  keyRate: KeyRate,
): PaymentPlan {
  const { installment } = terms
  assertRequest(request, installment.minDownPercent)
  if (!Number.isInteger(request.term) || request.term < 1 || request.term > installment.maxMonths) {
    throw new FinanceError(
      'TERM_OUT_OF_RANGE',
      `The term must be 1–${installment.maxMonths} months`,
    )
  }
  const rate =
    request.term <= installment.interestFreeMonths
      ? 0
      : Math.round((keyRate.rate * installment.keyRateShare) / PERCENT)
  return plan('installment', request, request.term, rate)
}

export const PLANNERS: Readonly<
  Record<
    FinancingKind,
    (request: PlanRequest, terms: FinancingTerms, keyRate: KeyRate) => PaymentPlan
  >
> = { mortgage: mortgagePlan, installment: installmentPlan }
