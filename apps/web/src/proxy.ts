import createMiddleware from 'next-intl/middleware'
import { NextRequest } from 'next/server'

import { routing } from './i18n/routing'

const handleI18n = createMiddleware(routing)

/**
 * Russian is the default for everyone. The browser language is not consulted: only a language
 * the visitor chose in the switcher (remembered in the locale cookie) changes it. next-intl
 * detects from the cookie first and the Accept-Language header second, so the header is
 * removed before detection.
 */
export default function proxy(request: NextRequest) {
  const headers = new Headers(request.headers)
  headers.delete('accept-language')
  return handleI18n(new NextRequest(request, { headers }))
}

export const config = {
  // Everything except the CMS (/admin, /api), internal render endpoints, Next internals and files.
  matcher: ['/((?!api|admin|render|proposal|_next|_vercel|.*\\..*).*)'],
}
