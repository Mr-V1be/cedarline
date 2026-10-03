import type { Media } from '@/cms/generated/payload-types'

import type { ImageAsset } from '../domain/project'

/**
 * Payload prefixes file URLs with the server URL; files served by this app are referenced by
 * path so the image optimizer treats them as local, whatever host the site runs on.
 */
function sitePath(url: string): string {
  return url.startsWith('/') ? url : new URL(url).pathname
}

/** Payload upload → image; null when the relation is not populated or the file is missing. */
export function toImageAsset(media: number | Media | null | undefined): ImageAsset | null {
  if (media === null || media === undefined || typeof media === 'number') return null
  if (!media.url || !media.width || !media.height) return null
  return {
    id: media.id,
    url: sitePath(media.url),
    width: media.width,
    height: media.height,
    alt: media.alt,
  }
}
