/** How many requests of one kind a client may make in a sliding window. */
export interface RateLimit {
  readonly limit: number
  readonly windowMs: number
}

const HOUR = 60 * 60 * 1000

/**
 * Limits per client address. Generous for people (a family comparing variants saves a few
 * dozen configurations), tight enough that a script cannot flood the CMS or the mailbox.
 */
export const RATE_LIMITS = {
  saveConfiguration: { limit: 30, windowMs: HOUR },
  submitLead: { limit: 5, windowMs: HOUR },
  proposal: { limit: 30, windowMs: HOUR },
  // One-click sign-in on the demo stand: every click opens a session on a shared account.
  demoSession: { limit: 30, windowMs: HOUR },
} as const satisfies Record<string, RateLimit>

export type RateLimitBucket = keyof typeof RATE_LIMITS
