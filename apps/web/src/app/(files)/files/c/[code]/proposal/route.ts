import { isShareCode } from '@kedrovnik/configurator'
import type { NextRequest } from 'next/server'

import { getServices } from '@/composition/services'
import { DEFAULT_LOCALE, isLocale } from '@/i18n/locales'
import { clientAddress } from '@/modules/protection/infrastructure/client-address'
import { proposalFor } from '@/modules/proposals/application/proposal-service'

export const dynamic = 'force-dynamic'

/**
 * The commercial proposal of a saved configuration as a PDF download. The share code is the
 * only key; `?lang=` picks the language, `?inline=1` opens the file in the browser instead.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const lang = request.nextUrl.searchParams.get('lang') ?? DEFAULT_LOCALE
  const locale = isLocale(lang) ? lang : DEFAULT_LOCALE
  if (!isShareCode(code)) return new Response(null, { status: 404 })

  const services = await getServices(locale)
  const saved = await services.saved.findByCode(code)
  if (saved === null) return new Response(null, { status: 404 })
  if (!(await services.rateLimiter.consume('proposal', clientAddress(request.headers)))) {
    return new Response(null, { status: 429, headers: { 'retry-after': '600' } })
  }

  const file = await proposalFor(services.proposals, saved, locale)
  if (file === null) return new Response(null, { status: 404 })
  const disposition = request.nextUrl.searchParams.get('inline') === '1' ? 'inline' : 'attachment'
  return new Response(new Uint8Array(file.data), {
    headers: {
      'content-type': 'application/pdf',
      'content-length': String(file.data.byteLength),
      'content-disposition': `${disposition}; filename="${file.filename}"`,
      'cache-control': 'private, no-store',
      'x-robots-tag': 'noindex',
    },
  })
}
