/** Source of fresh, unguessable share codes. */
export interface ShareCodeSource {
  next(): string
}
