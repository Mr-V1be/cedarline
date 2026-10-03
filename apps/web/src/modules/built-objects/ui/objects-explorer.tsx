'use client'

import Image from 'next/image'
import { useRef, useState } from 'react'

import { useMediaQuery } from '@/ui/hooks/use-media-query'
import { MapView, type MapLabels, type MapSetup } from '@/ui/components/map/map-view'
import { Sheet } from '@/ui/components/sheet/sheet'

import { ObjectCard } from './object-card'
import type { ObjectView } from './object-view'
import styles from './objects-explorer.module.css'

export interface ObjectsExplorerLabels {
  readonly list: string
  readonly card: string
  readonly close: string
  readonly project: string
  readonly configure: string
}

interface ObjectsExplorerProps {
  readonly objects: readonly ObjectView[]
  readonly map: { readonly setup: MapSetup; readonly labels: MapLabels }
  readonly labels: ObjectsExplorerLabels
}

/** The side panel with the inline card appears from this width; below it the card is a sheet. */
const WIDE = '(width >= 1024px)'

/**
 * Built houses on a clustered map with the list beside it. Picking a house on the map or in
 * the list selects it in both; its card opens inline on wide screens and in a sheet on phones.
 */
export function ObjectsExplorer({ objects, map, labels }: ObjectsExplorerProps) {
  const [selected, setSelected] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const wide = useMediaQuery(WIDE)
  const rowsRef = useRef(new Map<string, HTMLLIElement>())
  const points = objects.map((object) => ({ id: object.id, position: object.location }))
  const chosen = objects.find((object) => object.id === selected) ?? null
  const cardLabels = { project: labels.project, configure: labels.configure }

  const select = (id: string, origin: 'map' | 'list') => {
    setSelected(id)
    if (!wide) setSheetOpen(true)
    else if (origin === 'map') rowsRef.current.get(id)?.scrollIntoView({ block: 'nearest' })
  }

  return (
    <div className={styles.layout}>
      <MapView
        className={styles.map}
        points={points}
        setup={map.setup}
        labels={map.labels}
        selected={selected}
        onSelect={(id) => {
          select(id, 'map')
        }}
        cluster
      />
      <section className={styles.panel} aria-label={labels.list}>
        <ul className={styles.list}>
          {objects.map((object) => {
            const active = object.id === selected
            return (
              <li
                key={object.id}
                ref={(element) => {
                  if (element === null) rowsRef.current.delete(object.id)
                  else rowsRef.current.set(object.id, element)
                }}
              >
                {active && wide ? (
                  <ObjectCard object={object} labels={cardLabels} />
                ) : (
                  <button
                    type="button"
                    className={styles.row}
                    aria-pressed={active}
                    onClick={() => {
                      select(object.id, 'list')
                    }}
                  >
                    <span className={styles.thumb}>
                      {object.cover === null ? null : (
                        <Image src={object.cover.url} alt="" fill sizes="96px" />
                      )}
                    </span>
                    <span className={styles.rowText}>
                      <span className={styles.rowTitle}>{object.title}</span>
                      <span className={styles.rowMeta}>{object.place}</span>
                      <span className={styles.rowMeta}>
                        {object.year} · <span className={styles.numeric}>{object.area}</span>
                      </span>
                    </span>
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      </section>
      <Sheet
        open={sheetOpen && !wide && chosen !== null}
        onClose={() => {
          setSheetOpen(false)
        }}
        title={labels.card}
        closeLabel={labels.close}
      >
        {chosen === null ? null : (
          <ObjectCard object={chosen} labels={cardLabels} headingLevel="h3" />
        )}
      </Sheet>
    </div>
  )
}
