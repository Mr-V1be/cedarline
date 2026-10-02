import type { Payload } from 'payload'

import { DEFER_PROJECT_CHECKS } from '@/cms/hooks/catalog-options-hooks'

import {
  COMPATIBILITY_RULES,
  ENGINEERING_SYSTEMS,
  FACADE_PALETTES,
  OFFERED_ROOFS,
  OFFERED_WINDOWS,
  TERRACE_DEPTHS,
} from '../data/catalog-options'
import { INSULATION_OPTIONS, WALL_LAYERS } from '../data/technology'
import {
  ADVERTISED_ROUNDING,
  COMPLETENESS,
  PHASES,
  RATES,
  SECTIONS,
  STAGES,
  WORKING_DAYS_PER_WEEK,
} from '../data/tariff'
import { englishRows, SEED } from './upsert'

const at = <T>(items: readonly T[], index: number): T => {
  const item = items[index]
  if (item === undefined) throw new Error(`Seed row ${index} is missing`)
  return item
}

export async function seedTechnology(payload: Payload) {
  const saved = await payload.updateGlobal({
    ...SEED,
    slug: 'technology',
    locale: 'ru',
    data: {
      layers: WALL_LAYERS.map((layer) => ({
        key: layer.key,
        name: layer.name.ru,
        role: layer.role,
        thickness: layer.thickness,
        conductivity: layer.conductivity ?? null,
      })),
      insulationOptions: INSULATION_OPTIONS.map((thickness) => ({ thickness })),
    },
  })
  await payload.updateGlobal({
    ...SEED,
    slug: 'technology',
    locale: 'en',
    data: {
      layers: englishRows(saved.layers, (_, index) => ({ name: at(WALL_LAYERS, index).name.en })),
    },
  })
}

export async function seedCatalogOptions(payload: Payload) {
  const saved = await payload.updateGlobal({
    ...SEED,
    slug: 'catalog-options',
    locale: 'ru',
    // Projects are seeded next and each is checked against this offer on its own save.
    context: { [DEFER_PROJECT_CHECKS]: true },
    data: {
      facadePalettes: FACADE_PALETTES.map((palette) => ({
        finish: palette.finish,
        colors: palette.colors.map((color) => ({ name: color.name.ru, hex: color.hex })),
      })),
      roofKinds: [...OFFERED_ROOFS],
      windowStyles: [...OFFERED_WINDOWS],
      terraceDepths: [...TERRACE_DEPTHS],
      terraceRemovable: true,
      engineeringSystems: ENGINEERING_SYSTEMS.map((system) => ({
        key: system.key,
        name: system.name.ru,
        requires: [...system.requires],
      })),
      rules: COMPATIBILITY_RULES.map((rule) => ({
        key: rule.key,
        conditions: rule.when.map((condition) => ({
          option: condition.option,
          values: [...condition.values],
        })),
        message: rule.message.ru,
      })),
    },
  })
  await payload.updateGlobal({
    ...SEED,
    slug: 'catalog-options',
    locale: 'en',
    context: { [DEFER_PROJECT_CHECKS]: true },
    data: {
      facadePalettes: englishRows(saved.facadePalettes, (palette, index) => ({
        colors: englishRows(palette.colors, (_, colorIndex) => ({
          name: at(at(FACADE_PALETTES, index).colors, colorIndex).name.en,
        })),
      })),
      engineeringSystems: englishRows(saved.engineeringSystems, (_, index) => ({
        name: at(ENGINEERING_SYSTEMS, index).name.en,
      })),
      rules: englishRows(saved.rules, (_, index) => ({
        message: at(COMPATIBILITY_RULES, index).message.en,
      })),
    },
  })
}

export async function seedTariff(payload: Payload) {
  const saved = await payload.updateGlobal({
    ...SEED,
    slug: 'tariff',
    locale: 'ru',
    data: {
      workingDaysPerWeek: WORKING_DAYS_PER_WEEK,
      advertisedRounding: { ...ADVERTISED_ROUNDING },
      sections: SECTIONS.map((section) => ({ key: section.key, name: section.name.ru })),
      rates: RATES.map((rate) => ({
        code: rate.code,
        name: rate.name.ru,
        section: rate.section,
        driver: rate.driver,
        unitPrice: rate.unitPrice,
        conditions: (rate.conditions ?? []).map((condition) => ({
          option: condition.option,
          values: [...condition.values],
        })),
      })),
      completeness: COMPLETENESS.map((level) => ({
        key: level.key,
        name: level.name.ru,
        sections: [...level.sections],
      })),
      phases: PHASES.map((phase) => ({ key: phase.key, name: phase.name.ru })),
      stages: STAGES.map((stage) => ({
        key: stage.key,
        name: stage.name.ru,
        phase: stage.phase,
        section: stage.section ?? null,
        driver: stage.driver ?? null,
        baseDays: stage.baseDays,
        daysPerUnit: stage.daysPerUnit,
        dependsOn: [...stage.dependsOn],
      })),
    },
  })
  await payload.updateGlobal({
    ...SEED,
    slug: 'tariff',
    locale: 'en',
    data: {
      sections: englishRows(saved.sections, (_, index) => ({ name: at(SECTIONS, index).name.en })),
      rates: englishRows(saved.rates, (_, index) => ({ name: at(RATES, index).name.en })),
      completeness: englishRows(saved.completeness, (_, index) => ({
        name: at(COMPLETENESS, index).name.en,
      })),
      phases: englishRows(saved.phases, (_, index) => ({ name: at(PHASES, index).name.en })),
      stages: englishRows(saved.stages, (_, index) => ({ name: at(STAGES, index).name.en })),
    },
  })
}
