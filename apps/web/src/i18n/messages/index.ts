import type { Locale } from '../locales'
import type { Messages } from './types'

const loaders: Record<Locale, () => Promise<{ default: Messages }>> = {
  ru: () => import('./ru'),
  en: () => import('./en'),
}

export async function loadMessages(locale: Locale): Promise<Messages> {
  return (await loaders[locale]()).default
}

export type { Messages, Namespace } from './types'
