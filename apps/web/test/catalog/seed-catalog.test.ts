import { Configurator, blueprintIssues } from '@kedrovnik/configurator'
import { measureHouse } from '@kedrovnik/house'
import { lowestQuote } from '@kedrovnik/pricing'
import { describe, expect, it } from 'vitest'

import { quoteHouse } from '@/modules/pricing/application/quote-house'
import { standardsFor } from '@/modules/technology/application/standards'
import { COMPLETENESS } from '@/seed/data/tariff'

import {
  PROJECTS,
  blueprintOf,
  grid,
  houseDesignOf,
  layers,
  offer,
  rooms,
} from '../support/seed-model'

/** The demo catalog is content, but broken content is a regression people would see. */
describe('demo catalog', () => {
  it.each(PROJECTS.map((project) => [project.slug, project] as const))(
    '%s is a valid, priceable house',
    (_, project) => {
      const { defaults, design } = project
      const houseDesign = houseDesignOf(design)
      const house = measureHouse({
        design: houseDesign,
        options: defaults,
        rooms,
        standards: standardsFor(layers, defaults.insulation),
      })
      const quotes = quoteHouse(house, houseDesign, defaults, defaults.engineering, grid)
      expect(quotes).toHaveLength(COMPLETENESS.length)
      const totals = quotes.map((quote) => quote.estimate.total)
      expect([...totals].sort((a, b) => a - b)).toEqual(totals)
      expect(lowestQuote(quotes)?.estimate.completeness).toBe('shell')
      expect(house.metrics.totalArea).toBeGreaterThan(0)
    },
  )
})

describe('demo configurator', () => {
  it.each(PROJECTS.map((project) => [project.slug, project] as const))(
    '%s opens buildable in every offered footprint and plan',
    (_, project) => {
      const blueprint = blueprintOf(project)
      const configurator = new Configurator({
        family: [blueprint],
        offer,
        house: { rooms, standards: standardsFor(layers, project.defaults.insulation) },
        grid,
      })
      const issues = blueprintIssues(configurator, blueprint).map(
        (issue) =>
          `${issue.configuration.footprint.width}x${issue.configuration.footprint.depth}` +
          `${issue.configuration.mirrored ? ' mirrored' : ''}: ${JSON.stringify(issue.restrictions)}`,
      )
      expect(issues).toEqual([])
    },
  )

  it('links every storey variant to a main project with the same footprint', () => {
    for (const variant of PROJECTS.filter((project) => project.variantOf !== undefined)) {
      const main = PROJECTS.find((project) => project.slug === variant.variantOf)
      expect(main?.variantOf).toBeUndefined()
      expect([main?.design.width, main?.design.depth]).toEqual([
        variant.design.width,
        variant.design.depth,
      ])
    }
  })
})
