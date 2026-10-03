import type { Payload } from 'payload'

import { env, type LeadSinkKey } from '@/config/env'
import type { Locale } from '@/i18n/locales'
import { PayloadDocumentStore } from '@/modules/configurator/infrastructure/payload-document-store'
import { PayloadSavedConfigurationRepository } from '@/modules/configurator/infrastructure/payload-saved-configuration-repository'
import type { RetryDeliveryDeps } from '@/modules/leads/application/retry-delivery'
import { Bitrix24LeadSink } from '@/modules/leads/infrastructure/bitrix24-lead-sink'
import { CmsLeadSink } from '@/modules/leads/infrastructure/cms-lead-sink'
import { PayloadLeadMails, mailDeliveries } from '@/modules/leads/infrastructure/lead-mails'
import { PayloadDeliveryQueue } from '@/modules/leads/infrastructure/payload-delivery-queue'
import { PayloadLeadArchive } from '@/modules/leads/infrastructure/payload-lead-archive'
import { PayloadLeadJournal } from '@/modules/leads/infrastructure/payload-lead-journal'
import { sinkDelivery } from '@/modules/leads/infrastructure/sink-delivery'
import type { LeadSink } from '@/modules/leads/ports/lead-sink'
import { DemoMailbox } from '@/modules/mail/infrastructure/demo-mailbox'
import { SmtpMailer } from '@/modules/mail/infrastructure/smtp-mailer'
import type { Mailer } from '@/modules/mail/ports/mailer'

const localePrefix = (locale: Locale) => (locale === 'ru' ? '' : `/${locale}`)

/** Public link of a saved configuration. */
export const configurationLink = (code: string, locale: Locale) =>
  `${env.SITE_URL}${localePrefix(locale)}/c/${code}`

/** Where a customer opens their letter in the demo mailbox; the router adds the language. */
export const letterPath = (key: string) => `/mail/${key}`

const adminLeadUrl = (id: number) => `${env.SITE_URL}/admin/collections/leads/${id}`

const sender = `${env.MAIL_FROM_NAME} <${env.MAIL_FROM_ADDRESS}>`

/** Sinks after the system of record, in the configured order. */
function secondarySinks(): LeadSink[] {
  const make: Record<Exclude<LeadSinkKey, 'cms'>, () => LeadSink> = {
    bitrix24: () => new Bitrix24LeadSink(env.BITRIX24_WEBHOOK_URL),
  }
  return env.LEAD_SINKS.flatMap((key) => (key === 'cms' ? [] : [make[key]()]))
}

/**
 * Everything that moves a lead after it is taken: the system of record, the CRM and mail
 * channels, the delivery log, the retry queue and the archive retries rebuild leads from.
 * Built from a Payload instance alone, so job handlers and CMS endpoints use it too.
 */
export function deliveryServices(payload: Payload) {
  const documents = new PayloadDocumentStore(payload)
  const saved = new PayloadSavedConfigurationRepository(payload)
  const mailbox = new DemoMailbox(payload, sender)
  const mailer: Mailer = env.MAIL_MODE === 'demo' ? mailbox : new SmtpMailer(payload)
  const deliveries = [
    ...secondarySinks().map(sinkDelivery),
    ...mailDeliveries(new PayloadLeadMails(payload), mailer),
  ]
  const journal = new PayloadLeadJournal(payload, adminLeadUrl)
  const retry: RetryDeliveryDeps = {
    archive: new PayloadLeadArchive(payload, saved, documents, configurationLink),
    deliveries,
    journal,
    clock: () => new Date(),
  }
  return {
    documents,
    saved,
    mailbox,
    primary: new CmsLeadSink(payload, adminLeadUrl),
    deliveries,
    journal,
    queue: new PayloadDeliveryQueue(payload),
    retry,
  }
}
