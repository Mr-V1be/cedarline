import { CubeIcon, HouseLineIcon } from '@phosphor-icons/react/ssr'
import Image from 'next/image'

import { ButtonLink } from '@/ui/components/button/button'

import styles from './objects-explorer.module.css'
import type { ObjectView } from './object-view'

interface ObjectCardProps {
  readonly object: ObjectView
  readonly labels: { readonly project: string; readonly configure: string }
  /** Heading level inside the page or the sheet the card sits in. */
  readonly headingLevel?: 'h2' | 'h3'
}

/** Everything about one built house: its render, place, year, area and the way to its project. */
export function ObjectCard({ object, labels, headingLevel: Heading = 'h3' }: ObjectCardProps) {
  return (
    <article className={styles.card}>
      <div className={styles.cardMedia}>
        {object.cover === null ? null : (
          <Image
            src={object.cover.url}
            alt={object.cover.alt}
            fill
            sizes="(min-width: 1024px) 420px, 100vw"
            className={styles.cardImage}
          />
        )}
      </div>
      <div className={styles.cardBody}>
        <Heading className={styles.cardTitle}>{object.title}</Heading>
        <p className={styles.cardPlace}>{object.place}</p>
        <p className={styles.cardFacts}>
          <span>{object.year}</span>
          <span className={styles.numeric}>{object.area}</span>
        </p>
        {object.builtFrom === null ? null : <p className={styles.cardFrom}>{object.builtFrom}</p>}
        {object.projectSlug === null ? null : (
          <div className={styles.cardActions}>
            <ButtonLink href={`/projects/${object.projectSlug}`} icon={HouseLineIcon} stretch>
              {labels.project}
            </ButtonLink>
            <ButtonLink
              href={`/configurator/${object.projectSlug}`}
              variant="secondary"
              icon={CubeIcon}
              stretch
            >
              {labels.configure}
            </ButtonLink>
          </div>
        )}
      </div>
    </article>
  )
}
