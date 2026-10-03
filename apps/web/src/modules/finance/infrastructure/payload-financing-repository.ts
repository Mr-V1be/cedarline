import type { Payload } from 'payload'

import { FinanceError } from '../domain/finance-error'
import { validateFinancingTerms, type FinancingTerms } from '../domain/financing-terms'
import type { FinancingRepository } from '../ports/financing-repository'
import { toFinancingTerms } from './financing-mapper'

export class PayloadFinancingRepository implements FinancingRepository {
  constructor(private readonly payload: Payload) {}

  async load(): Promise<FinancingTerms | null> {
    const stored = await this.payload.findGlobal({
      slug: 'financing',
      depth: 0,
      overrideAccess: false,
    })
    // A global that was never saved comes back empty; such terms are not offered.
    try {
      return validateFinancingTerms(toFinancingTerms(stored))
    } catch (error) {
      if (error instanceof FinanceError) return null
      throw error
    }
  }
}
