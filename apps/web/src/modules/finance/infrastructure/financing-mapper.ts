import type { Financing } from '@/cms/generated/payload-types'

import type { FinancingTerms } from '../domain/financing-terms'
import { percentToBasisPoints } from '../domain/key-rate'

/** The financing global as stored (margin in percentage points) → domain terms. */
export function toFinancingTerms(
  source: Pick<Financing, 'mortgage' | 'installment'>,
): FinancingTerms {
  const { mortgage, installment } = source
  return {
    mortgage: {
      margin: percentToBasisPoints(mortgage.margin),
      minDownPercent: mortgage.minDownPercent,
      defaultDownPercent: mortgage.defaultDownPercent,
      minYears: mortgage.minYears,
      maxYears: mortgage.maxYears,
      defaultYears: mortgage.defaultYears,
    },
    installment: {
      interestFreeMonths: installment.interestFreeMonths,
      maxMonths: installment.maxMonths,
      defaultMonths: installment.defaultMonths,
      minDownPercent: installment.minDownPercent,
      defaultDownPercent: installment.defaultDownPercent,
      keyRateShare: installment.keyRateShare,
    },
  }
}
