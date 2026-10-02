import type { Locale } from '@/i18n/locales'

import type { ConfigurationSnapshot, SavedConfiguration } from '../domain/snapshot'

export interface NewSavedConfiguration {
  readonly code: string
  readonly projectId: number
  readonly locale: Locale
  readonly snapshot: ConfigurationSnapshot
  readonly renderId: number | null
}

export interface SavedConfigurationRepository {
  create(configuration: NewSavedConfiguration): Promise<SavedConfiguration>
  findByCode(code: string): Promise<SavedConfiguration | null>
  attachProposal(id: number, documentId: number): Promise<void>
}
