/** Retries a failed delivery later with growing pauses, until it gets through or gives up. */
export interface DeliveryQueue {
  retry(reference: string, channel: string): Promise<void>
}
