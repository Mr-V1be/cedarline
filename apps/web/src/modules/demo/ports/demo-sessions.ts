/** The browser cookie that carries a CMS session. */
export interface SessionCookie {
  readonly name: string
  readonly value: string
  readonly expires: Date
  readonly path: string
  readonly httpOnly: boolean
  readonly secure: boolean
  readonly sameSite: 'lax' | 'strict' | 'none' | undefined
  readonly domain: string | undefined
}

/**
 * Opens an ordinary CMS session for an existing account without asking for its password: the
 * demo stand's one-click sign-in. Null when there is no such account.
 */
export interface DemoSessions {
  open(email: string): Promise<SessionCookie | null>
}
