import { describe, expect, it } from 'vitest'

import { createVocabulary, type Translate } from '@/modules/configurator/application/vocabulary'

import { SEED_NAMES } from '../support/seed-model'

/** Translators that echo the key and its values, so the test sees what was asked for. */
const echo: Translate = (key, values) =>
  values === undefined ? key : `${key}${JSON.stringify(values)}`

const vocabulary = createVocabulary({
  t: echo,
  registry: echo,
  names: { ...SEED_NAMES, projects: { kedr: 'Кедр' } },
  designs: { kedr: { storeys: 2, attic: false } },
})

describe('configurator vocabulary', () => {
  it('names choices from registries, data and formats', () => {
    expect(vocabulary.value('project', 'kedr')).toBe('storeyType.2')
    expect(vocabulary.value('footprint', '9000x6000')).toBe('values.footprint{"width":9,"depth":6}')
    expect(vocabulary.value('terrace', '0')).toBe('values.noTerrace')
    expect(vocabulary.value('colour', '#3a3e3c')).toBe('Графит')
    expect(vocabulary.value('completeness', 'turnkey')).toBe('Под ключ')
  })

  it('explains each kind of restriction', () => {
    expect(
      vocabulary.explain(
        { kind: 'rule', rule: 'panoramic-needs-200' },
        { group: 'windows', value: 'panoramic' },
      ),
    ).toMatch(/^Панорамное остекление/)
    expect(
      vocabulary.explain(
        { kind: 'requires', system: 'heating', missing: ['electrics'] },
        { group: 'engineering', value: 'heating' },
      ),
    ).toBe('restrictions.requires{"systems":"Электрика"}')
    expect(
      vocabulary.explain(
        { kind: 'requires', system: 'heating', missing: ['electrics'] },
        { group: 'engineering', value: 'electrics' },
      ),
    ).toBe('restrictions.requiredBy{"systems":"Отопление"}')
    expect(
      vocabulary.explain(
        { kind: 'geometry', code: 'DUPLICATE_ID' },
        { group: 'footprint', value: 'x' },
      ),
    ).toBe('restrictions.geometry.other')
  })
})
