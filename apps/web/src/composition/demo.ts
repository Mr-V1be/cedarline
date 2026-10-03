import type { Payload } from 'payload'

import { env } from '@/config/env'
import type { DemoSessionDeps } from '@/modules/demo/application/start-demo-session'
import { PayloadDemoSessions } from '@/modules/demo/infrastructure/payload-demo-sessions'
import { PayloadRateLimiter } from '@/modules/protection/infrastructure/payload-rate-limiter'

/** Whether this stand is a demo: one-click sign-in, protected demo accounts, nightly reset. */
export const isDemoStand = (): boolean => env.DEMO_MODE

/** One-click CMS sign-in of the demo stand; built from a Payload instance. */
export function demoServices(payload: Payload): DemoSessionDeps {
  return {
    enabled: isDemoStand(),
    sessions: new PayloadDemoSessions(payload),
    limiter: new PayloadRateLimiter(payload, env.PAYLOAD_SECRET),
  }
}
