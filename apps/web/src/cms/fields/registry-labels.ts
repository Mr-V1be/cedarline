import enRegistry from '@/i18n/messages/en/registry.json'
import ruRegistry from '@/i18n/messages/ru/registry.json'

import type { Labels } from './labels'

type Registry = typeof ruRegistry
type Group = keyof Registry

/**
 * Admin labels of registry values come from the site's message catalog, so a registry value
 * is named in one place for both the site and the CMS.
 */
export function registryLabel<G extends Group>(group: G, key: keyof Registry[G] & string): Labels {
  const ru = (ruRegistry[group] as Record<string, string>)[key]
  const en = (enRegistry[group] as Record<string, string>)[key]
  if (ru === undefined || en === undefined)
    throw new Error(`Missing registry label ${group}.${key}`)
  return { ru, en }
}

export const registryOptions = <G extends Group>(
  group: G,
  keys: ReadonlyArray<keyof Registry[G] & string>,
) => keys.map((key) => ({ value: key, label: registryLabel(group, key) }))
