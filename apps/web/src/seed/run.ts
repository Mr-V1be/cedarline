import config from '@payload-config'
import { getPayload } from 'payload'

import { seedBuiltObjects, seedPages } from './steps/content'
import { seedDictionaries, seedUsers } from './steps/dictionaries'
import { seedProjects } from './steps/projects'
import { seedCatalogOptions, seedFinancing, seedTariff, seedTechnology } from './steps/settings'

/**
 * Demo content generator. Idempotent: every document is keyed by a natural unique key, so
 * running it again updates the same documents. Order matters: projects are measured and
 * priced on save, so the tariff and the catalog data come first.
 */
async function seed() {
  const payload = await getPayload({ config })
  const log = (message: string) => {
    payload.logger.info(`seed: ${message}`)
  }

  await seedUsers(payload)
  log('users')
  const ids = await seedDictionaries(payload)
  log('project types and room kinds')
  await seedTechnology(payload)
  await seedCatalogOptions(payload)
  await seedTariff(payload)
  await seedFinancing(payload)
  log('technology, catalog options, tariff and financing')
  const projects = await seedProjects(payload, ids)
  log(`${projects.size} projects`)
  const { objects, skipped } = await seedBuiltObjects(payload, projects)
  log(`${objects.size} built houses`)
  if (skipped.length > 0) {
    payload.logger.warn(
      `seed: no cover render yet for ${skipped.join(', ')} — run \`pnpm render:covers\` and seed again`,
    )
  }
  await seedPages(payload, projects, objects)
  log('home page and company details')
}

await seed()
process.exit(0)
