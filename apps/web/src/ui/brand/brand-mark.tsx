import { MARK_GRID, MARK_LINE, MARK_STROKES } from './brand'

interface BrandMarkProps {
  readonly className?: string
  /** Edge in pixels; without it the size comes from the class. */
  readonly size?: number
}

/** The brand's mark in the current text colour; decorative, the name beside it is the label. */
export function BrandMark({ className, size }: BrandMarkProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox={`0 0 ${MARK_GRID} ${MARK_GRID}`}
      aria-hidden
      focusable="false"
    >
      {MARK_STROKES.map((stroke) => (
        <path
          key={stroke.d}
          d={stroke.d}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke.width}
          strokeLinecap={MARK_LINE.cap}
          strokeLinejoin={MARK_LINE.join}
        />
      ))}
    </svg>
  )
}
