import { readFile } from 'node:fs/promises'
import path from 'node:path'

import type { Payload } from 'payload'
import sharp from 'sharp'

import { PREVIEW_SIZE, type PreviewImages } from '../ports/preview-images'

/** Upload directory of the media collection, relative to the server's working directory. */
const MEDIA_DIRECTORY = path.resolve(process.cwd(), 'media')
const JPEG_QUALITY = 82

/** Crops a public media image to the preview frame and encodes it as JPEG, which every network reads. */
export class SharpPreviewImages implements PreviewImages {
  constructor(private readonly payload: Payload) {}

  async fromMedia(id: number): Promise<Buffer | null> {
    const media = await this.payload
      .findByID({ collection: 'media', id, depth: 0, overrideAccess: false })
      .catch(() => null)
    if (media?.filename === null || media?.filename === undefined) return null
    const source = await readFile(path.join(MEDIA_DIRECTORY, path.basename(media.filename))).catch(
      () => null,
    )
    if (source === null) return null
    return sharp(source)
      .resize(PREVIEW_SIZE.width, PREVIEW_SIZE.height, { fit: 'cover', position: 'attention' })
      .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
      .toBuffer()
  }
}
