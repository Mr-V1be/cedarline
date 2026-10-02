/**
 * Short codes of saved configurations. 31 symbols without look-alikes (0/o, 1/l/i) and 12 of
 * them give about 59 bits: links cannot be guessed or enumerated, yet fit in a QR code nicely.
 */
export const SHARE_CODE_ALPHABET = '23456789abcdefghjkmnpqrstuvwxyz'
export const SHARE_CODE_LENGTH = 12

const PATTERN = new RegExp(`^[${SHARE_CODE_ALPHABET}]{${SHARE_CODE_LENGTH}}$`)

export const isShareCode = (value: string): boolean => PATTERN.test(value)

/** Largest multiple of the alphabet size below 256: bytes above it are discarded (no bias). */
const UNBIASED_LIMIT = 256 - (256 % SHARE_CODE_ALPHABET.length)

/** Builds a code from a source of random bytes (crypto in production, a sequence in tests). */
export function shareCodeFrom(nextByte: () => number): string {
  let code = ''
  while (code.length < SHARE_CODE_LENGTH) {
    const byte = nextByte()
    if (byte < UNBIASED_LIMIT) code += SHARE_CODE_ALPHABET.charAt(byte % SHARE_CODE_ALPHABET.length)
  }
  return code
}
