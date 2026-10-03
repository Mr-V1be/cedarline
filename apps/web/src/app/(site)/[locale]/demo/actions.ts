'use server'

import config from '@payload-config'
import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'

import { demoServices } from '@/composition/demo'
import { startDemoSession } from '@/modules/demo/application/start-demo-session'
import type { DemoSessionState } from '@/modules/demo/ui/demo-session-state'
import { clientAddress } from '@/modules/protection/infrastructure/client-address'

const field = (form: FormData, name: string): string | null => {
  const value = form.get(name)
  return typeof value === 'string' && value !== '' ? value : null
}

/**
 * One-click sign-in on the demo stand (site demo page and the CMS sign-in screen): sets the
 * ordinary CMS session cookie and opens the chosen section.
 */
export async function startDemoSessionAction(
  _previous: DemoSessionState,
  form: FormData,
): Promise<DemoSessionState> {
  const payload = await getPayload({ config })
  const outcome = await startDemoSession(demoServices(payload), {
    role: field(form, 'role') ?? '',
    stop: field(form, 'stop'),
    client: clientAddress(await headers()),
  })
  if (!outcome.ok) return { error: outcome.reason === 'rate-limited' ? 'limited' : 'unavailable' }
  const { cookie } = outcome
  ;(await cookies()).set(cookie.name, cookie.value, {
    expires: cookie.expires,
    path: cookie.path,
    httpOnly: cookie.httpOnly,
    secure: cookie.secure,
    sameSite: cookie.sameSite,
    domain: cookie.domain,
  })
  redirect(outcome.landing)
}
