import type { StoredMail } from '../domain/mailbox'

export interface StoredAttachment {
  readonly filename: string
  readonly contentType: string
  readonly data: Buffer
}

/** Letters kept by the demo mailbox, opened only by the unguessable key of each letter. */
export interface Mailbox {
  open(key: string): Promise<StoredMail | null>
  attachment(key: string, index: number): Promise<StoredAttachment | null>
  /** Deletes letters sent before the date; returns how many were deleted. */
  purge(sentBefore: Date): Promise<number>
}
