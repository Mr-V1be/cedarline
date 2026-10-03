/**
 * How failed deliveries are retried: pauses double after every attempt (1, 2, 4, 8, 16 min),
 * then the channel is left for a manager to retry from the lead card.
 */
export const DELIVERY_RETRY = { attempts: 5, firstPauseMs: 60_000 } as const
