/** How long the demo mailbox keeps a copy of a sent email before it is deleted. */
export const DEMO_MAILBOX_RETENTION_DAYS = 30

/**
 * Where outgoing mail goes. `demo` keeps every letter in the site's own mailbox and nothing
 * leaves the server; `smtp` hands mail to the relay configured for the deployment.
 */
export const MAIL_MODES = ['demo', 'smtp'] as const
export type MailMode = (typeof MAIL_MODES)[number]

/** A letter kept in the demo mailbox, as its recipient sees it. */
export interface StoredMail {
  readonly from: string
  readonly to: string
  readonly subject: string
  readonly html: string
  readonly sentAt: Date
  readonly attachments: ReadonlyArray<{ readonly filename: string; readonly size: number }>
}
