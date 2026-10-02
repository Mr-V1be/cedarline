import { measureHouse, type RoomKindCatalog } from '@kedrovnik/house'
import { Money, lowestQuote, validateTariffGrid, type TariffGrid } from '@kedrovnik/pricing'
import { describe, expect, it } from 'vitest'

import { quoteHouse } from '@/modules/pricing/application/quote-house'
import { standardsFor } from '@/modules/technology/application/standards'
import { ROOM_KINDS } from '@/seed/data/dictionaries'
import { WALL_LAYERS } from '@/seed/data/technology'
import {
  COMPLETENESS,
  PHASES,
  RATES,
  SECTIONS,
  STAGES,
  WORKING_DAYS_PER_WEEK,
} from '@/seed/data/tariff'
import { HOUSES } from '@/seed/data/projects/houses'
import { SMALL_BUILDINGS } from '@/seed/data/projects/small-buildings'

/** The demo catalog is content, but broken content is a regression people would see. */
const rooms: RoomKindCatalog = Object.fromEntries(
  ROOM_KINDS.map((kind) => [
    kind.key,
    { bedroom: kind.bedroom ?? false, wetZone: kind.wetZone ?? false, stair: kind.stair ?? false },
  ]),
)

const grid: TariffGrid = validateTariffGrid({
  revision: 1,
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

const layers = WALL_LAYERS.map((layer) => ({ ...layer, conductivity: layer.conductivity ?? null }))

describe('demo catalog', () => {
  it.each([...HOUSES, ...SMALL_BUILDINGS].map((project) => [project.slug, project] as const))(
    '%s is a valid, priceable house',
    (_, project) => {
      const { defaults, design } = project
      const house = measureHouse({
        design: {
          ...design,
          rooms: design.rooms.map((room) => ({ ...room, id: room.key })),
          openings: design.openings.map((opening) => ({ ...opening, id: opening.key })),
          doors: design.doors.map((door) => ({ ...door, id: door.key })),
        },
        options: defaults,
        rooms,
        standards: standardsFor(layers, defaults.insulation),
      })
      const quotes = quoteHouse(house, defaults, defaults.engineering, grid)
      expect(quotes).toHaveLength(COMPLETENESS.length)
      const totals = quotes.map((quote) => quote.estimate.total)
      expect([...totals].sort((a, b) => a - b)).toEqual(totals)
      expect(lowestQuote(quotes)?.estimate.completeness).toBe('shell')
      expect(house.metrics.totalArea).toBeGreaterThan(0)
    },
  )
})
