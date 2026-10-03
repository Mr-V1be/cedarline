import type { EmailAdapter } from 'payload'
import { z } from 'zod'

import type { OutgoingMail } from '../ports/mailer'
import { DemoMailbox } from './demo-mailbox'

const address = z.union([
  z.string(),
  z.object({ address: z.string() }).transform((value) => value.address),
])
const content = z
  .union([z.string(), z.instanceof(Buffer)])
  .optional()
  .transform((value) => (value === undefined ? '' : value.toString()))

/**
 * The part of a nodemailer message the mailbox keeps; attachments given as streams or paths
 * are dropped, Payload's own letters never use them.
 */
const message = z.object({
  to: z
    .union([address, z.array(address)])
    .optional()
    .transform((value) => (value === undefined ? '' : [value].flat().join(', '))),
  subject: z.string().optional().default(''),
  html: content,
  text: content,
  attachments: z
    .array(
      z.object({
        filename: z.string().optional(),
        content: z.unknown(),
        contentType: z.string().optional(),
      }),
    )
    .optional()
    .default([]),
})

function toOutgoing(options: unknown): OutgoingMail {
  const parsed = message.parse(options)
  return {
    to: parsed.to,
    subject: parsed.subject,
    html: parsed.html,
    text: parsed.text,
    attachments: parsed.attachments.flatMap((attachment) => {
      const data =
        typeof attachment.content === 'string'
          ? Buffer.from(attachment.content)
          : Buffer.isBuffer(attachment.content)
            ? attachment.content
            : null
      return data === null
        ? []
        : [
            {
              filename: attachment.filename ?? 'attachment',
              contentType: attachment.contentType ?? 'application/octet-stream',
              content: data,
            },
          ]
    }),
  }
}

/**
 * Payload's own mail (password resets of staff) in demo mode: kept in the demo mailbox like
 * every other letter, so nothing leaves the server.
 */
export const demoMailboxEmailAdapter =
  (sender: { address: string; name: string }): EmailAdapter =>
  ({ payload }) => {
    const mailbox = new DemoMailbox(payload, `${sender.name} <${sender.address}>`)
    return {
      name: 'demo-mailbox',
      defaultFromAddress: sender.address,
      defaultFromName: sender.name,
      sendEmail: async (options: unknown) => mailbox.send(toOutgoing(options)),
    }
  }
