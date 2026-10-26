import { BRAND_COLOURS, markSvg } from '@/ui/brand/brand'

/** The browser tab icon: the mark on a pine tile, as a vector so it is sharp at every size. */
export const contentType = 'image/svg+xml'

const ICON = markSvg({
  size: 32,
  colour: BRAND_COLOURS.paper,
  tile: { colour: BRAND_COLOURS.pine, radius: 7 },
  scale: 0.8,
  weight: 1.4,
})

export default function Icon() {
  return new Response(ICON, { headers: { 'content-type': contentType } })
}
