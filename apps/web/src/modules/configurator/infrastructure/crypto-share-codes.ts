import { randomBytes } from 'node:crypto'

import { shareCodeFrom } from '@cedarline/configurator'

import type { ShareCodeSource } from '../ports/share-code-source'

/** Bytes drawn per batch: a code needs 12 and rejects about 3 % of bytes. */
const BATCH = 32

export class CryptoShareCodes implements ShareCodeSource {
  next(): string {
    let bytes = randomBytes(BATCH)
    let index = 0
    return shareCodeFrom(() => {
      if (index >= bytes.length) {
        bytes = randomBytes(BATCH)
        index = 0
      }
      const byte = bytes[index] ?? 0
      index += 1
      return byte
    })
  }
}
