/** A value authored in every site language. */
export interface Localized {
  readonly ru: string
  readonly en: string
}

export const t = (ru: string, en: string): Localized => ({ ru, en })
