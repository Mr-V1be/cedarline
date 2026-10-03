import { createHash, randomBytes } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

import type { Payload } from 'payload'

import type { StoredMail } from '../domain/mailbox'
import type { Mailbox, StoredAttachment } from '../ports/mailbox'
import type { Mailer, OutgoingMail, SentMail } from '../ports/mailer'

const SYSTEM = { overrideAccess: true, depth: 0 } as const
/** 256 bits of randomness: a letter's link cannot be guessed or enumerated. */
const KEY_BYTES = 32
const KEY_PATTERN = /^[A-Za-z0-9_-]{43}$/
/** Upload directory of the mailbox files collection, relative to the server's working directory. */
const FILES_DIRECTORY = path.resolve(process.cwd(), 'mailbox-files')

const hashKey = (key: string) => createHash('sha256').update(key).digest('hex')

/**
 * The demo mailbox: keeps every letter in the CMS instead of sending it. Each letter gets a
 * random key; only its hash is stored, and the key is handed to whoever may read the letter.
 */
export class DemoMailbox implements Mailer, Mailbox {
  constructor(
    private readonly payload: Payload,
    private readonly sender: string,
    private readonly clock: () => Date = () => new Date(),
  ) {}

  async send(mail: OutgoingMail): Promise<SentMail> {
    const key = randomBytes(KEY_BYTES).toString('base64url')
    const attachments = []
    for (const attachment of mail.attachments) {
      const file = await this.payload.create({
        ...SYSTEM,
        collection: 'mailbox-files',
        data: {},
        file: {
          data: attachment.content,
          mimetype: attachment.contentType,
          name: attachment.filename,
          size: attachment.content.byteLength,
        },
      })
      attachments.push({
        file: file.id,
        filename: attachment.filename,
        size: attachment.content.byteLength,
      })
    }
    await this.payload.create({
      ...SYSTEM,
      collection: 'mailbox',
      data: {
        keyHash: hashKey(key),
        to: mail.to,
        from: this.sender,
        sentAt: this.clock().toISOString(),
        subject: mail.subject,
        text: mail.text,
        html: mail.html,
        attachments,
      },
    })
    return { viewKey: key }
  }

  private async find(key: string) {
    if (!KEY_PATTERN.test(key)) return null
    const { docs } = await this.payload.find({
      ...SYSTEM,
      collection: 'mailbox',
      limit: 1,
      where: { keyHash: { equals: hashKey(key) } },
    })
    return docs[0] ?? null
  }

  async open(key: string): Promise<StoredMail | null> {
    const letter = await this.find(key)
    if (letter === null) return null
    return {
      from: letter.from,
      to: letter.to,
      subject: letter.subject,
      html: letter.html ?? '',
      sentAt: new Date(letter.sentAt),
      attachments: (letter.attachments ?? []).map(({ filename, size }) => ({ filename, size })),
    }
  }

  async attachment(key: string, index: number): Promise<StoredAttachment | null> {
    const letter = await this.find(key)
    const entry = letter?.attachments?.[index]
    if (entry === undefined) return null
    const id = typeof entry.file === 'number' ? entry.file : entry.file.id
    const file = await this.payload
      .findByID({ ...SYSTEM, collection: 'mailbox-files', id })
      .catch(() => null)
    if (file?.filename === null || file?.filename === undefined) return null
    const data = await readFile(path.join(FILES_DIRECTORY, path.basename(file.filename))).catch(
      () => null,
    )
    if (data === null) return null
    return {
      filename: entry.filename,
      contentType: file.mimeType ?? 'application/octet-stream',
      data,
    }
  }

  async purge(sentBefore: Date): Promise<number> {
    const result = await this.payload.delete({
      ...SYSTEM,
      collection: 'mailbox',
      where: { sentAt: { less_than: sentBefore.toISOString() } },
    })
    return result.docs.length
  }
}
