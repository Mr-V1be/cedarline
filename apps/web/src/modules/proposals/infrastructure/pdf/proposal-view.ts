import { QUANTITY_DRIVERS, isQuantityDriver } from '@cedarline/house'
import { createTranslator } from 'next-intl'

import { LOCALE_DEFINITIONS } from '@/i18n/locales'
import { loadMessages } from '@/i18n/messages'
import {
  createVocabulary,
  type ConfigurationRow,
  type Translate,
} from '@/modules/configurator/application/vocabulary'
import { createPriceFormatter } from '@/modules/pricing/application/price-formatter'
import { BRAND_NAME } from '@/ui/brand/brand'

import type { ProposalInput } from '../../ports/proposal-renderer'

export interface ProposalLine {
  readonly name: string
  readonly quantity: string
  readonly price: string
  readonly amount: string
}

export interface ProposalSection {
  readonly name: string
  readonly subtotal: string
  readonly lines: readonly ProposalLine[]
}

export interface GanttRow {
  readonly name: string
  /** Share of the whole schedule, 0…1. */
  readonly from: number
  readonly to: number
  readonly phase: string
}

/** The proposal as words and numbers ready to print, in one language. */
export interface ProposalView {
  readonly locale: string
  readonly brand: string
  readonly title: string
  readonly number: string
  readonly date: string
  readonly heading: string
  readonly subheading: string
  readonly render: Buffer | null
  readonly noRender: string
  readonly facts: ReadonlyArray<{
    readonly label: string
    readonly value: string
    readonly large?: boolean
  }>
  readonly configurationTitle: string
  readonly configuration: readonly (ConfigurationRow & { readonly swatch?: string })[]
  readonly estimateTitle: string
  readonly columns: {
    readonly item: string
    readonly quantity: string
    readonly price: string
    readonly amount: string
  }
  readonly sections: readonly ProposalSection[]
  readonly totalLabel: string
  readonly total: string
  readonly scheduleTitle: string
  readonly phases: readonly { readonly key: string; readonly label: string }[]
  readonly gantt: readonly GanttRow[]
  readonly weeksLabel: string
  readonly totalWeeks: number
  readonly link: string
  readonly linkTitle: string
  readonly linkNote: string
  readonly terms: string
  readonly footer: { readonly company: string; readonly demo: string }
  readonly pageLabel: (page: number, total: number) => string
}

/** Builds the printable proposal from the snapshot: every figure is the saved one. */
export async function buildProposalView(input: ProposalInput): Promise<ProposalView> {
  const { snapshot, names, locale } = input
  const messages = await loadMessages(locale)
  const t = createTranslator({ locale, messages, namespace: 'proposal' })
  const common = createTranslator({ locale, messages, namespace: 'common' })
  const registry = createTranslator({ locale, messages, namespace: 'registry' })
  const configurator = createTranslator({ locale, messages, namespace: 'configurator' })
  const vocabulary = createVocabulary({
    t: configurator as unknown as Translate,
    registry: registry as unknown as Translate,
    names,
    designs: { [snapshot.configuration.project]: snapshot.house.design },
  })

  const { tag } = LOCALE_DEFINITIONS[locale]
  const numbers = new Intl.NumberFormat(tag, { maximumFractionDigits: 2 })
  const prices = createPriceFormatter(input.prices)
  const day = (iso: string) =>
    new Intl.DateTimeFormat(tag, { dateStyle: 'long' }).format(new Date(iso))
  const date = day(snapshot.savedAt)
  const { rate } = input.prices
  const unitOf = (driver: string) =>
    isQuantityDriver(driver) ? registry(`quantityUnit.${QUANTITY_DRIVERS[driver].unit}`) : ''

  const { estimate, schedule, metrics, configuration } = snapshot
  const completeness = names.tariff.completeness[estimate.completeness] ?? estimate.completeness
  const projectTitle = names.projects[configuration.project] ?? configuration.project
  const weeks = (count: number) => common('units.weeks', { count })
  const span = Math.max(1, schedule.totalDays)

  return {
    locale,
    brand: BRAND_NAME,
    title: t('title'),
    number: t('number', { code: input.code }),
    date: t('date', { date }),
    heading: t('project', { name: projectTitle }),
    subheading: [
      vocabulary.value('project', configuration.project),
      common('units.area', { value: metrics.totalArea }),
      vocabulary.value(
        'footprint',
        `${configuration.footprint.width}x${configuration.footprint.depth}`,
      ),
    ].join(' · '),
    render: input.render,
    noRender: t('noRender'),
    facts: [
      { label: t('facts.total'), value: prices.format(estimate.total, 'exact'), large: true },
      { label: t('facts.completeness'), value: completeness },
      { label: t('facts.term'), value: weeks(schedule.totalWeeks) },
      { label: t('facts.area'), value: common('units.area', { value: metrics.totalArea }) },
    ],
    configurationTitle: t('configuration'),
    configuration: vocabulary
      .rows(configuration)
      .map((row) => (row.group === 'colour' ? { ...row, swatch: configuration.colour } : row)),
    estimateTitle: t('estimate'),
    columns: {
      item: t('columns.item'),
      quantity: t('columns.quantity'),
      price: t('columns.price'),
      amount: t('columns.amount'),
    },
    sections: estimate.sections.map((section) => ({
      name: names.tariff.sections[section.key] ?? section.key,
      subtotal: prices.format(section.subtotal, 'exact'),
      lines: section.lines.map((line) => ({
        name: names.tariff.rates[line.code] ?? line.code,
        quantity: `${numbers.format(line.quantity)} ${unitOf(line.driver)}`.trim(),
        price: prices.format(line.unitPrice, 'unitPrice'),
        amount: prices.format(line.amount, 'exact'),
      })),
    })),
    totalLabel: t('total'),
    total: prices.format(estimate.total, 'exact'),
    scheduleTitle: t('schedule'),
    phases: schedule.phases.map((phase) => ({
      key: phase.key,
      label: t('phase', {
        name: names.tariff.phases[phase.key] ?? phase.key,
        weeks: weeks(Math.ceil(phase.durationDays / schedule.workingDaysPerWeek)),
      }),
    })),
    gantt: schedule.stages.map((stage) => ({
      name: names.tariff.stages[stage.key] ?? stage.key,
      from: stage.startDay / span,
      to: stage.endDay / span,
      phase: stage.phase,
    })),
    weeksLabel: t('weeks'),
    totalWeeks: schedule.totalWeeks,
    link: input.link,
    linkTitle: t('link'),
    linkNote: t('linkNote'),
    terms: [
      t('terms', { date, revision: snapshot.tariffRevision }),
      ...(rate === null ? [] : [common('prices.converted', { date: day(rate.setOn) })]),
    ].join(' '),
    footer: {
      company: [BRAND_NAME, input.company.phone, input.company.email].join(' · '),
      demo: common('footer.demo'),
    },
    pageLabel: (page, total) => t('page', { page, total }),
  }
}
