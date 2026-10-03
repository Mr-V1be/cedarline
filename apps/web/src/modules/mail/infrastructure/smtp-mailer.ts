import type { Payload } from 'payload'

import type { Mailer, OutgoingMail, SentMail } from '../ports/mailer'

/** Production mail: Payload's SMTP adapter, configured from the environment at deployment. */
export class SmtpMailer implements Mailer {
  constructor(private readonly payload: Payload) {}

  async send(mail: OutgoingMail): Promise<SentMail> {
    await this.payload.sendEmail({
      to: mail.to,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
      attachments: mail.attachments.map((attachment) => ({
        filename: attachment.filename,
        content: attachment.content,
        contentType: attachment.contentType,
      })),
    })
    return { viewKey: null }
  }
}
