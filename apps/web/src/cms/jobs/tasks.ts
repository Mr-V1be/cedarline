import type { TaskConfig } from 'payload'

import { deliveryServices } from '@/composition/deliveries'
import { financeServices } from '@/composition/finance'
import { refreshKeyRate } from '@/modules/finance/application/key-rate-service'
import { retryDelivery } from '@/modules/leads/application/retry-delivery'
import { DELIVERY_RETRY } from '@/modules/leads/domain/delivery-policy'
import {
  DELIVERY_QUEUE,
  DELIVERY_TASK,
} from '@/modules/leads/infrastructure/payload-delivery-queue'
import { DEMO_MAILBOX_RETENTION_DAYS } from '@/modules/mail/domain/mailbox'

/** Housekeeping runs in its own queue so that it never delays lead deliveries. */
export const MAINTENANCE_QUEUE = 'maintenance'
const DAY_MS = 86_400_000

/** One failed delivery of a lead, tried again with doubling pauses (see DELIVERY_RETRY). */
const deliverLead: TaskConfig<{ input: { lead: string; channel: string }; output: object }> = {
  slug: DELIVERY_TASK,
  label: 'Повтор доставки заявки / Lead delivery retry',
  inputSchema: [
    { name: 'lead', type: 'text', required: true },
    { name: 'channel', type: 'text', required: true },
  ],
  retries: {
    attempts: DELIVERY_RETRY.attempts,
    backoff: { type: 'exponential', delay: DELIVERY_RETRY.firstPauseMs },
  },
  handler: async ({ input, req }) => {
    const outcome = await retryDelivery(
      deliveryServices(req.payload).retry,
      input.lead,
      input.channel,
    )
    if (outcome.status === 'failed') throw new Error(outcome.error ?? 'Delivery failed')
    return { output: {} }
  },
}

/** Letters older than the retention period leave the demo mailbox with their attachments. */
const purgeMailbox: TaskConfig<{ input: object; output: { deleted: number } }> = {
  slug: 'purge-mailbox',
  label: 'Очистка демо-почты / Demo mailbox cleanup',
  schedule: [{ cron: '0 3 * * *', queue: MAINTENANCE_QUEUE }],
  handler: async ({ req }) => {
    const before = new Date(Date.now() - DEMO_MAILBOX_RETENTION_DAYS * DAY_MS)
    const deleted = await deliveryServices(req.payload).mailbox.purge(before)
    return { output: { deleted } }
  },
}

/** Keeps the cached key rate fresh, so visitors never wait for the Bank of Russia. */
const refreshKeyRateTask: TaskConfig<{ input: object; output: object }> = {
  slug: 'refresh-key-rate',
  label: 'Обновление ключевой ставки / Key rate refresh',
  schedule: [{ cron: '15 * * * *', queue: MAINTENANCE_QUEUE }],
  handler: async ({ req }) => {
    await refreshKeyRate(financeServices(req.payload).keyRate)
    return { output: {} }
  },
}

export const TASKS = [deliverLead, purgeMailbox, refreshKeyRateTask]
export { DELIVERY_QUEUE }
