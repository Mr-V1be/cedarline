import type { CSSProperties } from 'react'

import type { ScheduleView } from '../application/offers'
import styles from './schedule-chart.module.css'

interface ScheduleChartProps {
  readonly schedule: ScheduleView
  readonly labels: {
    readonly axis: string
    readonly total: string
    readonly totalValue: string
    readonly range: (from: number, to: number) => string
  }
}

/** Phases are told apart by colour; the order of the tariff's phases picks the colour. */
const PHASE_TONES = ['production', 'site'] as const

/** Gantt chart in weeks: every stage on its own row, bars on a shared week grid. */
export function ScheduleChart({ schedule, labels }: ScheduleChartProps) {
  const weeks = Array.from({ length: schedule.totalWeeks }, (_, index) => index + 1)
  const toneOf = (phase: string) => {
    const index = schedule.phases.findIndex((candidate) => candidate.key === phase)
    return styles[PHASE_TONES[Math.max(0, index) % PHASE_TONES.length] ?? 'site']
  }
  const grid = { '--weeks': schedule.totalWeeks } as CSSProperties

  return (
    <div className={styles.chart}>
      <ul className={styles.legend}>
        {schedule.phases.map((phase) => (
          <li key={phase.key}>
            <span className={`${styles.swatch} ${toneOf(phase.key)}`} aria-hidden />
            {phase.name}
          </li>
        ))}
      </ul>
      <div className={styles.axis} style={grid} aria-hidden>
        <span className={styles.axisLabel}>{labels.axis}</span>
        <div className={styles.ticks}>
          {weeks.map((week) => (
            <span key={week} className={styles.tick}>
              {week}
            </span>
          ))}
        </div>
      </div>
      <ol className={styles.rows}>
        {schedule.stages.map((stage) => (
          <li key={stage.key} className={styles.row} style={grid}>
            <span className={styles.name}>{stage.name}</span>
            <span className={styles.weeks}>{labels.range(stage.fromWeek, stage.toWeek)}</span>
            <span className={styles.track}>
              <span
                className={`${styles.bar} ${toneOf(stage.phase)}`}
                style={{ gridColumn: `${stage.fromWeek} / ${stage.toWeek + 1}` }}
              />
            </span>
          </li>
        ))}
      </ol>
      <p className={styles.total}>
        <span>{labels.total}</span>
        <strong>{labels.totalValue}</strong>
      </p>
    </div>
  )
}
