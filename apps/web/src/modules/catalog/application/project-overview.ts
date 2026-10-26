import {
  housePlans,
  measureHouse,
  type ConstructionStandards,
  type FloorPlan,
  type HouseDesign,
  type HouseOptions,
  type RoomKindCatalog,
  type Takeoff,
} from '@cedarline/house'
import type { Quote } from '@cedarline/pricing'

import type { Locale } from '@/i18n/locales'
import { quoteHouse } from '@/modules/pricing/application/quote-house'
import { toOffer, type CompletenessOffer } from '@/modules/pricing/application/offers'
import type { TariffRepository } from '@/modules/pricing/ports/tariff-repository'

import type { ProjectDetails } from '../domain/project'
import type { HouseContextRepository } from '../ports/house-context-repository'
import type { ProjectRepository } from '../ports/project-repository'

/** Everything the 3D viewer needs to rebuild the house on the client; plain serialisable data. */
export interface HouseViewerInput {
  readonly design: HouseDesign
  readonly options: HouseOptions
  readonly rooms: RoomKindCatalog
  readonly standards: ConstructionStandards
}

export interface ProjectOverview {
  readonly project: ProjectDetails
  readonly takeoff: Takeoff
  readonly wallThickness: number
  readonly plans: readonly FloorPlan[]
  readonly roomNames: Readonly<Record<string, string>>
  /** One offer per completeness level, cheapest first as in the tariff grid. */
  readonly offers: readonly CompletenessOffer[]
  readonly viewer: HouseViewerInput
}

export interface ProjectOverviewDeps {
  readonly projects: ProjectRepository
  readonly houseContext: HouseContextRepository
  readonly tariff: TariffRepository
}

/** Project page model: measured house, floor plans and a quote per completeness level. */
export async function loadProjectOverview(
  deps: ProjectOverviewDeps,
  slug: string,
  locale: Locale,
): Promise<ProjectOverview | null> {
  const [project, context, tariff] = await Promise.all([
    deps.projects.findBySlug(slug, locale),
    deps.houseContext.load(locale),
    deps.tariff.load(),
  ])
  if (project === null) return null

  const viewer: HouseViewerInput = {
    design: project.design,
    options: project.options,
    rooms: context.rooms,
    standards: context.standards,
  }
  const house = measureHouse(viewer)
  const quotes: readonly Quote[] = quoteHouse(
    house,
    project.design,
    project.options,
    project.engineering,
    tariff.grid,
  )

  return {
    project,
    takeoff: house.takeoff,
    wallThickness: house.frame.spec.wallThickness,
    plans: housePlans(house, context.rooms),
    roomNames: context.roomNames,
    offers: quotes.map((quote) => toOffer(quote, tariff.names)),
    viewer,
  }
}
