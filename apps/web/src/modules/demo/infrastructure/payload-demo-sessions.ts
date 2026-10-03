import {
  createLocalReq,
  getFieldsToSign,
  jwtSign,
  type CollectionSlug,
  type Payload,
  type TypedUser,
} from 'payload'
import { addSessionToUser, generatePayloadCookie } from 'payload/shared'

import type { DemoSessions, SessionCookie } from '../ports/demo-sessions'

const USERS = 'users' satisfies CollectionSlug

/**
 * Opens a session the way Payload's own login does — a session entry on the account, a signed
 * token, the auth cookie with the collection's settings — only without the password check.
 * The CMS then treats it as any other sign-in, including logout and expiry.
 */
export class PayloadDemoSessions implements DemoSessions {
  constructor(private readonly payload: Payload) {}

  async open(email: string): Promise<SessionCookie | null> {
    const collectionConfig = this.payload.collections[USERS].config
    const req = await createLocalReq({}, this.payload)
    const user = await this.payload.db.findOne<TypedUser & { collection?: string }>({
      collection: USERS,
      req,
      where: { email: { equals: email } },
    })
    if (user === null) return null
    user.collection = USERS
    const { sid } = await addSessionToUser({ collectionConfig, payload: this.payload, req, user })
    const { token } = await jwtSign({
      fieldsToSign: getFieldsToSign({ collectionConfig, email, sid, user }),
      secret: this.payload.secret,
      tokenExpiration: collectionConfig.auth.tokenExpiration,
    })
    const cookie = generatePayloadCookie({
      collectionAuthConfig: collectionConfig.auth,
      cookiePrefix: this.payload.config.cookiePrefix,
      returnCookieAsObject: true,
      token,
    })
    return {
      name: cookie.name,
      value: cookie.value ?? token,
      expires: cookie.expires === undefined ? new Date() : new Date(cookie.expires),
      path: cookie.path ?? '/',
      httpOnly: true,
      secure: cookie.secure ?? false,
      sameSite: sameSiteOf(cookie.sameSite),
      domain: cookie.domain,
    }
  }
}

function sameSiteOf(value: unknown): SessionCookie['sameSite'] {
  if (typeof value !== 'string') return undefined
  const normalized = value.toLowerCase()
  return normalized === 'lax' || normalized === 'strict' || normalized === 'none'
    ? normalized
    : undefined
}
