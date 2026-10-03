import type { Endpoint } from 'payload'

/**
 * Readiness of an instance for the container healthcheck and the reverse proxy: the server
 * answers and the database takes a query. No details leave it, only the status.
 */
export const health: Endpoint = {
  path: '/health',
  method: 'get',
  handler: async (req) => {
    try {
      await req.payload.count({ collection: 'project-types', overrideAccess: true })
      return Response.json({ status: 'ok' }, { headers: { 'cache-control': 'no-store' } })
    } catch (error) {
      req.payload.logger.error({ err: error }, 'Health check: the database does not answer')
      return Response.json(
        { status: 'unavailable' },
        { status: 503, headers: { 'cache-control': 'no-store' } },
      )
    }
  },
}
