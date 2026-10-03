import { getServices } from '@/composition/services'
import { DEFAULT_LOCALE } from '@/i18n/locales'
import { SITE_PREVIEW } from '@/modules/seo/ui/page-metadata'

export const dynamic = 'force-dynamic'

/** A day in the browser and the CDN; the render behind a preview rarely changes. */
const CACHE = 'public, max-age=86400, stale-while-revalidate=604800'

/**
 * Link preview images: `<media id>.jpg` cuts a render from the media library to 1200×630;
 * `site.jpg` is the render of the project the home page leads with.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params
  const services = await getServices(DEFAULT_LOCALE)
  const sitePicture = async () => {
    const home = await services.home.load(DEFAULT_LOCALE)
    const hero =
      home.heroProjectSlug === null
        ? null
        : await services.projects.findBySlug(home.heroProjectSlug, DEFAULT_LOCALE)
    return hero?.cover?.id ?? null
  }
  const match = /^(\d{1,9})\.jpg$/.exec(file)
  const mediaId =
    file === SITE_PREVIEW ? await sitePicture() : match === null ? null : Number(match[1])
  const image = mediaId === null ? null : await services.previews.fromMedia(mediaId)
  if (image === null) return new Response(null, { status: 404 })
  return new Response(new Uint8Array(image), {
    headers: { 'content-type': 'image/jpeg', 'cache-control': CACHE },
  })
}
