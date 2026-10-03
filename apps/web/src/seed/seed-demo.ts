import type { Payload } from 'payload'

import { seedArticles } from './steps/articles'
import { seedBuiltObjects, seedPages } from './steps/content'
import { seedDictionaries, seedUsers } from './steps/dictionaries'
import { seedLeads } from './steps/leads'
import { seedProjects } from './steps/projects'
import {
  seedCatalogOptions,
  seedFinancing,
  seedProduction,
  seedTariff,
  seedTechnology,
} from './steps/settings'

/**
 * Demo content generator. Idempotent: every document is keyed by a natural unique key, so
 * running it again brings the same documents back to the seed. Order matters: projects are
 * measured and priced on save, so the tariff and the catalog data come first.
 */
export async function seedDemoContent(payload: Payload, log: (message: string) => void) {
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
  log(`${await seedArticles(payload, projects)} articles`)
  await seedProduction(payload)
  log('production page')
  // Last: a lead needs the projects, the tariff and the company details in place.
  log(`${await seedLeads(payload)} sample leads`)
}
