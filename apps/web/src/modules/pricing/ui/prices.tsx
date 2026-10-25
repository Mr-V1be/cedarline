'use client'

import { createContext, use, useMemo, type ReactNode } from 'react'

import { createPriceFormatter, type PriceFormatter } from '../application/price-formatter'
import type { DisplayCurrency } from '../domain/exchange-rate'

const PricesContext = createContext<DisplayCurrency | null>(null)

/**
 * The display currency of the client tree below: the site layout gives the visitor's, a saved
 * configuration nests its own (the rates it was saved with).
 */
export function PricesProvider({
  value,
  children,
}: {
  readonly value: DisplayCurrency
  readonly children: ReactNode
}) {
  return <PricesContext value={value}>{children}</PricesContext>
}

/** Prices of the tree as the visitor reads them; outside a provider it is a wiring error. */
export function usePrices(): PriceFormatter {
  const display = use(PricesContext)
  if (display === null) throw new Error('usePrices needs a PricesProvider above it')
  return useMemo(() => createPriceFormatter(display), [display])
}
