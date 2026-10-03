import type { ReactNode } from 'react'

import type { StageIllustration as StageIllustrationKey } from '../domain/production'
import styles from './production.module.css'

/**
 * Line schemes of the production stages in the drafting style of the site. They use the
 * theme's ink and accent colours, so they read the same in light and dark.
 */
const DRAWINGS: Readonly<Record<StageIllustrationKey, ReactNode>> = {
  design: (
    <>
      <rect x="28" y="22" width="150" height="112" rx="3" className={styles.paper} />
      <rect x="48" y="40" width="96" height="66" className={styles.wall} />
      <path d="M96 40V106M48 74H96" className={styles.thin} />
      <path d="M48 120H144M48 116V124M144 116V124" className={styles.dimension} />
      <path d="M156 48V106M152 48H160M152 106H160" className={styles.dimension} />
      <path d="M170 128L212 70L222 78L180 136L166 140Z" className={styles.accentFill} />
      <path d="M212 70L222 78" className={styles.line} />
    </>
  ),
  cutting: (
    <>
      <path d="M20 112H220V124H20Z" className={styles.table} />
      <path d="M30 96H190V112H30Z" className={styles.woodFill} />
      <path d="M70 96V112M110 96V112M150 96V112" className={styles.cut} />
      <circle cx="170" cy="70" r="30" className={styles.blade} />
      <circle cx="170" cy="70" r="6" className={styles.line} />
      <path
        d="M170 40L176 46M200 70L194 76M170 100L164 94M140 70L146 64M191 49L190 57M191 91L183 90M149 91L150 83M149 49L157 50"
        className={styles.line}
      />
      <path d="M170 70L215 30" className={styles.thin} />
    </>
  ),
  panels: (
    <>
      <rect x="40" y="24" width="160" height="112" className={styles.woodFill} />
      <rect x="48" y="32" width="144" height="96" className={styles.paper} />
      <path d="M88 32V128M128 32V128M168 32V128" className={styles.stud} />
      <path
        d="M52 40Q58 34 64 40T76 40T88 40M52 56Q58 50 64 56T76 56T88 56M52 72Q58 66 64 72T76 72T88 72M92 40Q98 34 104 40T116 40T128 40M92 56Q98 50 104 56T116 56T128 56"
        className={styles.wool}
      />
      <rect x="132" y="48" width="32" height="44" className={styles.window} />
    </>
  ),
  inspection: (
    <>
      <rect x="34" y="30" width="120" height="100" className={styles.woodFill} />
      <path d="M74 30V130M114 30V130" className={styles.stud} />
      <path d="M150 112L210 112L210 128L150 128Z" className={styles.paper} />
      <path
        d="M158 116V124M162 116V124M168 116V124M171 116V124M177 116V124M182 116V124M188 116V124M192 116V124M198 116V124"
        className={styles.thin}
      />
      <path d="M166 44L200 44L200 50L172 50L172 96L166 96Z" className={styles.accentFill} />
      <path d="M58 78L72 92L102 60" className={styles.check} />
    </>
  ),
  delivery: (
    <>
      <path d="M20 120H220" className={styles.ground} />
      <rect x="30" y="66" width="128" height="40" className={styles.paper} />
      <path d="M36 66V52H150V66M42 52V40H144V52" className={styles.woodFill} />
      <path d="M158 76H192L210 94V106H158Z" className={styles.cab} />
      <path d="M168 80H188L200 92H168Z" className={styles.window} />
      <circle cx="62" cy="112" r="10" className={styles.wheel} />
      <circle cx="132" cy="112" r="10" className={styles.wheel} />
      <circle cx="190" cy="112" r="10" className={styles.wheel} />
    </>
  ),
  assembly: (
    <>
      <path d="M10 128H230" className={styles.ground} />
      <path d="M60 112V140M100 112V140M140 112V140M180 112V140" className={styles.pile} />
      <path d="M48 104H192V112H48Z" className={styles.woodFill} />
      <path d="M56 104V62M96 104V62M136 104V62M176 104V62M52 62H184" className={styles.stud} />
      <path d="M52 62L118 26L184 62" className={styles.wall} />
      <path d="M210 18V128M210 18H130M130 18V40" className={styles.line} />
      <path d="M124 40H136V46H124Z" className={styles.accentFill} />
    </>
  ),
}

export function StageIllustration({
  illustration,
}: {
  readonly illustration: StageIllustrationKey
}) {
  return (
    <svg viewBox="0 0 240 160" className={styles.illustration} aria-hidden focusable="false">
      {DRAWINGS[illustration]}
    </svg>
  )
}
