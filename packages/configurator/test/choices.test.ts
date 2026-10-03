import { describe, expect, it } from 'vitest'

import {
  applyChoice,
  choicesOf,
  designSelections,
  houseInputOf,
  initialConfiguration,
  selectionsOf,
  unofferedGroups,
} from '../src'
import { model, pineBlueprint } from './fixtures'

const initial = initialConfiguration(model)

describe('choices', () => {
  it('lists footprints by area and terrace depths with the project default', () => {
    expect(choicesOf(model, initial, 'footprint')).toEqual(['2400x2400', '6000x6000', '7200x6000'])
    expect(choicesOf(model, initial, 'terrace')).toEqual(['0', '1500', '2000', '2500'])
    expect(choicesOf(model, initial, 'layout')).toEqual(['base', 'mirrored'])
  })

  it('brings the first colour of a new finish', () => {
    const fibre = applyChoice(model, initial, { group: 'facade', value: 'fiber-cement' })
    expect(fibre.colour).toBe('#e4e1d8')
    const back = applyChoice(model, fibre, { group: 'facade', value: 'planken' })
    expect(back.colour).toBe('#3a3e3c')
  })

  it('keeps what it can when switching to another storey variant', () => {
    const wide = applyChoice(model, initial, { group: 'footprint', value: '7200x6000' })
    const mirrored = applyChoice(model, wide, { group: 'layout', value: 'mirrored' })
    const attic = applyChoice(model, mirrored, { group: 'project', value: 'pine-attic' })
    expect(attic).toMatchObject({
      project: 'pine-attic',
      footprint: { width: 6000, depth: 6000 },
      mirrored: false,
      terrace: 2000,
    })
  })

  it('toggles engineering systems in offer order', () => {
    const heating = applyChoice(model, initial, { group: 'engineering', value: 'heating' })
    const none = applyChoice(model, heating, { group: 'engineering', value: 'electrics' })
    expect(heating.engineering).toEqual(['electrics', 'heating'])
    expect(none.engineering).toEqual(['heating'])
  })

  it('builds the house input: resized, mirrored, without the terrace', () => {
    const configured = [
      { group: 'footprint', value: '7200x6000' },
      { group: 'layout', value: 'mirrored' },
      { group: 'terrace', value: '0' },
      { group: 'roof', value: 'gable' },
    ] as const
    const configuration = configured.reduce(
      (current, choice) => applyChoice(model, current, choice),
      initial,
    )
    const input = houseInputOf(model, configuration)
    expect(input.design.width).toBe(7200)
    expect(input.design.openings.map((opening) => opening.offset)).toEqual([4680, 3210, 1320])
    expect(input.options.terraceDepth).toBeNull()
    expect(input.options.roofPitch).toBeUndefined()
  })
})

describe('selections', () => {
  it('describe a configuration and the project as designed alike', () => {
    const { design, defaults } = pineBlueprint
    expect(selectionsOf(initial, design)).toEqual(
      designSelections(design, defaults.options, initial.engineering),
    )
    expect(selectionsOf({ ...initial, mirrored: true, terrace: 0 }, design)).toMatchObject({
      layout: 'mirrored',
      terrace: '0',
      storeys: '1',
    })
  })
})

describe('unofferedGroups', () => {
  it('finds values the offer no longer has', () => {
    expect(unofferedGroups(model, initial)).toEqual([])
    expect(
      unofferedGroups(model, { ...initial, colour: '#123456', engineering: ['sauna-stove'] }),
    ).toEqual(['colour', 'engineering'])
    expect(unofferedGroups(model, { ...initial, project: 'gone' })).toEqual(['project'])
  })
})
