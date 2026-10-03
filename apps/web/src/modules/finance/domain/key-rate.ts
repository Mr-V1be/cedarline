/** Interest rates are kept in basis points: 14.25 % is 1425. Never a float percentage. */
export type BasisPoints = number

export const BASIS_POINTS_PER_PERCENT = 100

export const percentToBasisPoints = (percent: number): BasisPoints =>
  Math.round(percent * BASIS_POINTS_PER_PERCENT)

export const basisPointsToPercent = (rate: BasisPoints): number => rate / BASIS_POINTS_PER_PERCENT

/** The Bank of Russia key rate and the day it took effect. */
export interface KeyRate {
  readonly rate: BasisPoints
  readonly effectiveFrom: Date
}

/** The key rate as the site knows it: when it was read and whether the source answered. */
export interface KeyRateReading {
  readonly keyRate: KeyRate
  readonly fetchedAt: Date
  /** The source did not answer the last time it was asked; this is the last known value. */
  readonly stale: boolean
}
