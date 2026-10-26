import {
  validateOffer,
  type ConfiguratorModel,
  type ConfiguratorOffer,
  type ProjectBlueprint,
} from '@cedarline/configurator'
import type { HouseDesign, RoomKindCatalog } from '@cedarline/house'
import { Money, validateTariffGrid, type TariffGrid } from '@cedarline/pricing'

import { standardsFor } from '@/modules/technology/application/standards'
import {
  COMPATIBILITY_RULES,
  ENGINEERING_SYSTEMS,
  FACADE_PALETTES,
  OFFERED_ROOFS,
  OFFERED_WINDOWS,
  TERRACE_DEPTHS,
} from '@/seed/data/catalog-options'
import { ROOM_KINDS } from '@/seed/data/dictionaries'
import type { ProjectSeed } from '@/seed/data/projects/builder'
import { HOUSES } from '@/seed/data/projects/houses'
import { SMALL_BUILDINGS } from '@/seed/data/projects/small-buildings'
import { STOREY_VARIANTS } from '@/seed/data/projects/variants'
import { INSULATION_OPTIONS, WALL_LAYERS } from '@/seed/data/technology'
import {
  ADVERTISED_ROUNDING,
  COMPLETENESS,
  PHASES,
  RATES,
  SECTIONS,
  STAGES,
  WORKING_DAYS_PER_WEEK,
} from '@/seed/data/tariff'

/**
 * The demo catalog as domain data, built from the seed: tests run the real tariff, offer and
 * designs without a database.
 */
export const PROJECTS: readonly ProjectSeed[] = [...HOUSES, ...SMALL_BUILDINGS, ...STOREY_VARIANTS]

export const rooms: RoomKindCatalog = Object.fromEntries(
  ROOM_KINDS.map((kind) => [
    kind.key,
    { bedroom: kind.bedroom ?? false, wetZone: kind.wetZone ?? false, stair: kind.stair ?? false },
  ]),
)

export const grid: TariffGrid = validateTariffGrid({
  revision: 1,
  advertisedRounding: {
    step: Money.ofRubles(ADVERTISED_ROUNDING.step),
    mode: ADVERTISED_ROUNDING.mode,
  },
  sections: SECTIONS.map(({ key }) => ({ key })),
  rates: RATES.map((rate) => ({
    code: rate.code,
    section: rate.section,
    driver: rate.driver,
    unitPrice: Money.ofRubles(rate.unitPrice),
    conditions: (rate.conditions ?? []).map((condition) => ({
      option: condition.option,
      anyOf: condition.values,
    })),
  })),
  completeness: COMPLETENESS.map(({ key, sections }) => ({ key, sections })),
  schedule: {
    workingDaysPerWeek: WORKING_DAYS_PER_WEEK,
    phases: PHASES.map(({ key }) => ({ key })),
    stages: STAGES.map((stage) => ({ ...stage, dependsOn: stage.dependsOn })),
  },
})

export const layers = WALL_LAYERS.map((layer) => ({
  ...layer,
  conductivity: layer.conductivity ?? null,
}))

export const offer: ConfiguratorOffer = validateOffer({
  roofs: OFFERED_ROOFS,
  facades: FACADE_PALETTES.map((palette) => ({
    finish: palette.finish,
    colours: palette.colors.map((colour) => colour.hex),
  })),
  windowStyles: OFFERED_WINDOWS,
  terrace: { depths: TERRACE_DEPTHS, removable: true },
  insulation: INSULATION_OPTIONS,
  engineering: ENGINEERING_SYSTEMS.map(({ key, requires }) => ({ key, requires })),
  rules: COMPATIBILITY_RULES.map((rule) => ({
    id: rule.key,
    when: rule.when.map((condition) => ({ option: condition.option, anyOf: condition.values })),
  })),
})

export function houseDesignOf(design: ProjectSeed['design']): HouseDesign {
  return {
    ...design,
    rooms: design.rooms.map((room) => ({ ...room, id: room.key })),
    openings: design.openings.map((opening) => ({ ...opening, id: opening.key })),
    doors: design.doors.map((door) => ({ ...door, id: door.key })),
  }
}

export const blueprintOf = (project: ProjectSeed): ProjectBlueprint => ({
  slug: project.slug,
  design: houseDesignOf(project.design),
  defaults: { options: project.defaults, engineering: project.defaults.engineering },
  sizes: project.sizes,
  mirrorable: true,
})

/** A configurator model of one project series from the seed. */
export function seedModel(...slugs: readonly string[]): ConfiguratorModel {
  const family = slugs.map((slug) => {
    const project = PROJECTS.find((candidate) => candidate.slug === slug)
    if (project === undefined) throw new Error(`No seed project ${slug}`)
    return blueprintOf(project)
  })
  return {
    family,
    offer,
    house: { rooms, standards: standardsFor(layers, INSULATION_OPTIONS[0]) },
    grid,
  }
}

export const SEED_NAMES = {
  colours: Object.fromEntries(
    FACADE_PALETTES.flatMap((palette) =>
      palette.colors.map((colour) => [colour.hex.toLowerCase(), colour.name.ru]),
    ),
  ),
  systems: Object.fromEntries(ENGINEERING_SYSTEMS.map((system) => [system.key, system.name.ru])),
  rules: Object.fromEntries(COMPATIBILITY_RULES.map((rule) => [rule.key, rule.message.ru])),
  tariff: {
    sections: Object.fromEntries(SECTIONS.map((section) => [section.key, section.name.ru])),
    completeness: Object.fromEntries(COMPLETENESS.map((level) => [level.key, level.name.ru])),
    phases: Object.fromEntries(PHASES.map((phase) => [phase.key, phase.name.ru])),
    stages: Object.fromEntries(STAGES.map((stage) => [stage.key, stage.name.ru])),
    rates: Object.fromEntries(RATES.map((rate) => [rate.code, rate.name.ru])),
  },
}
