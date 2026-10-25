/**
 * Demo exchange rate for the English site: 85 rubles per US dollar, set on 1 October 2026. An
 * illustrative 2026 figure in the range forecasts gave for the year, not a market quote; on a
 * real site sales staff keep the rate in the CMS («Exchange rates»).
 */
export const EXCHANGE_RATES = [
  { currency: 'USD', rate: 85, setOn: '2026-10-01T09:00:00.000Z' },
] as const
