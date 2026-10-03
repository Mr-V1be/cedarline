export interface MailAttachment {
  readonly filename: string
  readonly contentType: string
  readonly content: Buffer
}

export interface OutgoingMail {
  readonly to: string
  readonly subject: string
  readonly html: string
  readonly text: string
  readonly attachments: readonly MailAttachment[]
}

export interface SentMail {
  /** Key under which a kept copy can be opened; null when the mailer keeps no copies. */
  readonly viewKey: string | null
}

/** Sends mail: an SMTP relay in production, the demo mailbox in the public demo. */
export interface Mailer {
  send(mail: OutgoingMail): Promise<SentMail>
}
