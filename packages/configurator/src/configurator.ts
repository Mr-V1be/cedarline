import { HouseError, measureHouse, type HouseInput, type MeasuredHouse } from '@kedrovnik/house'
import { Money, quote, type Quote } from '@kedrovnik/pricing'

import { applyChoice, blueprintOf, choicesOf, isChosen } from './choices'
import {
  GEOMETRY_GROUPS,
  OPTION_GROUPS,
  type Choice,
  type Configuration,
  type OptionGroup,
} from './configuration'
import { ConfiguratorError } from './errors'
import { houseInputOf } from './house-input'
import type { ConfiguratorModel } from './model'
import { completenessCovering } from './pricing-scope'
import { compatibilityRestrictions, introducedBy, type Restriction } from './restrictions'
import { selectionsOf } from './selections'

export interface ChoiceState {
  readonly value: string
  readonly selected: boolean
  /** Why the choice is blocked; empty when it can be made. */
  readonly restrictions: readonly Restriction[]
  /** Change of the total if the choice is made; null when blocked or already chosen. */
  readonly delta: Money | null
}

export interface GroupState {
  readonly group: OptionGroup
  readonly choices: readonly ChoiceState[]
  /**
   * Completeness levels in which this group affects the price, when the selected one does not
   * (инженерия не входит в «Тёплый контур»). Empty when the group is priced or never priced.
   */
  readonly pricedIn: readonly string[]
}

export interface ConfigurationState {
  readonly configuration: Configuration
  readonly house: HouseInput
  readonly measured: MeasuredHouse
  readonly quote: Quote
  readonly groups: readonly GroupState[]
}

/** Measuring depends only on the geometry, so finishes and colours share one measurement. */
type Measurement =
  | { readonly ok: true; readonly measured: MeasuredHouse }
  | { readonly ok: false; readonly restriction: Restriction }

/** Measured houses kept per geometry; a session rarely visits more than a few dozen. */
const MEASURE_CACHE_SIZE = 96

const geometryKey = (configuration: Configuration): string =>
  [
    configuration.project,
    configuration.footprint.width,
    configuration.footprint.depth,
    configuration.mirrored,
    configuration.roof,
    configuration.windows,
    configuration.terrace,
    configuration.insulation,
  ].join('|')

/**
 * The configurator: answers what a configuration costs, which choices are possible from it,
 * why the others are not, and how each possible choice would change the total. Pure and
 * synchronous, so the interface can recompute it on every click.
 */
export class Configurator {
  private readonly measurements = new Map<string, Measurement>()

  constructor(readonly model: ConfiguratorModel) {}

  /** Every restriction of the configuration, including the ones found by building the house. */
  restrictionsOf(configuration: Configuration): readonly Restriction[] {
    const compatibility = compatibilityRestrictions(this.model, configuration)
    // A roof that cannot cover the attic would also fail to build; one explanation is enough.
    if (compatibility.some((restriction) => restriction.kind === 'attic-roof')) return compatibility
    const measurement = this.measure(configuration)
    return measurement.ok ? compatibility : [...compatibility, measurement.restriction]
  }

  /**
   * Full state of a buildable configuration; throws when the house cannot be built. Choice
   * states are worked out for `groups` only (all by default): an interface showing one step
   * at a time asks for that step's groups and stays instant on a phone.
   */
  evaluate(
    configuration: Configuration,
    groups: readonly OptionGroup[] = OPTION_GROUPS,
  ): ConfigurationState {
    const measurement = this.measure(configuration)
    if (!measurement.ok) {
      throw new ConfiguratorError('INVALID_CONFIGURATION', 'The house cannot be built', {
        restriction: measurement.restriction,
      })
    }
    const current = compatibilityRestrictions(this.model, configuration)
    const currentQuote = this.quoteOf(configuration, measurement.measured)
    return {
      configuration,
      // Built per configuration: the cached measurement is shared by every finish and colour.
      house: houseInputOf(this.model, configuration),
      measured: measurement.measured,
      quote: currentQuote,
      groups: groups.map((group) =>
        this.groupState(group, configuration, current, measurement.measured, currentQuote),
      ),
    }
  }

  /** Applies a choice, refusing it when it would make the configuration impossible. */
  apply(configuration: Configuration, choice: Choice): Configuration {
    const next = applyChoice(this.model, configuration, choice)
    const introduced = introducedBy(this.restrictionsOf(next), this.restrictionsOf(configuration))
    if (introduced.length > 0) {
      throw new ConfiguratorError('RESTRICTED_CHOICE', 'The choice is not compatible', {
        choice,
        restrictions: introduced,
      })
    }
    return next
  }

  quote(configuration: Configuration): Quote {
    const measurement = this.measure(configuration)
    if (!measurement.ok) {
      throw new ConfiguratorError('INVALID_CONFIGURATION', 'The house cannot be built', {
        restriction: measurement.restriction,
      })
    }
    return this.quoteOf(configuration, measurement.measured)
  }

  private quoteOf(configuration: Configuration, measured: MeasuredHouse): Quote {
    const { design } = blueprintOf(this.model, configuration.project)
    return quote(this.model.grid, {
      quantities: measured.takeoff,
      selections: selectionsOf(configuration, design),
      completeness: configuration.completeness,
    })
  }

  private groupState(
    group: OptionGroup,
    configuration: Configuration,
    current: readonly Restriction[],
    measured: MeasuredHouse,
    currentQuote: Quote,
  ): GroupState {
    const choices = choicesOf(this.model, configuration, group).map((value): ChoiceState => {
      const choice = { group, value }
      const selected = isChosen(configuration, choice)
      // Choosing the selected single value changes nothing; a selected system can be removed.
      if (selected && group !== 'engineering') {
        return { value, selected, restrictions: [], delta: null }
      }
      const candidate = applyChoice(this.model, configuration, choice)
      const compatibility = compatibilityRestrictions(this.model, candidate)
      let restrictions = introducedBy(compatibility, current)
      let candidateMeasured = measured
      if (GEOMETRY_GROUPS.has(group) && !restrictions.some((item) => item.kind === 'attic-roof')) {
        const measurement = this.measure(candidate)
        if (measurement.ok) candidateMeasured = measurement.measured
        else restrictions = [...restrictions, measurement.restriction]
      }
      if (restrictions.length > 0) return { value, selected, restrictions, delta: null }
      const total = this.quoteOf(candidate, candidateMeasured).estimate.total
      return {
        value,
        selected,
        restrictions,
        delta: Money.subtract(total, currentQuote.estimate.total),
      }
    })
    return {
      group,
      choices,
      pricedIn: completenessCovering(this.model.grid, group, configuration.completeness),
    }
  }

  private measure(configuration: Configuration): Measurement {
    const key = geometryKey(configuration)
    const cached = this.measurements.get(key)
    if (cached !== undefined) return cached
    let measurement: Measurement
    try {
      measurement = { ok: true, measured: measureHouse(houseInputOf(this.model, configuration)) }
    } catch (error) {
      if (!(error instanceof HouseError)) throw error
      measurement = { ok: false, restriction: { kind: 'geometry', code: error.code } }
    }
    if (this.measurements.size >= MEASURE_CACHE_SIZE) {
      const oldest = this.measurements.keys().next().value
      if (oldest !== undefined) this.measurements.delete(oldest)
    }
    this.measurements.set(key, measurement)
    return measurement
  }
}
