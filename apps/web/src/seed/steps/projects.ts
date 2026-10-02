import type { Payload } from 'payload'

import enRegistry from '@/i18n/messages/en/registry.json'
import ruRegistry from '@/i18n/messages/ru/registry.json'

import { t } from '../data/localized'
import { GALLERY_RENDERS, projectRenderName } from '../data/renders'
import type { ProjectSeed } from '../data/projects/builder'
import { HOUSES } from '../data/projects/houses'
import { SMALL_BUILDINGS } from '../data/projects/small-buildings'
import { seedRender } from './media'
import { translate, upsert } from './upsert'

export const PROJECTS: readonly ProjectSeed[] = [...HOUSES, ...SMALL_BUILDINGS]

async function gallery(payload: Payload, project: ProjectSeed) {
  const items: Array<{ image: number; view: (typeof GALLERY_RENDERS)[number]['view'] }> = []
  for (const { view } of GALLERY_RENDERS) {
    const alt = t(
      `Проект «${project.title.ru}»: ${ruRegistry.galleryView[view].toLowerCase()}`,
      `“${project.title.en}” project: ${enRegistry.galleryView[view].toLowerCase()} view`,
    )
    const image = await seedRender(payload, projectRenderName(project.slug, view), alt)
    if (image !== null) items.push({ image, view })
  }
  return items
}

export async function seedProjects(
  payload: Payload,
  ids: { types: Map<string, number>; roomKinds: Map<string, number> },
) {
  const projects = new Map<string, number>()
  for (const project of PROJECTS) {
    const type = ids.types.get(project.type)
    if (type === undefined) throw new Error(`Unknown project type ${project.type}`)
    const kindId = (key: string) => {
      const id = ids.roomKinds.get(key)
      if (id === undefined) throw new Error(`Unknown room kind ${key} in ${project.slug}`)
      return id
    }
    const { design } = project
    const id = await upsert(
      payload,
      'projects',
      { slug: { equals: project.slug } },
      {
        slug: project.slug,
        title: project.title.ru,
        summary: project.summary.ru,
        status: 'published',
        sortOrder: project.sortOrder,
        type,
        gallery: await gallery(payload, project),
        design: {
          width: design.width,
          depth: design.depth,
          storeys: design.storeys,
          attic: design.attic,
          storeyHeight: design.storeyHeight,
          ridgeAxis: design.ridgeAxis,
          rooms: design.rooms.map((room) => ({ ...room, kind: kindId(room.kind) })),
          openings: design.openings.map((opening) => ({ ...opening })),
          doors: design.doors.map((door) => ({ ...door })),
          terrace:
            design.terrace === null ? { enabled: false } : { enabled: true, ...design.terrace },
          chimney:
            design.chimney === null ? { enabled: false } : { enabled: true, ...design.chimney },
        },
        defaults: { ...project.defaults, engineering: [...project.defaults.engineering] },
      },
    )
    await translate(payload, 'projects', id, {
      title: project.title.en,
      summary: project.summary.en,
    })
    projects.set(project.slug, id)
  }
  return projects
}
