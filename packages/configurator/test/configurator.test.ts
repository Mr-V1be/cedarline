import { Money } from '@kedrovnik/pricing'
import { describe, expect, it } from 'vitest'

import {
  Configurator,
  ConfiguratorError,
  initialConfiguration,
  type Configuration,
  type GroupState,
  type OptionGroup,
} from '../src'
import { model } from './fixtures'

const configurator = new Configurator(model)
const initial = initialConfiguration(model)

const group = (configuration: Configuration, key: OptionGroup): GroupState => {
  const state = configurator.evaluate(configuration).groups.find((item) => item.group === key)
  if (state === undefined) throw new Error(`no group ${key}`)
  return state
}
const choice = (configuration: Configuration, key: OptionGroup, value: string) => {
  const state = group(configuration, key).choices.find((item) => item.value === value)
  if (state === undefined) throw new Error(`no choice ${key}=${value}`)
  return state
}

describe('configurator state', () => {
  it('opens with the catalog defaults and the first completeness', () => {
    expect(initial).toEqual({
      project: 'pine',
      footprint: { width: 6000, depth: 6000 },
      mirrored: false,
      roof: 'shed',
      facade: 'planken',
      colour: '#3a3e3c',
      windows: 'standard',
      terrace: 2000,
      insulation: 150,
      engineering: ['electrics'],
      completeness: 'shell',
    })
    const state = configurator.evaluate(initial)
    expect(state.quote.estimate.total).toBeGreaterThan(0)
    expect(state.house.options.roofPitch).toBe(12)
    expect(state.groups.map((item) => item.group)).toHaveLength(11)
  })

  it('prices every possible choice as a change of the total', () => {
    const bigger = choice(initial, 'footprint', '7200x6000')
    expect(bigger.delta).toBeGreaterThan(0)
    const noTerrace = choice(initial, 'terrace', '0')
    const deck = configurator
      .evaluate(initial)
      .quote.estimate.sections.find((section) => section.key === 'terrace')
    expect(noTerrace.delta).toBe(Money.subtract(Money.zero, deck?.subtotal ?? Money.zero))
    expect(choice(initial, 'colour', '#b98b5a').delta).toBe(Money.zero)
  })

  it('blocks a catalog rule and explains it by the rule id', () => {
    const panoramic = choice(initial, 'windows', 'panoramic')
    expect(panoramic.restrictions).toEqual([{ kind: 'rule', rule: 'panoramic-needs-200' }])
    expect(panoramic.delta).toBeNull()

    const thick = configurator.apply(initial, { group: 'insulation', value: '200' })
    expect(choice(thick, 'windows', 'panoramic')).toMatchObject({ restrictions: [] })
    expect(choice(thick, 'windows', 'panoramic').delta).toBeGreaterThan(0)
    // Going back to 150 mm is blocked while panoramic windows are chosen.
    const glazed = configurator.apply(thick, { group: 'windows', value: 'panoramic' })
    expect(choice(glazed, 'insulation', '150').restrictions).toEqual([
      { kind: 'rule', rule: 'panoramic-needs-200' },
    ])
  })

  it('keeps engineering dependencies in both directions', () => {
    expect(choice(initial, 'engineering', 'water').restrictions).toEqual([
      { kind: 'requires', system: 'water', missing: ['heating'] },
    ])
    const heated = configurator.apply(initial, { group: 'engineering', value: 'heating' })
    expect(heated.engineering).toEqual(['electrics', 'heating'])
    expect(choice(heated, 'engineering', 'electrics').restrictions).toEqual([
      { kind: 'requires', system: 'heating', missing: ['electrics'] },
    ])
  })

  it('tells where engineering is priced when the completeness leaves it out', () => {
    expect(group(initial, 'engineering').pricedIn).toEqual(['full'])
    expect(choice(initial, 'engineering', 'heating').delta).toBe(Money.zero)
    const full = configurator.apply(initial, { group: 'completeness', value: 'full' })
    expect(group(full, 'engineering').pricedIn).toEqual([])
    expect(choice(full, 'engineering', 'heating').delta).toBeGreaterThan(0)
    expect(choice(initial, 'completeness', 'full').delta).toBeGreaterThan(0)
  })

  it('does not put an attic under a roof that cannot cover it', () => {
    expect(choice(initial, 'project', 'pine-attic').restrictions).toEqual([
      { kind: 'attic-roof', roof: 'shed' },
    ])
    const gable = configurator.apply(initial, { group: 'roof', value: 'gable' })
    const attic = configurator.apply(gable, { group: 'project', value: 'pine-attic' })
    expect(attic.project).toBe('pine-attic')
    expect(choice(attic, 'roof', 'shed').restrictions).toEqual([
      { kind: 'attic-roof', roof: 'shed' },
    ])
    expect(configurator.evaluate(attic).house.options.roofPitch).toBe(35)
  })

  it('blocks a footprint the design cannot be built in', () => {
    expect(choice(initial, 'footprint', '2400x2400').restrictions).toEqual([
      { kind: 'geometry', code: 'OPENINGS_OVERLAP' },
    ])
  })

  it('refuses blocked and unknown choices', () => {
    const refuse = (value: string, group: OptionGroup) => {
      try {
        configurator.apply(initial, { group, value })
      } catch (error) {
        return error instanceof ConfiguratorError ? error.code : 'other'
      }
      return 'accepted'
    }
    expect(refuse('panoramic', 'windows')).toBe('RESTRICTED_CHOICE')
    expect(refuse('thatch', 'roof')).toBe('UNKNOWN_CHOICE')
    expect(refuse('2400x2400', 'footprint')).toBe('RESTRICTED_CHOICE')
    expect(() =>
      configurator.evaluate({ ...initial, footprint: { width: 2400, depth: 2400 } }),
    ).toThrow(ConfiguratorError)
  })
})

describe('partial evaluation', () => {
  it('works out only the requested groups', () => {
    const state = configurator.evaluate(initial, ['roof', 'windows'])
    expect(state.groups.map((item) => item.group)).toEqual(['roof', 'windows'])
    expect(state.quote.estimate.total).toBe(configurator.evaluate(initial).quote.estimate.total)
  })
})
