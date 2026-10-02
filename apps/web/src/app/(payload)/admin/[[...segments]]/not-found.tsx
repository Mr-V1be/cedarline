import type { Metadata } from 'next'

import config from '@payload-config'
import { generatePageMetadata } from '@payloadcms/next/views'

import { AdminNotFound } from '@/cms/admin/admin-not-found'

import { importMap } from '../importMap'

type Args = {
  params: Promise<{
    segments: string[]
  }>
  searchParams: Promise<{
    [key: string]: string | string[]
  }>
}

export const generateMetadata = ({ params, searchParams }: Args): Promise<Metadata> =>
  generatePageMetadata({ config, params, searchParams })

/** Real 404s keep Payload's page; sections closed to the role say so (see AdminNotFound). */
const NotFound = ({ params, searchParams }: Args) => (
  <AdminNotFound params={params} searchParams={searchParams} importMap={importMap} />
)

export default NotFound
