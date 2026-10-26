import sharp from 'sharp'

import { BRAND_COLOURS, markSvg } from '@/ui/brand/brand'

/**
 * The home-screen icon of phones and the logo in the structured data: the mark on a full pine
 * square (the system rounds the corners itself), rendered to PNG at build time.
 */
export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default async function AppleIcon() {
  const svg = markSvg({
    size: size.width,
    colour: BRAND_COLOURS.paper,
    tile: { colour: BRAND_COLOURS.pine, radius: 0 },
    scale: 0.64,
    weight: 1.15,
  })
  const png = await sharp(Buffer.from(svg)).png().toBuffer()
  return new Response(new Uint8Array(png), { headers: { 'content-type': contentType } })
}
