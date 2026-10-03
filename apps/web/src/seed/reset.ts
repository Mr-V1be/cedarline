import config from '@payload-config'
import { getPayload } from 'payload'

import { resetDemoData } from './reset-demo'

/** `pnpm demo:reset`: the nightly reset of a demo stand, run by hand (e.g. after a load test). */
const payload = await getPayload({ config })
await resetDemoData(payload, (message) => {
  payload.logger.info(`reset: ${message}`)
})
process.exit(0)
