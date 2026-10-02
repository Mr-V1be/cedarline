import createMiddleware from 'next-intl/middleware'

import { routing } from './i18n/routing'

export default createMiddleware(routing)

export const config = {
  // Everything except the CMS (/admin, /api), internal render endpoint, Next internals and files.
  matcher: ['/((?!api|admin|render|_next|_vercel|.*\\..*).*)'],
}
