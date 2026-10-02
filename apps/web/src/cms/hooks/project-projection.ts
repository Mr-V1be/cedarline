import { HouseError } from '@kedrovnik/house'
import { ValidationError, type CollectionBeforeChangeHook } from 'payload'

import type { Project } from '@/cms/generated/payload-types'
import { DEFAULT_LOCALE, isLocale, type Locale } from '@/i18n/locales'
import { projectProject } from '@/modules/catalog/application/project-projection'
import {
  toProjectionInput,
  type ProjectSource,
} from '@/modules/catalog/infrastructure/project-design-mapper'
import { loadRoomKindIndex } from '@/modules/catalog/infrastructure/room-kind-index'
import { PayloadTariffRepository } from '@/modules/pricing/infrastructure/payload-tariff-repository'
import { standardsFor } from '@/modules/technology/application/standards'
import { PayloadTechnologyRepository } from '@/modules/technology/infrastructure/payload-technology-repository'

/** Where in the form a house error belongs. */
const HOUSE_ERROR_PATHS: Partial<Record<HouseError['code'], string>> = {
  ROOM_OUT_OF_BOUNDS: 'design.rooms',
  ROOMS_OVERLAP: 'design.rooms',
  OPENING_OUT_OF_WALL: 'design.openings',
  OPENINGS_OVERLAP: 'design.openings',
  TERRACE_OUT_OF_WALL: 'design.terrace',
  UNKNOWN_OPTION: 'defaults',
}

/**
 * Local API calls that share `req` adopt the locale they are given for the whole request, so
 * nested reads must use the request's own locale or they would switch the locale of the save.
 */
function requestLocale(req: Parameters<CollectionBeforeChangeHook>[0]['req']): Locale {
  return typeof req.locale === 'string' && isLocale(req.locale) ? req.locale : DEFAULT_LOCALE
}

const invalid = (
  path: string,
  message: string,
  req: Parameters<CollectionBeforeChangeHook>[0]['req'],
) => new ValidationError({ collection: 'projects', errors: [{ path, message }], req })

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

  try {
    const projection = projectProject(
      input,
      {
        rooms: rooms.catalog,
        standards: standardsFor(technology.layers, input.options.insulation),
      },
      tariff.grid,
    )
    return { ...data, metrics: projection.metrics, pricing: projection.pricing }
  } catch (error) {
    if (error instanceof HouseError)
      throw invalid(HOUSE_ERROR_PATHS[error.code] ?? 'design', error.message, req)
    throw error
  }
}
