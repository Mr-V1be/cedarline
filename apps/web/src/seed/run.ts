import config from '@payload-config'
import { getPayload } from 'payload'

import { seedDemoContent } from './seed-demo'

const payload = await getPayload({ config })
await seedDemoContent(payload, (message) => {
  payload.logger.info(`seed: ${message}`)
})
process.exit(0)
