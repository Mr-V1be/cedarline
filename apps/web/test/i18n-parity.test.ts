import { describe, expect, it } from 'vitest'

import en from '@/i18n/messages/en'
import ru from '@/i18n/messages/ru'

function keys(value: unknown, prefix = ''): string[] {
  if (typeof value !== 'object' || value === null) return [prefix]
  return Object.entries(value).flatMap(([key, child]) =>
    keys(child, prefix ? `${prefix}.${key}` : key),
  )
}

describe('translations', () => {
  it('every Russian message exists in English and vice versa', () => {
    expect(keys(en).sort()).toEqual(keys(ru).sort())
  })

  it('no message is empty', () => {
    const empty = [ru, en].flatMap((catalog) =>
      keys(catalog).filter((path) => {
        const value = path
          .split('.')
          .reduce<unknown>((node, key) => (node as Record<string, unknown>)[key], catalog)
        return typeof value === 'string' && value.trim() === ''
      }),
    )
    expect(empty).toEqual([])
  })
})
