import { isFacadeFinish, isRoofKindKey, isWindowStyle } from '@cedarline/house'

import { OPTION_GROUPS, type Choice, type Configuration, type OptionGroup } from './configuration'
import { ConfiguratorError } from './errors'
import { footprintKey, footprintOf, footprintsOf, sameFootprint } from './footprint'
import type { ConfiguratorModel, ProjectBlueprint } from './model'

export function blueprintOf(model: ConfiguratorModel, slug: string): ProjectBlueprint {
  const blueprint = model.family.find((member) => member.slug === slug)
  if (blueprint === undefined) {
    throw new ConfiguratorError('UNKNOWN_PROJECT', `Project "${slug}" is not in the family`, {
      slug,
    })
  }
  return blueprint
}

/** The offered list with the project's own default kept in it, so defaults stay reachable. */
function withDefault<T>(offered: readonly T[], fallback: T): readonly T[] {
  return offered.includes(fallback) ? offered : [fallback, ...offered]
}

/** Terrace depths the project offers; empty when the design has no terrace at all. */
export function terraceDepthsOf(model: ConfiguratorModel, blueprint: ProjectBlueprint) {
  const own = blueprint.design.terrace?.depth
  if (own === undefined) return []
  const depths = [...new Set([own, ...model.offer.terrace.depths])]
    .filter((depth) => depth > 0)
    .sort((left, right) => left - right)
  return model.offer.terrace.removable ? [0, ...depths] : depths
}

const LAYOUTS = ['base', 'mirrored'] as const

/** Values a group offers for this configuration, as choice strings, in display order. */
export function choicesOf(
  model: ConfiguratorModel,
  configuration: Configuration,
  group: OptionGroup,
): readonly string[] {
  const blueprint = blueprintOf(model, configuration.project)
  const { offer } = model
  const { options } = blueprint.defaults
  switch (group) {
    case 'project':
      return model.family.map((member) => member.slug)
    case 'footprint':
      return footprintsOf(blueprint).map(footprintKey)
    case 'layout':
      return blueprint.mirrorable ? LAYOUTS : ['base']
    case 'roof':
      return withDefault(offer.roofs, options.roofKind)
    case 'facade':
      return withDefault(
        offer.facades.map((facade) => facade.finish),
        options.facadeFinish,
      )
    case 'colour': {
      const palette =
        offer.facades.find((facade) => facade.finish === configuration.facade)?.colours ?? []
      const colours = palette.map((colour) => colour.toLowerCase())
      return configuration.facade === options.facadeFinish
        ? withDefault(colours, options.facadeColor.toLowerCase())
        : colours
    }
    case 'windows':
      return withDefault(offer.windowStyles, options.windowStyle)
    case 'terrace':
      return terraceDepthsOf(model, blueprint).map(String)
    case 'insulation':
      return withDefault(offer.insulation, options.insulation).map(String)
    case 'engineering':
      return offer.engineering.map((system) => system.key)
    case 'completeness':
      return model.grid.completeness.map((level) => level.key)
  }
}

/** Whether the choice is part of the configuration (for engineering: the system is selected). */
export function isChosen(configuration: Configuration, choice: Choice): boolean {
  switch (choice.group) {
    case 'project':
      return configuration.project === choice.value
    case 'footprint':
      return footprintKey(configuration.footprint) === choice.value
    case 'layout':
      return (configuration.mirrored ? 'mirrored' : 'base') === choice.value
    case 'roof':
      return configuration.roof === choice.value
    case 'facade':
      return configuration.facade === choice.value
    case 'colour':
      return configuration.colour === choice.value
    case 'windows':
      return configuration.windows === choice.value
    case 'terrace':
      return String(configuration.terrace) === choice.value
    case 'insulation':
      return String(configuration.insulation) === choice.value
    case 'engineering':
      return configuration.engineering.includes(choice.value)
    case 'completeness':
      return configuration.completeness === choice.value
  }
}

/** The configuration a project opens with: its catalog defaults and the first completeness. */
export function initialConfiguration(model: ConfiguratorModel, slug?: string): Configuration {
  const blueprint = slug === undefined ? model.family[0] : blueprintOf(model, slug)
  const completeness = model.grid.completeness[0]
  if (blueprint === undefined || completeness === undefined) {
    throw new ConfiguratorError('INVALID_OFFER', 'The family or the tariff grid is empty')
  }
  const { options, engineering } = blueprint.defaults
  const offered = new Set(model.offer.engineering.map((system) => system.key))
  return {
    project: blueprint.slug,
    footprint: footprintOf(blueprint.design),
    mirrored: false,
    roof: options.roofKind,
    facade: options.facadeFinish,
    colour: options.facadeColor.toLowerCase(),
    windows: options.windowStyle,
    terrace: blueprint.design.terrace?.depth ?? 0,
    insulation: options.insulation,
    engineering: engineering.filter((key) => offered.has(key)),
    completeness: completeness.key,
  }
}

function switchProject(
  model: ConfiguratorModel,
  configuration: Configuration,
  slug: string,
): Configuration {
  const target = blueprintOf(model, slug)
  const next = { ...configuration, project: slug }
  const keep = (group: OptionGroup, value: string) => choicesOf(model, next, group).includes(value)
  const depths = terraceDepthsOf(model, target)
  return {
    ...next,
    footprint: footprintsOf(target).some((size) => sameFootprint(size, configuration.footprint))
      ? configuration.footprint
      : footprintOf(target.design),
    mirrored: configuration.mirrored && target.mirrorable,
    roof: keep('roof', configuration.roof) ? configuration.roof : target.defaults.options.roofKind,
    terrace: depths.includes(configuration.terrace)
      ? configuration.terrace
      : (target.design.terrace?.depth ?? 0),
    insulation: keep('insulation', String(configuration.insulation))
      ? configuration.insulation
      : target.defaults.options.insulation,
  }
}

function parseFootprint(value: string) {
  const [width = Number.NaN, depth = Number.NaN] = value.split('x').map(Number)
  return { width, depth }
}

/**
 * Applies one choice. Values outside the offer are rejected; dependent values follow (a new
 * finish brings its first colour, another storey variant keeps what it can). Compatibility is
 * not checked here: that is the configurator's job.
 */
export function applyChoice(
  model: ConfiguratorModel,
  configuration: Configuration,
  choice: Choice,
): Configuration {
  if (!choicesOf(model, configuration, choice.group).includes(choice.value)) {
    throw new ConfiguratorError('UNKNOWN_CHOICE', `"${choice.value}" is not offered`, {
      group: choice.group,
      value: choice.value,
    })
  }
  const { value } = choice
  switch (choice.group) {
    case 'project':
      return switchProject(model, configuration, value)
    case 'footprint':
      return { ...configuration, footprint: parseFootprint(value) }
    case 'layout':
      return { ...configuration, mirrored: value === 'mirrored' }
    case 'roof':
      return isRoofKindKey(value) ? { ...configuration, roof: value } : configuration
    case 'facade': {
      if (!isFacadeFinish(value)) return configuration
      const next = { ...configuration, facade: value }
      const colours = choicesOf(model, next, 'colour')
      const colour = colours.includes(configuration.colour) ? configuration.colour : colours[0]
      return { ...next, colour: colour ?? configuration.colour }
    }
    case 'colour':
      return { ...configuration, colour: value }
    case 'windows':
      return isWindowStyle(value) ? { ...configuration, windows: value } : configuration
    case 'terrace':
      return { ...configuration, terrace: Number(value) }
    case 'insulation':
      return { ...configuration, insulation: Number(value) }
    case 'engineering': {
      const selected = new Set(configuration.engineering)
      if (selected.has(value)) selected.delete(value)
      else selected.add(value)
      const order = choicesOf(model, configuration, 'engineering')
      return { ...configuration, engineering: order.filter((key) => selected.has(key)) }
    }
    case 'completeness':
      return { ...configuration, completeness: value }
  }
}

/** Groups whose value is not among the offered choices: such a configuration is stale. */
export function unofferedGroups(
  model: ConfiguratorModel,
  configuration: Configuration,
): readonly OptionGroup[] {
  if (!model.family.some((member) => member.slug === configuration.project)) return ['project']
  return OPTION_GROUPS.filter((group) => {
    const offered = choicesOf(model, configuration, group)
    if (group === 'engineering') {
      return configuration.engineering.some((system) => !offered.includes(system))
    }
    return !offered.some((value) => isChosen(configuration, { group, value }))
  })
}
