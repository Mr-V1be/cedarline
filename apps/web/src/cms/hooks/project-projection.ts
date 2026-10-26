import { HouseError } from '@cedarline/house'
import { ValidationError, type CollectionBeforeChangeHook } from 'payload'

import type { Project } from '@/cms/generated/payload-types'
import { projectProject } from '@/modules/catalog/application/project-projection'
import {
  toProjectionInput,
  type ProjectSource,
} from '@/modules/catalog/infrastructure/project-design-mapper'
import { relationId } from '@/modules/catalog/infrastructure/project-design-mapper'
import { loadRoomKindIndex } from '@/modules/catalog/infrastructure/room-kind-index'
import {
  blueprintProblems,
  describeProblem,
} from '@/modules/configurator/application/blueprint-problems'
import { toBlueprint } from '@/modules/configurator/infrastructure/blueprint-mapper'
import { toConfiguratorOffer } from '@/modules/configurator/infrastructure/options-mapper'
import { PayloadTariffRepository } from '@/modules/pricing/infrastructure/payload-tariff-repository'
import { standardsFor } from '@/modules/technology/application/standards'
import { PayloadTechnologyRepository } from '@/modules/technology/infrastructure/payload-technology-repository'

import { requestLocale } from './request-locale'

/** Where in the form a house error belongs. */
const HOUSE_ERROR_PATHS: Partial<Record<HouseError['code'], string>> = {
  ROOM_OUT_OF_BOUNDS: 'design.rooms',
  ROOMS_OVERLAP: 'design.rooms',
  OPENING_OUT_OF_WALL: 'design.openings',
  OPENINGS_OVERLAP: 'design.openings',
  TERRACE_OUT_OF_WALL: 'design.terrace',
  TERRACE_ENTRANCE: 'design.terrace',
  ENTRANCE_INVALID: 'design.openings',
  UNKNOWN_OPTION: 'defaults',
}

const invalid = (
  path: string,
  message: string,
  req: Parameters<CollectionBeforeChangeHook>[0]['req'],
) => new ValidationError({ collection: 'projects', errors: [{ path, message }], req })

/**
 * A series is one level deep: a variant points to the main project, which points nowhere, so
 * the configurator finds every variant of a project with one query.
 */
async function assertSeries(
  source: ProjectSource,
  id: number | undefined,
  req: Parameters<CollectionBeforeChangeHook>[0]['req'],
) {
  const variantOf = source.configurator?.variantOf
  if (variantOf === null || variantOf === undefined) return
  const rootId = relationId(variantOf)
  if (rootId === id) throw invalid('configurator.variantOf', 'A project cannot vary itself', req)
  const root = await req.payload.findByID({
    collection: 'projects',
    id: rootId,
    depth: 0,
    req,
    overrideAccess: true,
    select: { configurator: true },
  })
  const rootIsVariant = root.configurator?.variantOf != null
  const hasVariants =
    id !== undefined &&
    (
      await req.payload.count({
        collection: 'projects',
        req,
        overrideAccess: true,
        where: { 'configurator.variantOf': { equals: id } },
      })
    ).totalDocs > 0
  if (rootIsVariant || hasVariants) {
    throw invalid(
      'configurator.variantOf',
      'Укажите основной проект серии: варианты не ссылаются друг на друга / point to the main project of the series',
      req,
    )
  }
}

/**
 * Measures and prices the project on every save: the stored characteristics and «price from»
 * are a projection of the design, the tariff and the catalog data, never typed by hand.
 */
export const applyProjectProjection: CollectionBeforeChangeHook<Project> = async ({
  data,
  originalDoc,
  req,
}) => {
  const source = { ...originalDoc, ...data } as ProjectSource
  const locale = requestLocale(req)
  // Sequential on purpose: these reads share the save's transaction, i.e. one connection.
  const rooms = await loadRoomKindIndex(req.payload, locale, req)
  const technology = await new PayloadTechnologyRepository(req.payload, locale, req).load()
  const tariff = await new PayloadTariffRepository(req.payload, locale, req).load()
  const options = await req.payload.findGlobal({ slug: 'catalog-options', depth: 0, locale, req })

  const input = toProjectionInput(source, rooms.keyOf)
  if (!technology.insulationOptions.includes(input.options.insulation)) {
    throw invalid(
      'defaults.insulation',
      `Insulation ${input.options.insulation} mm is not offered`,
      req,
    )
  }
  const systems = new Set((options.engineeringSystems ?? []).map((system) => system.key))
  const unknownSystem = input.engineering.find((key) => !systems.has(key))
  if (unknownSystem !== undefined) {
    throw invalid('defaults.engineering', `Unknown building service "${unknownSystem}"`, req)
  }

  const house = {
    rooms: rooms.catalog,
    standards: standardsFor(technology.layers, input.options.insulation),
  }
  try {
    const projection = projectProject(input, house, tariff.grid)
    await assertSeries(source, originalDoc?.id, req)
    const blueprint = toBlueprint({ ...source, slug: source.slug ?? '' }, rooms.keyOf)
    const offer = toConfiguratorOffer(options, technology.insulationOptions)
    const [problem] = blueprintProblems([blueprint], offer, house, tariff.grid)
    if (problem !== undefined) throw invalid('configurator.sizes', describeProblem(problem), req)
    return { ...data, metrics: projection.metrics, pricing: projection.pricing }
  } catch (error) {
    if (error instanceof HouseError)
      throw invalid(HOUSE_ERROR_PATHS[error.code] ?? 'design', error.message, req)
    throw error
  }
}
