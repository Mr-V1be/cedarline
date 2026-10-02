import Image from 'next/image'
import { getTranslations } from 'next-intl/server'

import type { BuiltObject } from '../domain/built-object'
import styles from './built-gallery.module.css'

/** Bento of handed-over houses: the first one large, captions below the images. */
export async function BuiltGallery({ objects }: { readonly objects: readonly BuiltObject[] }) {
  const [t, units] = await Promise.all([
    getTranslations('home.built'),
    getTranslations('common.units'),
  ])
  return (
    <ul className={styles.grid}>
      {objects.map((object, index) => (
        <li key={object.id} className={`${styles.item} ${index === 0 ? styles.lead : ''}`}>
          <div className={styles.media}>
            {object.cover === null ? null : (
              <Image
                className={styles.image}
                src={object.cover.url}
                alt={object.cover.alt}
                fill
                sizes={
                  index === 0
                    ? '(min-width: 1024px) 50vw, 100vw'
                    : '(min-width: 1024px) 25vw, (min-width: 768px) 50vw, 100vw'
                }
              />
            )}
          </div>
          <div className={styles.caption}>
            <h3 className={styles.title}>{object.title}</h3>
            <p className={styles.meta}>
              {t('place', { settlement: object.settlement, region: object.region })}
            </p>
            <p className={styles.meta}>
              {t('year', { year: object.year })}, {units('area', { value: object.area })}
            </p>
          </div>
        </li>
      ))}
    </ul>
  )
}
