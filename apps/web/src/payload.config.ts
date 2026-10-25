import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { postgresAdapter } from '@payloadcms/db-postgres'
import { HeadingFeature, lexicalEditor } from '@payloadcms/richtext-lexical'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import { en } from '@payloadcms/translations/languages/en'
import { ru } from '@payloadcms/translations/languages/ru'
import { buildConfig } from 'payload'
import sharp from 'sharp'

import { userCan } from './cms/access/policies'
import { Articles } from './cms/collections/articles'
import { BuiltObjects } from './cms/collections/built-objects'
import { Configurations } from './cms/collections/configurations'
import { Documents } from './cms/collections/documents'
import { Leads } from './cms/collections/leads'
import { Mailbox } from './cms/collections/mailbox'
import { MailboxFiles } from './cms/collections/mailbox-files'
import { Media } from './cms/collections/media'
import { ProjectTypes } from './cms/collections/project-types'
import { Projects } from './cms/collections/projects'
import { RateLimitHits } from './cms/collections/rate-limit-hits'
import { RoomKinds } from './cms/collections/room-kinds'
import { Users } from './cms/collections/users'
import { CatalogOptions } from './cms/globals/catalog-options'
import { ExchangeRates } from './cms/globals/exchange-rates'
import { Financing } from './cms/globals/financing'
import { Home } from './cms/globals/home'
import { KeyRate } from './cms/globals/key-rate'
import { Production } from './cms/globals/production'
import { Site } from './cms/globals/site'
import { Tariff } from './cms/globals/tariff'
import { Technology } from './cms/globals/technology'
import { health } from './cms/endpoints/health'
import { DELIVERY_QUEUE, MAINTENANCE_QUEUE, TASKS } from './cms/jobs/tasks'
import { env } from './config/env'
import { DEFAULT_LOCALE, LOCALE_DEFINITIONS, LOCALES } from './i18n/locales'
import { demoMailboxEmailAdapter } from './modules/mail/infrastructure/demo-mailbox-email-adapter'

const dirname = path.dirname(fileURLToPath(import.meta.url))

/** Editor features the articles do without; headings come back limited to two levels. */
const EXCLUDED_EDITOR_FEATURES: ReadonlySet<string> = new Set([
  'heading',
  'checklist',
  'relationship',
  'subscript',
  'superscript',
  'inlineCode',
  'align',
  'indent',
])

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
      // Renders only on a demo stand: one-click sign-in by role.
      beforeLogin: ['/cms/admin/demo-sign-in#DemoSignIn'],
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
    Articles,
    Leads,
    Configurations,
    Documents,
    Mailbox,
    MailboxFiles,
    RateLimitHits,
  ],
  globals: [
    Tariff,
    ExchangeRates,
    CatalogOptions,
    Technology,
    Financing,
    KeyRate,
    Home,
    Production,
    Site,
  ],
  // Demo: every letter stays in the site's demo mailbox. SMTP: Mailpit locally, the company's
  // relay in production.
  email:
    env.MAIL_MODE === 'demo'
      ? demoMailboxEmailAdapter({ address: env.MAIL_FROM_ADDRESS, name: env.MAIL_FROM_NAME })
      : nodemailerAdapter({
          defaultFromAddress: env.MAIL_FROM_ADDRESS,
          defaultFromName: env.MAIL_FROM_NAME,
          skipVerify: true,
          transportOptions: {
            host: env.SMTP_HOST,
            port: env.SMTP_PORT,
            secure: false,
            ...(env.SMTP_USER === ''
              ? {}
              : { auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD } }),
          },
        }),
  // Articles: prose with section headings, lists, quotes, links and images, nothing more.
  editor: lexicalEditor({
    features: ({ defaultFeatures }) => [
      ...defaultFeatures.filter((feature) => !EXCLUDED_EDITOR_FEATURES.has(feature.key)),
      HeadingFeature({ enabledHeadingSizes: ['h2', 'h3'] }),
    ],
  }),
  // Durable background work in the database: lead delivery retries, mailbox cleanup, the key
  // rate refresh. Runs inside the web server; never during the build or in CLI scripts.
  jobs: {
    tasks: TASKS,
    autoRun: [
      { cron: '* * * * *', queue: DELIVERY_QUEUE, limit: 10 },
      { cron: '*/5 * * * *', queue: MAINTENANCE_QUEUE, limit: 5 },
    ],
    shouldAutoRun: () =>
      process.env.NEXT_RUNTIME === 'nodejs' && process.env.NEXT_PHASE !== 'phase-production-build',
    access: {
      queue: ({ req }) => userCan(req.user, 'users.manage'),
      run: ({ req }) => userCan(req.user, 'users.manage'),
      cancel: ({ req }) => userCan(req.user, 'users.manage'),
    },
  },
  // The site reads through the Local API; the REST API serves the admin panel.
  graphQL: { disable: true },
  endpoints: [health],
  db: postgresAdapter({
    pool: { connectionString: env.DATABASE_URL, max: env.DATABASE_POOL_MAX },
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
