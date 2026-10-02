'use client'

import type { ConfigurationState } from '@kedrovnik/configurator'
import { useTranslations } from 'next-intl'
import { useMemo, type ReactNode } from 'react'

import { resolveWall } from '@/modules/technology/domain/wall-assembly'
import type { WallLayerContent } from '@/modules/technology/ports/technology-repository'
import { WallSectionDrawing } from '@/modules/technology/ui/wall-section-drawing'

import type { Vocabulary } from '../../application/vocabulary'
import type { ConfiguratorNames } from '../../domain/names'
import { EstimateDetails } from '../estimate/estimate-details'
import styles from './step-extras.module.css'

/** The wall section at the chosen insulation, to scale, with its thermal resistance. */
function Wall({
  layers,
  insulation,
}: {
  readonly layers: readonly WallLayerContent[]
  readonly insulation: number
}) {
  const technology = useTranslations('home.technology')
  const project = useTranslations('project.specs')
  const wall = useMemo(() => resolveWall(layers, insulation), [insulation, layers])
  return (
    <figure className={styles.wall}>
      <WallSectionDrawing
        wall={wall}
        label={technology('drawing', { value: insulation })}
        outside={technology('outside')}
        inside={technology('inside')}
      />
      <figcaption className={styles.caption}>
        <span>{project('thermal')}</span>
        <strong>{project('thermalValue', { value: wall.thermalResistance })}</strong>
      </figcaption>
    </figure>
  )
}

/** The summary step: what was chosen, the full estimate and schedule, and what to do next. */
function Summary({
  state,
  vocabulary,
  names,
  actions,
  problem,
}: {
  readonly state: ConfigurationState
  readonly vocabulary: Vocabulary
  readonly names: ConfiguratorNames
  readonly actions: ReactNode
  readonly problem: 'failed' | 'limited' | null
}) {
  const t = useTranslations('configurator')
  return (
    <div className={styles.summary}>
      <dl className={styles.rows}>
        {vocabulary.rows(state.configuration).map((row) => (
          <div key={row.group} className={styles.row}>
            <dt>{row.label}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>
      <EstimateDetails
        estimate={state.quote.estimate}
        schedule={state.quote.schedule}
        names={names.tariff}
      />
      <div className={styles.actions}>{actions}</div>
      <p className={styles.problem} role="alert">
        {problem === 'limited' ? t('share.limited') : null}
        {problem === 'failed' ? t('share.error') : null}
      </p>
    </div>
  )
}

export const StepExtras = { Wall, Summary }
