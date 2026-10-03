import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { DEFAULT_LOCALE, LOCALES, LOCALE_DEFINITIONS, type Locale } from '@/i18n/locales'
import { getPathname } from '@/i18n/navigation'
import type { ImageAsset } from '@/modules/catalog/domain/project'

import { PREVIEW_SIZE } from '../ports/preview-images'

/** File name of the site-wide preview: the render of the project the home page leads with. */
export const SITE_PREVIEW = 'site.jpg'
const PREVIEW_PATH = '/files/og'

/** An image for link previews: a render of our scene or a scheme, never a stock photo. */
export interface PreviewImage {
  readonly url: string
  readonly alt: string
  readonly width: number
  readonly height: number
}

/** A preview cut from a render; pages without a picture of their own use the site's. */
export const previewOf = (image: ImageAsset | null, siteAlt: string): PreviewImage =>
  image === null
    ? { url: `${PREVIEW_PATH}/${SITE_PREVIEW}`, alt: siteAlt, ...PREVIEW_SIZE }
    : { url: `${PREVIEW_PATH}/${image.id}.jpg`, alt: image.alt, ...PREVIEW_SIZE }

export interface PageMetadataInput {
  readonly locale: Locale
  /** Path without the locale prefix, e.g. `/projects/sosny`. */
  readonly path: string
  readonly title: string
  readonly description: string
  /** The page's own render; the site's preview is used without one. */
  readonly picture?: ImageAsset | null
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
export async function pageMetadata(input: PageMetadataInput): Promise<Metadata> {
  const t = await getTranslations({ locale: input.locale, namespace: 'common' })
  const canonical = localizedPath(input.locale, input.path)
  const alternates: Array<[string, string]> = [
    ...LOCALES.map((locale): [string, string] => [
      LOCALE_DEFINITIONS[locale].tag,
      localizedPath(locale, input.path),
    ]),
    ['x-default', localizedPath(DEFAULT_LOCALE, input.path)],
  ]
  const languages = Object.fromEntries(alternates)
  const images = [previewOf(input.picture ?? null, t('meta.previewAlt'))]
  return {
    title: input.title,
    description: input.description,
    alternates: { canonical, languages },
    openGraph: {
      title: input.title,
      description: input.description,
      url: canonical,
      siteName: t('brand.name'),
      type: input.type ?? 'website',
      locale: LOCALE_DEFINITIONS[input.locale].openGraph,
      images,
    },
    twitter: {
      card: 'summary_large_image',
      title: input.title,
      description: input.description,
      images: images.map((image) => image.url),
    },
    ...(input.indexable === false ? { robots: { index: false, follow: false } } : {}),
  }
}
