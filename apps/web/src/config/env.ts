import { z } from 'zod'

import { loadRootEnv } from './load-root-env'

loadRootEnv()

/** Lead sinks the site delivers leads to, in order; the first one must succeed. */
export const LEAD_SINK_KEYS = ['cms', 'bitrix24'] as const
export type LeadSinkKey = (typeof LEAD_SINK_KEYS)[number]

const schema = z
  .object({
    DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
    PAYLOAD_SECRET: z.string().min(32, 'must be at least 32 characters'),
    SITE_URL: z.url(),
    SMTP_HOST: z.string().min(1),
    SMTP_PORT: z.coerce.number().int().positive(),
    SMTP_USER: z.string().optional().default(''),
    SMTP_PASSWORD: z.string().optional().default(''),
    MAIL_FROM_ADDRESS: z.email(),
    MAIL_FROM_NAME: z.string().min(1),
    LEAD_SINKS: z
      .string()
      .default('cms')
      .transform((value) =>
        value
          .split(',')
          .map((key) => key.trim())
          .filter(Boolean),
      )
      .pipe(z.array(z.enum(LEAD_SINK_KEYS)).min(1)),
    BITRIX24_WEBHOOK_URL: z
      .union([z.url(), z.literal('')])
      .optional()
      .default(''),
  })
  .refine((value) => !value.LEAD_SINKS.includes('bitrix24') || value.BITRIX24_WEBHOOK_URL !== '', {
    message: 'BITRIX24_WEBHOOK_URL is required when LEAD_SINKS includes bitrix24',
    path: ['BITRIX24_WEBHOOK_URL'],
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
