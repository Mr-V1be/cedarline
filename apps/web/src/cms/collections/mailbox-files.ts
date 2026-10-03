import type { CollectionConfig } from 'payload'

import { requireCapability } from '../access/policies'
import { label } from '../fields/labels'

/** Attachments of the demo mailbox letters; private, served only through the letter's key. */
export const MailboxFiles: CollectionConfig = {
  slug: 'mailbox-files',
  labels: {
    singular: label('Вложение', 'Attachment'),
    plural: label('Вложения писем', 'Letter attachments'),
  },
  admin: { hidden: true },
  access: {
    read: requireCapability('leads.read'),
    create: () => false,
    update: () => false,
    delete: requireCapability('leads.write'),
  },
  upload: { staticDir: 'mailbox-files' },
  fields: [],
}
