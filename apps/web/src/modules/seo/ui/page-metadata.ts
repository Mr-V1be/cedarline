import type { Metadata } from 'next'

import { DEFAULT_LOCALE, LOCALES, LOCALE_DEFINITIONS, type Locale } from '@/i18n/locales'
import { getPathname } from '@/i18n/navigation'

/** An image for link previews: a render of our scene or a scheme, never a stock photo. */
export interface PreviewImage {
  readonly url: string
  readonly alt: string
  readonly width?: number
  readonly height?: number
}

export interface PageMetadataInput {
  readonly locale: Locale
  /** Path without the locale prefix, e.g. `/projects/sosny`. */
  readonly path: string
  readonly title: string
  readonly description: string
  readonly image?: PreviewImage | null
  readonly type?: 'website' | 'article'
  /** Pages people reach only by a private link stay out of search results. */
  readonly indexable?: boolean
}

/** Path of a page in a locale: Russian at the root, other languages under their prefix. */
export const localizedPath = (locale: Locale, path: string): string =>
  getPathname({ href: path, locale })

/**
 * Metadata every public page shares: canonical address, language alternates for search
 * engines, and Open Graph and Twitter previews with a render of the house.
 */
export function pageMetadata(input: PageMetadataInput): Metadata {
  const canonical = localizedPath(input.locale, input.path)
  const alternates: Array<[string, string]> = [
    ...LOCALES.map((locale): [string, string] => [
      LOCALE_DEFINITIONS[locale].tag,
      localizedPath(locale, input.path),
    ]),
    ['x-default', localizedPath(DEFAULT_LOCALE, input.path)],
  ]
  const languages = Object.fromEntries(alternates)
  const images =
    input.image === undefined || input.image === null
      ? undefined
      : [
          {
            url: input.image.url,
            alt: input.image.alt,
            ...(input.image.width === undefined ? {} : { width: input.image.width }),
            ...(input.image.height === undefined ? {} : { height: input.image.height }),
          },
        ]
  return {
    title: input.title,
    description: input.description,
    alternates: { canonical, languages },
    openGraph: {
      title: input.title,
      description: input.description,
      url: canonical,
      type: input.type ?? 'website',
      locale: LOCALE_DEFINITIONS[input.locale].openGraph,
      ...(images === undefined ? {} : { images }),
    },
    twitter: {
      card: images === undefined ? 'summary' : 'summary_large_image',
      title: input.title,
      description: input.description,
      ...(images === undefined ? {} : { images: images.map((image) => image.url) }),
    },
    ...(input.indexable === false ? { robots: { index: false, follow: false } } : {}),
  }
}
