'use client'

import type { FloorPlan } from '@kedrovnik/house'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

import { SegmentedControl } from '@/ui/components/segmented/segmented-control'
import { SelectField } from '@/ui/components/select/select-field'

import { FloorPlanDrawing } from './floor-plan-drawing'
import styles from './floor-plan.module.css'

interface FloorPlansProps {
  readonly plans: readonly FloorPlan[]
  readonly roomNames: Readonly<Record<string, string>>
}

/** Most houses have up to three levels: a segmented switch; more would get a dropdown. */
const MAX_SEGMENTS = 3

export function FloorPlans({ plans, roomNames }: FloorPlansProps) {
  const t = useTranslations('project.plan')
  const units = useTranslations('common.units')
  const [level, setLevel] = useState(0)
  const plan = plans[level] ?? plans[0]
  if (plan === undefined) return null
  const nameOf = (candidate: FloorPlan) =>
    candidate.attic ? t('attic') : t('level', { level: String(candidate.level) })
  const options = plans.map((candidate, index) => ({
    value: String(index),
    label: nameOf(candidate),
  }))
  const area = (value: number) => units('area', { value })

  return (
    <div className={styles.layout}>
      <figure className={styles.sheet}>
        {plans.length > 1 ? (
          <div className={styles.switch}>
            {plans.length <= MAX_SEGMENTS ? (
              <SegmentedControl
                legend={t('levels')}
                name="plan-level"
                value={String(level)}
                options={options}
                onChange={(value) => {
                  setLevel(Number(value))
                }}
              />
            ) : (
              <SelectField
                label={t('levels')}
                hideLabel
                value={String(level)}
                options={options}
                onChange={(event) => {
                  setLevel(Number(event.target.value))
                }}
              />
            )}
          </div>
        ) : null}
        <FloorPlanDrawing plan={plan} label={t('drawing', { level: nameOf(plan) })} />
        <figcaption className={styles.scale}>{t('scale')}</figcaption>
      </figure>
      <div className={styles.legend}>
        <h3 className={styles.legendTitle}>{t('rooms')}</h3>
        <ol className={styles.rooms}>
          {plan.rooms.map((room, index) => (
            <li key={room.id} className={styles.roomRow}>
              <span className={styles.roomNumber}>{index + 1}</span>
              <span className={styles.roomName}>{roomNames[room.kind] ?? room.kind}</span>
              <span className={styles.roomArea}>{area(room.area)}</span>
            </li>
          ))}
        </ol>
        <p className={styles.totalRow}>
          <span>{t('total')}</span>
          <strong>{area(plan.totalArea)}</strong>
        </p>
      </div>
    </div>
  )
}
