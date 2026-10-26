import createMiddleware from 'next-intl/middleware'
import { NextRequest, NextResponse } from 'next/server'

import { ADMIN_PATH_HEADER } from './cms/admin/admin-path'
import { routing } from './i18n/routing'

const handleI18n = createMiddleware(routing)
const ADMIN_PREFIX = '/admin'

/**
 * The CMS is not localised by URL. Its not-found page only learns which address failed from
 * this header, so it can tell a missing page from a section the signed-in role may not open.
 */
function annotateAdmin(request: NextRequest) {
  const headers = new Headers(request.headers)
  headers.set(ADMIN_PATH_HEADER, request.nextUrl.pathname)
  return NextResponse.next({ request: { headers } })
}

/**
 * Russian is the default for everyone. The browser language is not consulted: only a language
 * the visitor chose in the switcher (remembered in the locale cookie) changes it. next-intl
 * detects from the cookie first and the Accept-Language header second, so the header is
 * removed before detection.
 */
export default function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith(ADMIN_PREFIX)) return annotateAdmin(request)
  const headers = new Headers(request.headers)
  headers.delete('accept-language')
  return handleI18n(new NextRequest(request, { headers }))
}

export const config = {
  // The site except the API, internal render endpoints, Next internals, the generated app icons
  // and files; the CMS only to annotate its requests.
  matcher: [
    '/((?!api|admin|render|files|_next|_vercel|icon|apple-icon|.*\\..*).*)',
    '/admin/:path*',
  ],
}
