import type { FinancingTerms } from '../domain/financing-terms'

export interface FinancingRepository {
  /** The current terms; null until the terms are filled in. */
  load(): Promise<FinancingTerms | null>
}
