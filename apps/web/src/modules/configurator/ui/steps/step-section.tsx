'use client'

import type {
  Choice,
  Configuration,
  ConfigurationState,
  GroupState,
  OptionGroup,
} from '@cedarline/configurator'
import type { Money } from '@cedarline/pricing'
import { useTranslations } from 'next-intl'
import type { ReactNode } from 'react'

import { usePrices } from '@/modules/pricing/ui/prices'
import { ChoiceList, type ChoiceItem } from '@/ui/components/choice-list/choice-list'
import { Switch } from '@/ui/components/switch/switch'

import type { Vocabulary } from '../../application/vocabulary'
import styles from './step-section.module.css'
import type { Step } from './steps'

interface StepSectionProps {
  readonly step: Step
  readonly index: number
  readonly state: ConfigurationState
  readonly configuration: Configuration
  readonly vocabulary: Vocabulary
  readonly projectTitles: Readonly<Record<string, string>>
  readonly active: boolean
  readonly onChoose: (choice: Choice) => void
  /** Extra content of a step: the wall section next to insulation, the estimate in the summary. */
  readonly aside?: ReactNode
  readonly children?: ReactNode
}

/** One step of the configurator: its option groups, each choice with its price and reason. */
export function StepSection({
  step,
  index,
  state,
  configuration,
  vocabulary,
  projectTitles,
  active,
  onChoose,
  aside,
  children,
}: StepSectionProps) {
  const t = useTranslations('configurator')
  const prices = usePrices()
  const groupState = (group: OptionGroup) =>
    state.groups.find((candidate) => candidate.group === group)

  /** What a choice adds or takes, as the visitor reads it; nothing when it rounds to zero. */
  const delta = (amount: Money | null) => {
    if (amount === null) return undefined
    const shown = prices.value(amount, 'delta')
    if (shown === 0) return undefined
    return t('choice.delta', {
      sign: shown > 0 ? '+' : '−',
      amount: prices.formatValue(Math.abs(shown)),
    })
  }

  const renderGroup = (group: OptionGroup, groupData: GroupState) => {
    const reasonOf = (value: string) => {
      const choice = groupData.choices.find((candidate) => candidate.value === value)
      if (choice === undefined || choice.restrictions.length === 0) return undefined
      return choice.restrictions
        .map((restriction) => vocabulary.explain(restriction, { group, value }))
        .join(' ')
    }

    if (group === 'layout') {
      const mirrored = groupData.choices.find((choice) => choice.value === 'mirrored')
      if (mirrored === undefined) return null
      const target = configuration.mirrored ? 'base' : 'mirrored'
      const reason = reasonOf(target)
      return (
        <Switch
          label={vocabulary.value('layout', 'mirrored')}
          checked={configuration.mirrored}
          disabled={reason !== undefined}
          {...(reason === undefined ? {} : { description: reason })}
          onChange={(checked) => {
            onChoose({ group, value: checked ? 'mirrored' : 'base' })
          }}
        />
      )
    }

    const items: ChoiceItem<string>[] = groupData.choices.map((choice) => {
      const reason = reasonOf(choice.value)
      const meta = delta(choice.delta)
      return {
        value: choice.value,
        label: vocabulary.value(group, choice.value),
        ...(group === 'project' ? { description: projectTitles[choice.value] ?? '' } : {}),
        ...(meta === undefined ? {} : { meta }),
        ...(reason === undefined ? {} : { blockedReason: reason }),
        ...(group === 'colour'
          ? {
              leading: <span className={styles.swatch} style={{ backgroundColor: choice.value }} />,
            }
          : {}),
      }
    })
    return (
      <>
        <ChoiceList
          legend={vocabulary.group(group)}
          hideLegend={vocabulary.group(group) === t(`steps.${step.key}`)}
          name={`configurator-${group}`}
          multiple={group === 'engineering'}
          items={items}
          selected={groupData.choices
            .filter((choice) => choice.selected)
            .map((choice) => choice.value)}
          blockedLabel={t('choice.blocked')}
          onToggle={(value) => {
            onChoose({ group, value })
          }}
        />
        {groupData.pricedIn.length > 0 ? (
          <p className={styles.note}>
            {vocabulary.pricedIn(configuration.completeness, groupData.pricedIn)}
          </p>
        ) : null}
      </>
    )
  }

  const titleId = `step-${step.key}`
  return (
    <section
      className={styles.step}
      data-active={active}
      data-step={step.key}
      aria-labelledby={titleId}
    >
      <h2 id={titleId} className={styles.title}>
        <span className={styles.number} aria-hidden>
          {String(index + 1).padStart(2, '0')}
        </span>
        {t(`steps.${step.key}`)}
      </h2>
      <div className={aside === undefined ? styles.body : `${styles.body} ${styles.withAside}`}>
        <div className={styles.groups}>
          {step.groups.map((group) => {
            const data = groupState(group)
            if (data === undefined || data.choices.length === 0) return null
            return (
              <div key={group} className={styles.group}>
                {renderGroup(group, data)}
              </div>
            )
          })}
          {children}
        </div>
        {aside === undefined ? null : <div className={styles.aside}>{aside}</div>}
      </div>
    </section>
  )
}
