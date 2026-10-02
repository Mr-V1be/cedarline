export type DocumentKind = 'render' | 'proposal'

export interface StoredDocument {
  readonly id: number
  readonly filename: string
  readonly mimeType: string
}

/** Private files produced for customers; read back by id, never served publicly as is. */
export interface DocumentStore {
  save(
    kind: DocumentKind,
    filename: string,
    mimeType: string,
    data: Buffer,
  ): Promise<StoredDocument>
  read(id: number): Promise<{ readonly document: StoredDocument; readonly data: Buffer } | null>
}
