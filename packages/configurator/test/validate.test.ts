import { describe, expect, it } from 'vitest'

import { Configurator, blueprintIssues, validateOffer, type ConfiguratorOffer } from '../src'
import { model, offer, pineAtticBlueprint, pineBlueprint } from './fixtures'

const broken = (patch: Partial<ConfiguratorOffer>) => () => validateOffer({ ...offer, ...patch })

describe('validateOffer', () => {
  it('accepts the fixture offer', () => {
    expect(validateOffer(offer)).toBe(offer)
  })

  it('rejects inconsistent offers', () => {
    expect(broken({ roofs: [] })).toThrow('roof')
    expect(broken({ roofs: ['gable', 'gable'] })).toThrow('Duplicate')
    expect(broken({ facades: [{ finish: 'planken', colours: ['green'] }] })).toThrow('#rrggbb')
    expect(broken({ insulation: [150.5] })).toThrow('Insulation')
    expect(broken({ engineering: [{ key: 'heating', requires: ['gas'] }] })).toThrow('gas')
    expect(
      broken({ rules: [{ id: 'r', when: [{ option: 'windows', anyOf: ['panoramic'] }] }] }),
    ).toThrow('two or more')
    expect(
      broken({
        rules: [
          {
            id: 'r',
            when: [
              { option: 'windows', anyOf: ['panoramic'] },
              { option: 'mood', anyOf: ['x'] },
            ],
          },
        ],
      }),
    ).toThrow('unknown option')
  })
})

describe('blueprintIssues', () => {
  const configurator = new Configurator(model)

  it('reports offered footprints that cannot be built', () => {
    const issues = blueprintIssues(configurator, pineBlueprint)
    expect(
      issues.map((issue) => [issue.configuration.footprint.width, issue.configuration.mirrored]),
    ).toEqual([
      [2400, false],
      [2400, true],
    ])
  })

  it('accepts a sound project', () => {
    expect(blueprintIssues(configurator, pineAtticBlueprint)).toEqual([])
  })
})
