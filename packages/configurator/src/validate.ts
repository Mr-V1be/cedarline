import type { Configurator } from './configurator'
import { initialConfiguration } from './choices'
import type { Configuration } from './configuration'
import { ConfiguratorError } from './errors'
import { footprintsOf } from './footprint'
import type { ConfiguratorOffer, ProjectBlueprint } from './model'
import type { Restriction } from './restrictions'
import { SELECTION_OPTIONS } from './selections'

const HEX_COLOUR = /^#[0-9a-f]{6}$/i

function invalid(message: string, details: Record<string, unknown> = {}): never {
  throw new ConfiguratorError('INVALID_OFFER', message, details)
}

function assertUnique(values: readonly (string | number)[], what: string) {
  const duplicate = values.find((value, index) => values.indexOf(value) !== index)
  if (duplicate !== undefined) invalid(`Duplicate ${what} "${duplicate}"`, { what, duplicate })
}

const isPositiveInteger = (value: number) => Number.isInteger(value) && value > 0

/** Invariants of the offered options; the CMS refuses to save an offer that breaks them. */
export function validateOffer(offer: ConfiguratorOffer): ConfiguratorOffer {
  if (offer.roofs.length === 0) invalid('At least one roof kind must be offered')
  assertUnique(offer.roofs, 'roof kind')
  if (offer.facades.length === 0) invalid('At least one facade finish must be offered')
  assertUnique(
    offer.facades.map((facade) => facade.finish),
    'facade finish',
  )
  for (const facade of offer.facades) {
    if (facade.colours.length === 0)
      invalid('A finish needs at least one colour', { finish: facade.finish })
    const bad = facade.colours.find((colour) => !HEX_COLOUR.test(colour))
    if (bad !== undefined) invalid(`Colour "${bad}" is not #rrggbb`, { colour: bad })
    assertUnique(
      facade.colours.map((colour) => colour.toLowerCase()),
      'colour',
    )
  }
  if (offer.windowStyles.length === 0) invalid('At least one window style must be offered')
  assertUnique(offer.windowStyles, 'window style')
  if (offer.insulation.length === 0 || !offer.insulation.every(isPositiveInteger)) {
    invalid('Insulation thicknesses must be positive whole millimetres')
  }
  assertUnique(offer.insulation, 'insulation thickness')
  if (!offer.terrace.depths.every(isPositiveInteger)) {
    invalid('Terrace depths must be positive whole millimetres')
  }

  const systems = offer.engineering.map((system) => system.key)
  assertUnique(systems, 'engineering system')
  for (const system of offer.engineering) {
    const unknown = system.requires.find((key) => key === system.key || !systems.includes(key))
    if (unknown !== undefined) {
      invalid(`System "${system.key}" requires unknown system "${unknown}"`, {
        system: system.key,
        requires: unknown,
      })
    }
  }

  assertUnique(
    offer.rules.map((rule) => rule.id),
    'rule',
  )
  for (const rule of offer.rules) {
    if (rule.when.length < 2) invalid(`Rule "${rule.id}" must combine two or more conditions`)
    const option = rule.when.find(
      (condition) => !(SELECTION_OPTIONS as readonly string[]).includes(condition.option),
    )
    if (option !== undefined)
      invalid(`Rule "${rule.id}" tests an unknown option`, { option: option.option })
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
