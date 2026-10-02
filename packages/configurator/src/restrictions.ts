import { ROOF_KINDS, type HouseErrorCode, type RoofKindKey } from '@kedrovnik/house'
import { allConditionsHold } from '@kedrovnik/pricing'

import { blueprintOf } from './choices'
import type { Configuration } from './configuration'
import type { ConfiguratorModel } from './model'
import { selectionsOf } from './selections'

/**
 * Why a configuration cannot be built. The interface explains each kind in words; a catalog
 * rule carries its own explanation, written by the content manager.
 */
export type Restriction =
  | { readonly kind: 'rule'; readonly rule: string }
  | { readonly kind: 'requires'; readonly system: string; readonly missing: readonly string[] }
  | { readonly kind: 'attic-roof'; readonly roof: RoofKindKey }
  | { readonly kind: 'geometry'; readonly code: HouseErrorCode }

export function restrictionKey(restriction: Restriction): string {
  switch (restriction.kind) {
    case 'rule':
      return `rule:${restriction.rule}`
    case 'requires':
      return `requires:${restriction.system}:${restriction.missing.join(',')}`
    case 'attic-roof':
      return `attic-roof:${restriction.roof}`
    case 'geometry':
      return `geometry:${restriction.code}`
  }
}

/** Restrictions that follow from data and roof physics, without building the house. */
export function compatibilityRestrictions(
  model: ConfiguratorModel,
  configuration: Configuration,
): readonly Restriction[] {
  const { design } = blueprintOf(model, configuration.project)
  const selections = selectionsOf(configuration, design)
  const restrictions: Restriction[] = []

  if (design.attic && !ROOF_KINDS[configuration.roof].supportsAttic) {
    restrictions.push({ kind: 'attic-roof', roof: configuration.roof })
  }

  const selected = new Set(configuration.engineering)
  for (const system of model.offer.engineering) {
    if (!selected.has(system.key)) continue
    const missing = system.requires.filter((key) => !selected.has(key))
    if (missing.length > 0) restrictions.push({ kind: 'requires', system: system.key, missing })
  }

  for (const rule of model.offer.rules) {
    if (rule.when.length > 0 && allConditionsHold(rule.when, selections)) {
      restrictions.push({ kind: 'rule', rule: rule.id })
    }
  }
  return restrictions
}

/** Restrictions of `candidate` that `current` does not already have: what a change would break. */
export function introducedBy(
  candidate: readonly Restriction[],
  current: readonly Restriction[],
): readonly Restriction[] {
  const known = new Set(current.map(restrictionKey))
  return candidate.filter((restriction) => !known.has(restrictionKey(restriction)))
}
