import type { ConfiguratorOffer } from '@kedrovnik/configurator'
import { isFacadeFinish, isRoofKindKey, isWindowStyle } from '@kedrovnik/house'

import type { CatalogOption } from '@/cms/generated/payload-types'

import type { ConfiguratorOptions } from '../ports/configurator-options-repository'

/** A stored global, or the data of a save in progress, which may omit untouched fields. */
export type CatalogOptionSource = Partial<CatalogOption>

/** CMS «Configurator options» + offered insulation thicknesses → the configurator's offer. */
export function toConfiguratorOffer(
  document: CatalogOptionSource,
  insulation: readonly number[],
): ConfiguratorOffer {
  return {
    roofs: (document.roofKinds ?? []).filter(isRoofKindKey),
    facades: (document.facadePalettes ?? []).flatMap((palette) =>
      isFacadeFinish(palette.finish)
        ? [
            {
              finish: palette.finish,
              colours: (palette.colors ?? []).map((colour) => colour.hex.toLowerCase()),
            },
          ]
        : [],
    ),
    windowStyles: (document.windowStyles ?? []).filter(isWindowStyle),
    terrace: {
      depths: document.terraceDepths ?? [],
      removable: document.terraceRemovable ?? true,
    },
    insulation,
    engineering: (document.engineeringSystems ?? []).map((system) => ({
      key: system.key,
      requires: system.requires ?? [],
    })),
    rules: (document.rules ?? []).map((rule) => ({
      id: rule.key,
      when: (rule.conditions ?? []).map((condition) => ({
        option: condition.option,
        anyOf: condition.values,
      })),
    })),
  }
}

export function toConfiguratorOptions(
  document: CatalogOptionSource,
  insulation: readonly number[],
): ConfiguratorOptions {
  return {
    offer: toConfiguratorOffer(document, insulation),
    colours: Object.fromEntries(
      (document.facadePalettes ?? []).flatMap((palette) =>
        (palette.colors ?? []).map((colour) => [colour.hex.toLowerCase(), colour.name]),
      ),
    ),
    systems: Object.fromEntries(
      (document.engineeringSystems ?? []).map((system) => [system.key, system.name]),
    ),
    rules: Object.fromEntries((document.rules ?? []).map((rule) => [rule.key, rule.message])),
  }
}
