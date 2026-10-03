'use client'

import { ChatsCircleIcon, CubeIcon, WarningCircleIcon } from '@phosphor-icons/react/ssr'
import { Money } from '@kedrovnik/pricing'
import { useFormatter, useTranslations } from 'next-intl'
import { useState } from 'react'

import { formatRubles } from '@/modules/pricing/ui/money'
import { ButtonLink } from '@/ui/components/button/button'
import { RangeField } from '@/ui/components/range-field/range-field'
import { SegmentedControl } from '@/ui/components/segmented/segmented-control'
import { SelectField } from '@/ui/components/select/select-field'
import { StateMessage } from '@/ui/components/state/state-message'
import { TextField } from '@/ui/components/text-field/text-field'

import type { FinancingTerms } from '../domain/financing-terms'
import { basisPointsToPercent, type KeyRate } from '../domain/key-rate'
import {
  FINANCING_KINDS,
  FINANCING_KIND_KEYS,
  PLANNERS,
  percentOf,
  type FinancingKind,
  type PaymentPlan,
} from '../domain/payment-plan'
import styles from './calculator.module.css'
import { KeyRateNote, type KeyRateView } from './key-rate-note'
import { PlanStructure } from './plan-structure'

export interface PricedProject {
  readonly slug: string
  readonly title: string
  /** «Price from», whole rubles. */
  readonly price: number
}

interface CalculatorProps {
  readonly terms: FinancingTerms
  readonly keyRate: KeyRateView | null
  readonly projects: readonly PricedProject[]
  readonly initial: { readonly project: string; readonly price: number }
}

/** The slider stops here: a larger down payment is paying in cash. */
const MAX_DOWN_PERCENT = 90
const MIN_PRICE = 100_000
const MAX_PRICE = 1_000_000_000
const CUSTOM = ''

type TermState = Readonly<Record<FinancingKind, number>>

const digitsOnly = (text: string) => Number(text.replace(/\D/g, '') || '0')

/**
 * Mortgage and instalment calculator. Everything is computed in the browser with the domain
 * rules, so the payment follows every move of a slider; the key rate comes from the server.
 */
export function Calculator({ terms, keyRate, projects, initial }: CalculatorProps) {
  const t = useTranslations('calculator')
  const format = useFormatter()
  const [kind, setKind] = useState<FinancingKind>(keyRate === null ? 'installment' : 'mortgage')
  const [project, setProject] = useState(initial.project)
  const [priceText, setPriceText] = useState(format.number(initial.price))
  const [down, setDown] = useState<TermState>({
    mortgage: terms.mortgage.defaultDownPercent,
    installment: terms.installment.defaultDownPercent,
  })
  const [term, setTerm] = useState<TermState>({
    mortgage: terms.mortgage.defaultYears,
    installment: terms.installment.defaultMonths,
  })

  const price = digitsOnly(priceText)
  const priceValid = price >= MIN_PRICE && price <= MAX_PRICE
  const limits = {
    mortgage: {
      minDown: terms.mortgage.minDownPercent,
      minTerm: terms.mortgage.minYears,
      maxTerm: terms.mortgage.maxYears,
    },
    installment: {
      minDown: terms.installment.minDownPercent,
      minTerm: 1,
      // Without the key rate only the interest-free part of the plan can be priced.
      maxTerm:
        keyRate === null ? terms.installment.interestFreeMonths : terms.installment.maxMonths,
    },
  }[kind]
  const chosenTerm = Math.min(term[kind], limits.maxTerm)
  const termText = (value: number) => t(`units.${FINANCING_KINDS[kind].termUnit}`, { count: value })
  const percentText = (value: number) => t('units.percent', { value })
  const rateText = (rate: number) => percentText(basisPointsToPercent(rate))

  const effectiveKeyRate: KeyRate =
    keyRate === null
      ? { rate: 0, effectiveFrom: new Date(0) }
      : { rate: keyRate.rate, effectiveFrom: new Date(keyRate.effectiveFrom) }
  const plan: PaymentPlan | null =
    priceValid && (keyRate !== null || kind === 'installment')
      ? PLANNERS[kind](
          {
            price: Money.ofRubles(price),
            downPayment: percentOf(Money.ofRubles(price), down[kind]),
            term: chosenTerm,
          },
          terms,
          effectiveKeyRate,
        )
      : null
  const rubles = (amount: Money) => formatRubles(format, Money.toWholeRubles(amount))
  const rateExplanation = (current: PaymentPlan) => {
    if (current.kind === 'mortgage') {
      return t('result.rateMortgage', {
        key: rateText(effectiveKeyRate.rate),
        margin: rateText(terms.mortgage.margin),
      })
    }
    return current.rate === 0
      ? t('result.rateFree', { months: termText(terms.installment.interestFreeMonths) })
      : t('result.rateInstallment', {
          share: terms.installment.keyRateShare,
          key: rateText(effectiveKeyRate.rate),
        })
  }

  return (
    <div className={styles.layout}>
      <form
        className={styles.form}
        onSubmit={(event) => {
          event.preventDefault()
        }}
      >
        <SegmentedControl
          legend={t('kind.label')}
          name="financing-kind"
          value={kind}
          options={FINANCING_KIND_KEYS.map((key) => ({ value: key, label: t(`kind.${key}`) }))}
          onChange={setKind}
        />
        <SelectField
          label={t('fields.project')}
          value={project}
          options={[
            ...projects.map((item) => ({
              value: item.slug,
              label: `${item.title} · ${formatRubles(format, item.price)}`,
            })),
            { value: CUSTOM, label: t('fields.customProject') },
          ]}
          onChange={(event) => {
            const chosen = projects.find((item) => item.slug === event.target.value)
            setProject(event.target.value)
            if (chosen !== undefined) setPriceText(format.number(chosen.price))
          }}
        />
        <TextField
          label={t('fields.price')}
          inputMode="numeric"
          autoComplete="off"
          value={priceText}
          hint={t('fields.priceHint')}
          error={
            priceValid ? undefined : t('errors.price', { min: formatRubles(format, MIN_PRICE) })
          }
          onChange={(event) => {
            setProject(CUSTOM)
            setPriceText(event.target.value)
          }}
          onBlur={() => {
            if (price > 0) setPriceText(format.number(price))
          }}
        />
        <RangeField
          label={t('fields.down')}
          value={down[kind]}
          min={limits.minDown}
          max={MAX_DOWN_PERCENT}
          valueText={`${percentText(down[kind])} · ${priceValid ? rubles(percentOf(Money.ofRubles(price), down[kind])) : '—'}`}
          minText={percentText(limits.minDown)}
          maxText={percentText(MAX_DOWN_PERCENT)}
          onChange={(value) => {
            setDown((current) => ({ ...current, [kind]: value }))
          }}
        />
        <RangeField
          label={t('fields.term')}
          value={chosenTerm}
          min={limits.minTerm}
          max={limits.maxTerm}
          valueText={termText(chosenTerm)}
          minText={termText(limits.minTerm)}
          maxText={termText(limits.maxTerm)}
          onChange={(value) => {
            setTerm((current) => ({ ...current, [kind]: value }))
          }}
        />
      </form>

      <section className={styles.result} aria-labelledby="calculator-result" aria-live="polite">
        <h2 id="calculator-result" className="visually-hidden">
          {t('result.title')}
        </h2>
        {plan === null ? (
          keyRate === null && kind === 'mortgage' ? (
            <StateMessage
              glyph={WarningCircleIcon}
              title={t('keyRate.missing')}
              description={t('keyRate.missingHint')}
              tone="error"
            />
          ) : (
            <p className={styles.placeholder}>
              {t('errors.price', { min: formatRubles(format, MIN_PRICE) })}
            </p>
          )
        ) : (
          <>
            <p className={styles.monthlyLabel}>
              {plan.rate === 0 ? t('result.monthlyFree') : t('result.monthly')}
            </p>
            <p className={styles.monthly}>{rubles(plan.monthly)}</p>
            <dl className={styles.rows}>
              <div className={styles.row}>
                <dt>{plan.kind === 'mortgage' ? t('result.loan') : t('result.loanInstallment')}</dt>
                <dd>{rubles(plan.loan)}</dd>
              </div>
              <div className={styles.row}>
                <dt>{t('result.rate')}</dt>
                <dd>
                  {rateText(plan.rate)}
                  <span className={styles.rowHint}>{rateExplanation(plan)}</span>
                </dd>
              </div>
              <div className={styles.row}>
                <dt>{t('result.overpayment')}</dt>
                <dd>{rubles(plan.overpayment)}</dd>
              </div>
              <div className={styles.row}>
                <dt>{t('result.total')}</dt>
                <dd>{rubles(plan.total)}</dd>
              </div>
            </dl>
            <PlanStructure
              plan={plan}
              labels={{
                title: t('result.structure'),
                down: t('result.downPart'),
                loan: t('result.loanPart'),
                interest: t('result.interestPart'),
              }}
              format={rubles}
            />
          </>
        )}
        {keyRate === null ? null : <KeyRateNote keyRate={keyRate} />}
        <p className={styles.note}>{t('note')}</p>
        <div className={styles.actions}>
          <ButtonLink
            href={project === CUSTOM ? '/configurator' : `/configurator/${project}`}
            icon={CubeIcon}
          >
            {t('actions.configure')}
          </ButtonLink>
          <ButtonLink href="/contacts" variant="secondary" icon={ChatsCircleIcon}>
            {t('actions.contacts')}
          </ButtonLink>
        </div>
      </section>
    </div>
  )
}
