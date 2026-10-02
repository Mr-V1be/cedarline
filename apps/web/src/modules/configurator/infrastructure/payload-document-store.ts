import { readFile } from 'node:fs/promises'
import path from 'node:path'

import type { Payload } from 'payload'

import type { DocumentKind, DocumentStore, StoredDocument } from '../ports/document-store'

const SYSTEM = { overrideAccess: true, depth: 0 } as const

/** Upload directory of the documents collection, relative to the server's working directory. */
const DOCUMENTS_DIRECTORY = path.resolve(process.cwd(), 'documents')

export class PayloadDocumentStore implements DocumentStore {
  constructor(private readonly payload: Payload) {}

  async save(
    kind: DocumentKind,
    filename: string,
    mimeType: string,
    data: Buffer,
  ): Promise<StoredDocument> {
    const document = await this.payload.create({
      ...SYSTEM,
      collection: 'documents',
      data: { kind },
      file: { data, mimetype: mimeType, name: filename, size: data.byteLength },
    })
    return {
      id: document.id,
      filename: document.filename ?? filename,
      mimeType: document.mimeType ?? mimeType,
    }
  }

  async read(id: number) {
    const document = await this.payload
      .findByID({ ...SYSTEM, collection: 'documents', id })
      .catch(() => null)
    if (document === null || document.filename === null || document.filename === undefined) {
      return null
    }
    const filePath = path.join(DOCUMENTS_DIRECTORY, path.basename(document.filename))
    const data = await readFile(filePath).catch(() => null)
    if (data === null) return null
    return {
      document: {
        id: document.id,
        filename: document.filename,
        mimeType: document.mimeType ?? 'application/octet-stream',
      },
      data,
    }
  }
}
