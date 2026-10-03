/**
 * Demo financing terms: a partner bank's mortgage at the key rate plus a margin, and the
 * factory's own instalment plan, interest-free for the first months.
 */
export const FINANCING = {
  mortgage: {
    margin: 3,
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
} as const
