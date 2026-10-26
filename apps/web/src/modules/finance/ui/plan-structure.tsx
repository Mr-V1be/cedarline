import type { Money } from '@cedarline/pricing'
import type { CSSProperties } from 'react'

import type { PaymentPlan } from '../domain/payment-plan'
import styles from './calculator.module.css'

interface PlanStructureProps {
  readonly plan: PaymentPlan
  readonly labels: {
    readonly title: string
    readonly down: string
    readonly loan: string
    readonly interest: string
  }
  readonly format: (amount: Money) => string
}

/** One bar for the whole sum: the down payment, the loan and the interest in proportion. */
export function PlanStructure({ plan, labels, format }: PlanStructureProps) {
  const parts = [
    { key: 'down', label: labels.down, amount: plan.downPayment, tone: styles.partDown },
    { key: 'loan', label: labels.loan, amount: plan.loan, tone: styles.partLoan },
    {
      key: 'interest',
      label: labels.interest,
      amount: plan.overpayment,
      tone: styles.partInterest,
    },
  ].filter((part) => part.amount > 0)
  return (
    <figure className={styles.structure}>
      <figcaption className={styles.structureTitle}>{labels.title}</figcaption>
      <div className={styles.bar} aria-hidden>
        {parts.map((part) => (
          <span
            key={part.key}
            className={part.tone}
            style={{ '--share': plan.total === 0 ? 0 : part.amount / plan.total } as CSSProperties}
          />
        ))}
      </div>
      <ul className={styles.legend}>
        {parts.map((part) => (
          <li key={part.key}>
            <span className={`${styles.swatch} ${part.tone ?? ''}`} aria-hidden />
            {part.label}
            <span className={styles.legendValue}>{format(part.amount)}</span>
          </li>
        ))}
      </ul>
    </figure>
  )
}
