import type { Payload } from 'payload'

import type { DeliveryQueue } from '../ports/delivery-queue'

export const DELIVERY_TASK = 'deliver-lead'
export const DELIVERY_QUEUE = 'deliveries'

/** Retries through Payload's job queue: durable in the database, picked up by any instance. */
export class PayloadDeliveryQueue implements DeliveryQueue {
  constructor(private readonly payload: Payload) {}

  async retry(reference: string, channel: string): Promise<void> {
    await this.payload.jobs.queue({
      task: DELIVERY_TASK,
      queue: DELIVERY_QUEUE,
      input: { lead: reference, channel },
    })
  }
}
