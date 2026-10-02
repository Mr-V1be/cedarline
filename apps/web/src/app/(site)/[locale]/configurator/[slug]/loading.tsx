import { getTranslations } from 'next-intl/server'

import { Skeleton } from '@/ui/components/skeleton/skeleton'

import styles from './loading.module.css'

/** The configurator's frame while its data loads: the stage, the title and the first step. */
export default async function ConfiguratorLoading() {
  const t = await getTranslations('configurator.stage')
  return (
    <div className={styles.frame} role="status" aria-label={t('loading')}>
      <Skeleton className={styles.stage} />
      <div className={styles.panel}>
        <Skeleton shape="line" style={{ width: '30%' }} />
        <Skeleton shape="line" style={{ width: '60%', height: '2em' }} />
        <Skeleton shape="line" style={{ width: '40%', height: '1.5em' }} />
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className={styles.option} />
        ))}
      </div>
    </div>
  )
}
