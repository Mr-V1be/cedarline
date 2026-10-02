import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { postgresAdapter } from '@payloadcms/db-postgres'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import { en } from '@payloadcms/translations/languages/en'
import { ru } from '@payloadcms/translations/languages/ru'
import { buildConfig } from 'payload'
import sharp from 'sharp'

import { BuiltObjects } from './cms/collections/built-objects'
import { Configurations } from './cms/collections/configurations'
import { Documents } from './cms/collections/documents'
import { Leads } from './cms/collections/leads'
import { Media } from './cms/collections/media'
import { ProjectTypes } from './cms/collections/project-types'
import { Projects } from './cms/collections/projects'
import { RateLimitHits } from './cms/collections/rate-limit-hits'
import { RoomKinds } from './cms/collections/room-kinds'
import { Users } from './cms/collections/users'
import { CatalogOptions } from './cms/globals/catalog-options'
import { Home } from './cms/globals/home'
import { Site } from './cms/globals/site'
import { Tariff } from './cms/globals/tariff'
import { Technology } from './cms/globals/technology'
import { env } from './config/env'
import { DEFAULT_LOCALE, LOCALE_DEFINITIONS, LOCALES } from './i18n/locales'

const dirname = path.dirname(fileURLToPath(import.meta.url))

export default buildConfig({
  serverURL: env.SITE_URL,
  secret: env.PAYLOAD_SECRET,
  telemetry: false,
  admin: {
    user: Users.slug,
    importMap: { baseDir: dirname },
    meta: { titleSuffix: ' · Кедровник' },
    components: {
      graphics: { Icon: '/cms/admin/brand#Icon', Logo: '/cms/admin/brand#Logo' },
    },
  },
  i18n: { supportedLanguages: { ru, en }, fallbackLanguage: DEFAULT_LOCALE },
  localization: {
    locales: LOCALES.map((code) => ({ code, label: LOCALE_DEFINITIONS[code].nativeName })),
    defaultLocale: DEFAULT_LOCALE,
    fallback: true,
  },
  collections: [
    Users,
    Media,
    ProjectTypes,
    RoomKinds,
    Projects,
    BuiltObjects,
    Leads,
    Configurations,
    Documents,
    RateLimitHits,
  ],
  globals: [Tariff, CatalogOptions, Technology, Home, Site],
  // Mail goes over plain SMTP: Mailpit locally, the company's relay in production.
  email: nodemailerAdapter({
    defaultFromAddress: env.MAIL_FROM_ADDRESS,
    defaultFromName: env.MAIL_FROM_NAME,
    skipVerify: true,
    transportOptions: {
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: false,
      ...(env.SMTP_USER === '' ? {} : { auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD } }),
    },
  }),
  // The site reads through the Local API; the REST API serves the admin panel.
  graphQL: { disable: true },
  db: postgresAdapter({
    pool: { connectionString: env.DATABASE_URL },
    // Schema changes go through committed migrations only, never through dev-time push.
    push: false,
    migrationDir: path.resolve(dirname, 'migrations'),
  }),
  typescript: {
    outputFile: path.resolve(dirname, 'cms/generated/payload-types.ts'),
    autoGenerate: false,
  },
  sharp,
})
