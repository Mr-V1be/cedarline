import type { RateLimiter } from '@/modules/protection/ports/rate-limiter'

import { demoTourOf, landingOf } from '../domain/demo-tours'
import type { DemoSessions, SessionCookie } from '../ports/demo-sessions'

export interface DemoSessionDeps {
  /** The stand runs in demo mode; elsewhere one-click sign-in does not exist. */
  readonly enabled: boolean
  readonly sessions: DemoSessions
  readonly limiter: RateLimiter
}

export interface DemoSessionRequest {
  readonly role: string
  /** The tour stop to land on; unknown or missing means the tour's first stop. */
  readonly stop: string | null
  readonly client: string
}

export type DemoSessionOutcome =
  | { readonly ok: true; readonly cookie: SessionCookie; readonly landing: string }
  | { readonly ok: false; readonly reason: 'disabled' | 'unknown-role' | 'rate-limited' }

/**
 * One-click sign-in on the demo stand: an ordinary CMS session for the role's demo account,
 * landing on the chosen section. Limited per client so that a script cannot pile up sessions.
 */
export async function startDemoSession(
  deps: DemoSessionDeps,
  request: DemoSessionRequest,
): Promise<DemoSessionOutcome> {
  if (!deps.enabled) return { ok: false, reason: 'disabled' }
  const tour = demoTourOf(request.role)
  if (tour === null) return { ok: false, reason: 'unknown-role' }
  if (!(await deps.limiter.consume('demoSession', request.client))) {
    return { ok: false, reason: 'rate-limited' }
  }
  const cookie = await deps.sessions.open(tour.email)
  // The demo accounts come with the seed and are protected from changes on a demo stand.
  if (cookie === null) throw new Error(`Demo account for ${tour.role} is missing: run the seed`)
  return { ok: true, cookie, landing: landingOf(tour, request.stop) }
}
