import type { Payload } from 'payload'

import { BUILT_OBJECTS } from '../data/built-objects'
import { HOME, SITE } from '../data/places'
import { seedRender } from './media'
import { SEED, translate, upsert } from './upsert'

/** Built houses need their cover render; without it the object is skipped and reported. */
export async function seedBuiltObjects(payload: Payload, projects: Map<string, number>) {
  const objects = new Map<string, number>()
  const skipped: string[] = []
  for (const object of BUILT_OBJECTS) {
    const cover = await seedRender(payload, object.render, {
      ru: `${object.title.ru}, ${object.settlement.ru}`,
      en: `${object.title.en}, ${object.settlement.en}`,
    })
    if (cover === null) {
      skipped.push(object.slug)
      continue
    }
    const projectId = projects.get(object.project)
    if (projectId === undefined)
      throw new Error(`Built object ${object.slug} refers to unknown project ${object.project}`)
    const project = await payload.findByID({
      ...SEED,
      collection: 'projects',
      id: projectId,
      select: { metrics: true },
    })
    const id = await upsert(
      payload,
      'built-objects',
      { slug: { equals: object.slug } },
      {
        slug: object.slug,
        status: 'published',
        title: object.title.ru,
        settlement: object.settlement.ru,
        region: object.region.ru,
        year: object.year,
        area: project.metrics?.totalArea ?? 0,
        location: object.location,
        cover,
        project: projectId,
      },
    )
    await translate(payload, 'built-objects', id, {
      title: object.title.en,
      settlement: object.settlement.en,
      region: object.region.en,
    })
    objects.set(object.slug, id)
  }
  return { objects, skipped }
}

export async function seedPages(
  payload: Payload,
  projects: Map<string, number>,
  objects: Map<string, number>,
) {
  const hero = projects.get(HOME.hero)
  if (hero === undefined) throw new Error(`Hero project ${HOME.hero} is not seeded`)
  await payload.updateGlobal({
    ...SEED,
    slug: 'home',
    data: {
      heroProject: hero,
      featuredProjects: HOME.featured.flatMap((slug) => projects.get(slug) ?? []),
      builtObjects: HOME.builtObjects.flatMap((slug) => objects.get(slug) ?? []),
    },
  })
  await payload.updateGlobal({
    ...SEED,
    slug: 'site',
    locale: 'ru',
    data: {
      phone: SITE.phone,
      email: SITE.email,
      leadsEmail: SITE.leadsEmail,
      address: SITE.address.ru,
      hours: SITE.hours.ru,
      region: SITE.region.ru,
      location: SITE.location,
      legalName: SITE.legalName.ru,
      demoDetails: true,
      taxId: SITE.taxId,
      registrationNumber: SITE.registrationNumber,
      privacyEmail: SITE.privacyEmail,
      privacyEdition: SITE.privacyEdition,
    },
  })
  await payload.updateGlobal({
    ...SEED,
    slug: 'site',
    locale: 'en',
    data: {
      address: SITE.address.en,
      hours: SITE.hours.en,
      region: SITE.region.en,
      legalName: SITE.legalName.en,
    },
  })
}
