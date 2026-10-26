import { describe, expect, it } from 'vitest'

import { ROLE_KEYS } from '@/modules/access/domain/roles'
import {
  startDemoSession,
  type DemoSessionDeps,
} from '@/modules/demo/application/start-demo-session'
import { DEMO_TOURS } from '@/modules/demo/domain/demo-tours'
import type { SessionCookie } from '@/modules/demo/ports/demo-sessions'

const cookieFor = (email: string): SessionCookie => ({
  name: 'payload-token',
  value: `token-for-${email}`,
  expires: new Date('2026-10-04T00:00:00Z'),
  path: '/',
  httpOnly: true,
  secure: false,
  sameSite: 'lax',
  domain: undefined,
})

function deps(overrides: Partial<DemoSessionDeps> = {}) {
  const opened: string[] = []
  const value: DemoSessionDeps = {
    enabled: true,
    sessions: {
      open: (email) => {
        opened.push(email)
        return Promise.resolve(cookieFor(email))
      },
    },
    limiter: { consume: () => Promise.resolve(true) },
    ...overrides,
  }
  return { value, opened }
}

const request = { role: 'sales-manager', stop: null, client: '10.0.0.1' }

describe('one-click demo sign-in', () => {
  it('exists only on a demo stand', async () => {
    const { value, opened } = deps({ enabled: false })
    expect(await startDemoSession(value, request)).toEqual({ ok: false, reason: 'disabled' })
    expect(opened).toEqual([])
  })

  it('has a demo account for every role', () => {
    expect(DEMO_TOURS.map((tour) => tour.role).sort()).toEqual([...ROLE_KEYS].sort())
  })

  it('opens the role’s demo account and lands on its first stop', async () => {
    const { value, opened } = deps()
    const outcome = await startDemoSession(value, request)
    expect(outcome).toMatchObject({ ok: true, landing: '/admin/collections/leads' })
    expect(opened).toEqual(['sales@cedarline.example'])
  })

  it('lands on a chosen stop of the tour', async () => {
    const { value } = deps()
    const outcome = await startDemoSession(value, { ...request, stop: 'mailbox' })
    expect(outcome).toMatchObject({ ok: true, landing: '/admin/collections/mailbox' })
  })

  it('never redirects outside the tour, whatever the stop says', async () => {
    const { value } = deps()
    for (const stop of ['//evil.example', 'https://evil.example', 'tariff', '../api/users']) {
      const outcome = await startDemoSession(value, { ...request, stop })
      expect(outcome).toMatchObject({ ok: true, landing: '/admin/collections/leads' })
    }
  })

  it('refuses unknown roles without opening a session', async () => {
    const { value, opened } = deps()
    for (const role of ['superuser', '', 'users.manage']) {
      expect(await startDemoSession(value, { ...request, role })).toEqual({
        ok: false,
        reason: 'unknown-role',
      })
    }
    expect(opened).toEqual([])
  })

  it('stops a client over the limit before a session is opened', async () => {
    const { value, opened } = deps({ limiter: { consume: () => Promise.resolve(false) } })
    expect(await startDemoSession(value, request)).toEqual({ ok: false, reason: 'rate-limited' })
    expect(opened).toEqual([])
  })
})
