import { addDataAndFileToRequest, type PayloadHandler } from 'payload'

import { deliveryServices } from '@/composition/deliveries'
import { retryDelivery, UnknownDeliveryError } from '@/modules/leads/application/retry-delivery'

import { userCan } from '../access/policies'

/**
 * Manual retry from the lead card: delivers the lead to one channel now and logs the outcome.
 * Only staff who may work leads can do it.
 */
export const retryLeadDelivery: PayloadHandler = async (req) => {
  if (!userCan(req.user, 'leads.write')) {
    return Response.json({ error: 'forbidden' }, { status: 403 })
  }
  await addDataAndFileToRequest(req)
  const id = req.routeParams?.id
  const channel: unknown = req.data?.channel
  if ((typeof id !== 'string' && typeof id !== 'number') || typeof channel !== 'string') {
    return Response.json({ error: 'bad-request' }, { status: 400 })
  }
  try {
    const outcome = await retryDelivery(deliveryServices(req.payload).retry, String(id), channel)
    return Response.json({ outcome })
  } catch (error) {
    if (error instanceof UnknownDeliveryError) {
      return Response.json({ error: 'not-found' }, { status: 404 })
    }
    throw error
  }
}
