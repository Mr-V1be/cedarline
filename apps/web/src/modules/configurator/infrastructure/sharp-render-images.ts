import sharp from 'sharp'

import type { RenderImages } from '../ports/render-images'

/** Bounds of an accepted capture: a desktop canvas at 2× fits, anything bigger is not a capture. */
const MAX_BYTES = 3 * 1024 * 1024
const MAX_EDGE = 4096
/** Stored renders are this wide at most: enough for an A4 proposal at print resolution. */
const STORED_WIDTH = 1800
const JPEG_QUALITY = 84

/**
 * Decodes the capture, rejects anything that is not a sane image and re-encodes it, which
 * also strips whatever metadata a client could have embedded.
 */
export class SharpRenderImages implements RenderImages {
  async normalise(image: Buffer): Promise<Buffer> {
    if (image.byteLength > MAX_BYTES) throw new Error('Render is too large')
    const pipeline = sharp(image, { limitInputPixels: MAX_EDGE * MAX_EDGE, failOn: 'error' })
    const { width, height, format } = await pipeline.metadata()
    if (format !== 'jpeg' && format !== 'png' && format !== 'webp') {
      throw new Error('Render must be an image')
    }
    if (width > MAX_EDGE || height > MAX_EDGE) {
      throw new Error('Render has unexpected dimensions')
    }
    return pipeline
      .rotate()
      .resize({ width: STORED_WIDTH, withoutEnlargement: true })
      .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
      .toBuffer()
  }
}
