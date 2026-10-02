'use client'

import { useTranslations } from 'next-intl'
import { useMemo } from 'react'

import type { ConfiguratorView } from '../application/open-configurator'
import {
  createVocabulary,
  designsOf,
  type Translate,
  type Vocabulary,
} from '../application/vocabulary'

/** The configurator's words in the page language. */
export function useVocabulary(view: Pick<ConfiguratorView, 'model' | 'names'>): Vocabulary {
  const t = useTranslations('configurator')
  const registry = useTranslations('registry')
  return useMemo(
    () =>
      createVocabulary({
        // next-intl translators are typed per key; the vocabulary builds keys from data.
        t: t as unknown as Translate,
        registry: registry as unknown as Translate,
        names: view.names,
        designs: designsOf(view.model.family),
      }),
    [registry, t, view.model.family, view.names],
  )
}
