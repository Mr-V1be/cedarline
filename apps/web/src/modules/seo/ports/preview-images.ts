/** Link preview images (Open Graph), cut from the renders of the scene. */
export interface PreviewImages {
  /** A preview cut from a media image; null when there is no such public image. */
  fromMedia(id: number): Promise<Buffer | null>
}

/** Size social networks expect for a large link preview. */
export const PREVIEW_SIZE = { width: 1200, height: 630 } as const
