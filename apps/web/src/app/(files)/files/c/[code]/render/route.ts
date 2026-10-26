import { isShareCode } from '@cedarline/configurator'

import { getServices } from '@/composition/services'
import { DEFAULT_LOCALE } from '@/i18n/locales'

export const dynamic = 'force-dynamic'

/** The render saved with a configuration. A code's render never changes, so it caches for good. */
export async function GET(_request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  if (!isShareCode(code)) return new Response(null, { status: 404 })
  const services = await getServices(DEFAULT_LOCALE)
  const saved = await services.saved.findByCode(code)
  if (saved === null || saved.renderId === null) return new Response(null, { status: 404 })
  const stored = await services.saving.documents.read(saved.renderId)
  if (stored === null) return new Response(null, { status: 404 })
  return new Response(new Uint8Array(stored.data), {
    headers: {
      'content-type': stored.document.mimeType,
      'cache-control': 'public, max-age=31536000, immutable',
      'x-robots-tag': 'noindex',
    },
  })
}
