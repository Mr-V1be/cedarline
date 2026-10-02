import {
  storeyKey,
  type Choice,
  type Configuration,
  type OptionGroup,
  type ProjectBlueprint,
  type Restriction,
} from '@kedrovnik/configurator'
import type { HouseDesign } from '@kedrovnik/house'

import type { ConfiguratorNames } from '../domain/names'

/** A message lookup of one namespace; next-intl's translators fit after a cast at the edge. */
export type Translate = (key: string, values?: Readonly<Record<string, string | number>>) => string

export interface VocabularySources {
  /** Messages of the `configurator` namespace. */
  readonly t: Translate
  /** Messages of the `registry` namespace. */
  readonly registry: Translate
  readonly names: ConfiguratorNames
  /** Designs of the series by project slug: the storey choice is named by its design. */
  readonly designs: Readonly<Record<string, Pick<HouseDesign, 'storeys' | 'attic'>>>
}

/** Designs by slug of a loaded series. */
export const designsOf = (family: readonly ProjectBlueprint[]) =>
  Object.fromEntries(family.map((member) => [member.slug, member.design]))

export interface ConfigurationRow {
  readonly group: OptionGroup
  readonly label: string
  readonly value: string
}

/**
 * Words for groups, choices and restrictions, shared by the configurator page, the saved
 * link, the proposal PDF and the emails, so every place names a choice the same way.
 */
export interface Vocabulary {
  group(group: OptionGroup): string
  value(group: OptionGroup, value: string): string
  rows(configuration: Configuration): readonly ConfigurationRow[]
  explain(restriction: Restriction, choice: Choice): string
  pricedIn(current: string, levels: readonly string[]): string
}

const MM_PER_M = 1000
const GEOMETRY_KEYS = new Set(['OPENING_OUT_OF_WALL', 'OPENINGS_OVERLAP', 'TERRACE_OUT_OF_WALL'])

/** Groups listed in a configuration summary, in reading order. */
const SUMMARY_GROUPS: readonly OptionGroup[] = [
  'project',
  'footprint',
  'layout',
  'roof',
  'facade',
  'colour',
  'windows',
  'terrace',
  'insulation',
  'engineering',
  'completeness',
]

export function createVocabulary({ t, registry, names, designs }: VocabularySources): Vocabulary {
  const storeyOf = (slug: string) => {
    const design = designs[slug]
    return design === undefined ? null : storeyKey(design)
  }
  const systems = (keys: readonly string[]) =>
    keys.map((key) => names.systems[key] ?? key).join(', ')

  const value = (group: OptionGroup, choice: string): string => {
    switch (group) {
      case 'project': {
        const storey = storeyOf(choice)
        return storey === null
          ? (names.projects[choice] ?? choice)
          : registry(`storeyType.${storey}`)
      }
      case 'footprint': {
        const [width = 0, depth = 0] = choice.split('x').map(Number)
        return t('values.footprint', { width: width / MM_PER_M, depth: depth / MM_PER_M })
      }
      case 'layout':
        return t(`values.layout.${choice}`)
      case 'roof':
        return registry(`roofKind.${choice}`)
      case 'facade':
        return registry(`facadeFinish.${choice}`)
      case 'colour':
        return names.colours[choice] ?? choice
      case 'windows':
        return registry(`windowStyle.${choice}`)
      case 'terrace':
        return choice === '0'
          ? t('values.noTerrace')
          : t('values.terrace', { depth: Number(choice) / MM_PER_M })
      case 'insulation':
        return t('values.insulation', { value: Number(choice) })
      case 'engineering':
        return names.systems[choice] ?? choice
      case 'completeness':
        return names.tariff.completeness[choice] ?? choice
    }
  }

  return {
    group: (group) => t(`groups.${group}`),
    value,
    rows: (configuration) =>
      SUMMARY_GROUPS.map((group) => ({
        group,
        label: t(`groups.${group}`),
        value: valueOfConfiguration(configuration, group),
      })),
    explain: (restriction, choice) => {
      switch (restriction.kind) {
        case 'rule':
          return names.rules[restriction.rule] ?? t('restrictions.rule')
        case 'requires':
          return choice.group === 'engineering' && choice.value === restriction.system
            ? t('restrictions.requires', { systems: systems(restriction.missing) })
            : t('restrictions.requiredBy', { systems: systems([restriction.system]) })
        case 'attic-roof':
          return t('restrictions.atticRoof', {
            roof: registry(`roofKind.${restriction.roof}`).toLowerCase(),
          })
        case 'geometry':
          return GEOMETRY_KEYS.has(restriction.code)
            ? t(`restrictions.geometry.${restriction.code}`)
            : t('restrictions.geometry.other')
      }
    },
    pricedIn: (current, levels) =>
      t('restrictions.pricedIn', {
        current: names.tariff.completeness[current] ?? current,
        levels: levels.map((level) => `«${names.tariff.completeness[level] ?? level}»`).join(', '),
      }),
  }

  function valueOfConfiguration(configuration: Configuration, group: OptionGroup): string {
    switch (group) {
      case 'project':
        return value(group, configuration.project)
      case 'footprint':
        return value(group, `${configuration.footprint.width}x${configuration.footprint.depth}`)
      case 'layout':
        return value(group, configuration.mirrored ? 'mirrored' : 'base')
      case 'roof':
        return value(group, configuration.roof)
      case 'facade':
        return value(group, configuration.facade)
      case 'colour':
        return value(group, configuration.colour)
      case 'windows':
        return value(group, configuration.windows)
      case 'terrace':
        return value(group, String(configuration.terrace))
      case 'insulation':
        return value(group, String(configuration.insulation))
      case 'engineering':
        return configuration.engineering.length === 0
          ? t('values.noSystems')
          : systems(configuration.engineering)
      case 'completeness':
        return value(group, configuration.completeness)
    }
  }
}
