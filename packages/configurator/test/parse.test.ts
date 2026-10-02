import { describe, expect, it } from 'vitest'

import {
  SHARE_CODE_LENGTH,
  initialConfiguration,
  isShareCode,
  parseConfiguration,
  shareCodeFrom,
} from '../src'
import { model } from './fixtures'

const initial = initialConfiguration(model)

describe('parseConfiguration', () => {
  it('round-trips through JSON', () => {
    expect(parseConfiguration(JSON.parse(JSON.stringify(initial)))).toEqual(initial)
  })

  it.each([
    ['colour', { colour: 'red' }],
    ['terrace', { terrace: -1 }],
    ['roof', { roof: 'thatch' }],
    ['footprint.width', { footprint: { width: 1e9, depth: 6000 } }],
    ['engineering', { engineering: ['ok', 42] }],
    ['project', { project: '../etc' }],
    ['mirrored', { mirrored: 'yes' }],
  ])('rejects a bad %s', (field, patch) => {
    expect(() => parseConfiguration({ ...initial, ...patch })).toThrow(field)
  })

  it('drops duplicate systems', () => {
    const parsed = parseConfiguration({ ...initial, engineering: ['water', 'water'] })
    expect(parsed.engineering).toEqual(['water'])
  })
})

describe('share codes', () => {
  it('maps random bytes to the alphabet without bias', () => {
    const bytes = [255, 248, 0, 1, 30, 31, 247, ...Array.from({ length: 20 }, (_, i) => i)]
    let index = 0
    const code = shareCodeFrom(() => bytes[index++] ?? 0)
    expect(code).toHaveLength(SHARE_CODE_LENGTH)
    // 255 and 248 are discarded, 31 wraps to the first symbol, 247 to the last one.
    expect(code.slice(0, 5)).toBe('23z2z')
    expect(isShareCode(code)).toBe(true)
  })

  it('recognises only well-formed codes', () => {
    expect(isShareCode('23456789abcd')).toBe(true)
    expect(isShareCode('23456789abc0')).toBe(false)
    expect(isShareCode('short')).toBe(false)
  })
})
