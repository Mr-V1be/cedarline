import type { CollectionAfterDeleteHook, CollectionConfig } from 'payload'

import { declareReadCapability, requireCapability } from '../access/policies'
import { label } from '../fields/labels'

const SALES_READ = 'leads.read'

/** A letter's attachments go with it: retention and manual deletion leave no orphan files. */
const deleteAttachments: CollectionAfterDeleteHook = async ({ doc, req }) => {
  const files = (doc as { attachments?: Array<{ file?: number | { id: number } | null }> })
    .attachments
  const ids = (files ?? []).flatMap(({ file }) =>
    file === null || file === undefined ? [] : [typeof file === 'number' ? file : file.id],
  )
  if (ids.length === 0) return
  await req.payload.delete({
    collection: 'mailbox-files',
    where: { id: { in: ids } },
    overrideAccess: true,
    req,
  })
}

/**
 * The demo mailbox: every letter the site sends in demo mode is kept here instead of leaving
 * the server. A customer opens their own letter by its unguessable link; staff see all of them.
 */
export const Mailbox: CollectionConfig = {
  slug: 'mailbox',
  labels: { singular: label('Письмо', 'Letter'), plural: label('Демо-почта', 'Demo mailbox') },
  admin: {
    group: label('Продажи', 'Sales'),
    useAsTitle: 'subject',
    defaultColumns: ['subject', 'to', 'sentAt'],
    description: label(
      'Письма, отправленные сайтом в демо-режиме. Хранятся 30 дней и удаляются автоматически',
      'Letters the site sent in demo mode. Kept for 30 days and deleted automatically',
    ),
  },
  defaultSort: '-sentAt',
  custom: declareReadCapability(SALES_READ),
  access: {
    read: requireCapability(SALES_READ),
    create: () => false,
    update: () => false,
    delete: requireCapability('leads.write'),
  },
  hooks: { afterDelete: [deleteAttachments] },
  fields: [
    {
      // Only the hash of the letter's key is stored: the database alone cannot open a letter.
      name: 'keyHash',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      access: { read: () => false },
      admin: { hidden: true },
    },
    {
      type: 'row',
      fields: [
        { name: 'to', type: 'text', required: true, label: label('Кому', 'To') },
        { name: 'from', type: 'text', required: true, label: label('От кого', 'From') },
        {
          name: 'sentAt',
          type: 'date',
          required: true,
          index: true,
          label: label('Отправлено', 'Sent'),
          admin: { date: { pickerAppearance: 'dayAndTime' } },
        },
      ],
    },
    { name: 'subject', type: 'text', required: true, label: label('Тема', 'Subject') },
    { name: 'text', type: 'textarea', label: label('Текст', 'Text'), admin: { readOnly: true } },
    {
      name: 'html',
      type: 'code',
      label: label('HTML', 'HTML'),
      admin: { language: 'html', readOnly: true },
    },
    {
      name: 'attachments',
      type: 'array',
      label: label('Вложения', 'Attachments'),
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'file',
              type: 'upload',
              relationTo: 'mailbox-files',
              required: true,
              label: label('Файл', 'File'),
            },
            { name: 'filename', type: 'text', required: true, label: label('Имя', 'Name') },
            {
              name: 'size',
              type: 'number',
              required: true,
              label: label('Размер, байт', 'Size, bytes'),
            },
          ],
        },
      ],
    },
  ],
}
