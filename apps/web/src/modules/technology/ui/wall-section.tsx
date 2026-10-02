'use client'

import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'

import { Facts } from '@/ui/components/facts/facts'
import { SegmentedControl } from '@/ui/components/segmented/segmented-control'

import { resolveWall } from '../domain/wall-assembly'
import type { WallLayerContent } from '../ports/technology-repository'
import styles from './wall-section.module.css'
import { WallSectionDrawing } from './wall-section-drawing'

interface WallSectionProps {
  readonly layers: readonly WallLayerContent[]
  readonly insulationOptions: readonly number[]
}

/** The wall of every house, drawn to scale; switching insulation redraws it and its numbers. */
export function WallSection({ layers, insulationOptions }: WallSectionProps) {
  const t = useTranslations('home.technology')
  const units = useTranslations('common.units')
  const [insulation, setInsulation] = useState(insulationOptions[0] ?? 0)
  const wall = useMemo(() => resolveWall(layers, insulation), [layers, insulation])

  return (
    <div className={styles.block}>
      <div className={styles.figure}>
        <WallSectionDrawing
          wall={wall}
          label={t('drawing', { value: insulation })}
          outside={t('outside')}
          inside={t('inside')}
        />
      </div>
      <div className={styles.details}>
        {insulationOptions.length > 1 ? (
          <SegmentedControl
            legend={t('insulation')}
            hideLegend={false}
            name="insulation"
            value={String(insulation)}
            options={insulationOptions.map((value) => ({
              value: String(value),
              label: t('insulationOption', { value }),
            }))}
            onChange={(value) => {
              setInsulation(Number(value))
            }}
          />
        ) : null}
        <ol className={styles.layers}>
          {wall.layers.map((layer, index) => (
            <li key={layer.key} className={styles.layer}>
              <span className={styles.number} aria-hidden>
                {index + 1}
              </span>
              <span className={styles.layerName}>{layers[index]?.name ?? layer.key}</span>
              <span className={styles.layerThickness}>
                {units('millimetres', { value: layer.thickness })}
              </span>
            </li>
          ))}
        </ol>
        <Facts
          items={[
            {
              key: 'thickness',
              label: t('thickness'),
              value: units('millimetres', { value: wall.totalThickness }),
            },
            {
              key: 'resistance',
              label: t('resistance'),
              value: t('resistanceValue', { value: wall.thermalResistance }),
            },
          ]}
        />
      </div>
    </div>
  )
}
