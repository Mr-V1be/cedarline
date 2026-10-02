import type { Configurator } from './configurator'
import { initialConfiguration } from './choices'
import type { Configuration } from './configuration'
import { ConfiguratorError } from './errors'
import { footprintsOf } from './footprint'
import type { ConfiguratorOffer, ProjectBlueprint } from './model'
import type { Restriction } from './restrictions'
import { SELECTION_OPTIONS } from './selections'

const HEX_COLOUR = /^#[0-9a-f]{6}$/i

/** The part of the offer an error is about, so an editor can point at the right field. */
export type OfferField = keyof ConfiguratorOffer

function invalid(field: OfferField, message: string, details: Record<string, unknown> = {}): never {
  throw new ConfiguratorError('INVALID_OFFER', message, { ...details, field })
}

function assertUnique(field: OfferField, values: readonly (string | number)[], what: string) {
  const duplicate = values.find((value, index) => values.indexOf(value) !== index)
  if (duplicate !== undefined) invalid(field, `Duplicate ${what} "${duplicate}"`, { duplicate })
}

const isPositiveInteger = (value: number) => Number.isInteger(value) && value > 0

/** Invariants of the offered options; the CMS refuses to save an offer that breaks them. */
export function validateOffer(offer: ConfiguratorOffer): ConfiguratorOffer {
  if (offer.roofs.length === 0) invalid('roofs', 'At least one roof kind must be offered')
  assertUnique('roofs', offer.roofs, 'roof kind')
  if (offer.facades.length === 0) invalid('facades', 'At least one facade finish must be offered')
  assertUnique(
    'facades',
    offer.facades.map((facade) => facade.finish),
    'facade finish',
  )
  for (const facade of offer.facades) {
    if (facade.colours.length === 0)
      invalid('facades', 'A finish needs at least one colour', { finish: facade.finish })
    const bad = facade.colours.find((colour) => !HEX_COLOUR.test(colour))
    if (bad !== undefined) invalid('facades', `Colour "${bad}" is not #rrggbb`, { colour: bad })
    assertUnique(
      'facades',
      facade.colours.map((colour) => colour.toLowerCase()),
      'colour',
    )
  }
  if (offer.windowStyles.length === 0)
    invalid('windowStyles', 'At least one window style must be offered')
  assertUnique('windowStyles', offer.windowStyles, 'window style')
  if (offer.insulation.length === 0 || !offer.insulation.every(isPositiveInteger)) {
    invalid('insulation', 'Insulation thicknesses must be positive whole millimetres')
  }
  assertUnique('insulation', offer.insulation, 'insulation thickness')
  if (!offer.terrace.depths.every(isPositiveInteger)) {
    invalid('terrace', 'Terrace depths must be positive whole millimetres')
  }

  const systems = offer.engineering.map((system) => system.key)
  assertUnique('engineering', systems, 'engineering system')
  for (const system of offer.engineering) {
    const unknown = system.requires.find((key) => key === system.key || !systems.includes(key))
    if (unknown !== undefined) {
      invalid('engineering', `System "${system.key}" requires unknown system "${unknown}"`, {
        system: system.key,
        requires: unknown,
      })
    }
  }

  assertUnique(
    'rules',
    offer.rules.map((rule) => rule.id),
    'rule',
  )
  for (const rule of offer.rules) {
    if (rule.when.length < 2)
      invalid('rules', `Rule "${rule.id}" must combine two or more conditions`)
    const option = rule.when.find(
      (condition) => !(SELECTION_OPTIONS as readonly string[]).includes(condition.option),
    )
    if (option !== undefined) {
      invalid('rules', `Rule "${rule.id}" tests an unknown option`, { option: option.option })
    }
  }
  return offer
}

export interface BlueprintIssue {
  readonly configuration: Configuration
  readonly restrictions: readonly Restriction[]
}

/**
 * Checks that a project opens in a buildable state and that every footprint and plan it
 * offers can be built with its default options. Returns the failing configurations.
 */
export function blueprintIssues(
  configurator: Configurator,
  blueprint: ProjectBlueprint,
): readonly BlueprintIssue[] {
  const initial = initialConfiguration(configurator.model, blueprint.slug)
  const layouts = blueprint.mirrorable ? [false, true] : [false]
  const candidates = footprintsOf(blueprint).flatMap((footprint) =>
    layouts.map((mirrored): Configuration => ({ ...initial, footprint, mirrored })),
  )
  return candidates.flatMap((configuration) => {
    const restrictions = configurator.restrictionsOf(configuration)
    return restrictions.length === 0 ? [] : [{ configuration, restrictions }]
  })
}
