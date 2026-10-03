import { getTranslations } from 'next-intl/server'

import type { ProductionStage } from '../domain/production'
import styles from './production.module.css'
import { StageIllustration } from './stage-illustration'

/** The stages in order, each with its scheme, where it happens and what is done. */
export async function ProductionStages({
  stages,
}: {
  readonly stages: readonly ProductionStage[]
}) {
  const t = await getTranslations('production.place')
  return (
    <ol className={styles.stages}>
      {stages.map((stage, index) => (
        <li key={stage.id} className={styles.stage} data-place={stage.place}>
          <div className={styles.stageFigure}>
            <StageIllustration illustration={stage.illustration} />
          </div>
          <div className={styles.stageText}>
            <p className={styles.stageMeta}>
              <span className={styles.stageNumber}>{String(index + 1).padStart(2, '0')}</span>
              <span>{t(stage.place)}</span>
            </p>
            <h3 className={styles.stageTitle}>{stage.title}</h3>
            <p className={styles.stageDescription}>{stage.text}</p>
          </div>
        </li>
      ))}
    </ol>
  )
}
