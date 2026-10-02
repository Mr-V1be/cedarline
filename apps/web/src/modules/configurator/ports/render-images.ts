/** Turns an uploaded scene capture into a safe, bounded JPEG, or rejects it. */
export interface RenderImages {
  normalise(image: Buffer): Promise<Buffer>
}
