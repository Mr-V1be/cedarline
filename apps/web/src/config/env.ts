import { z } from 'zod'

import { loadRootEnv } from './load-root-env'

loadRootEnv()

const schema = z.object({
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
  PAYLOAD_SECRET: z.string().min(32, 'must be at least 32 characters'),
  SITE_URL: z.url(),
})

export type ServerEnv = z.infer<typeof schema>

/** Environment boundary: every server setting is validated once, at startup. */
function readEnv(): ServerEnv {
  const parsed = schema.safeParse(process.env)
  if (!parsed.success) {
    const problems = parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    throw new Error(`Invalid environment configuration:\n  ${problems.join('\n  ')}`)
  }
  return parsed.data
}

export const env: ServerEnv = readEnv()
