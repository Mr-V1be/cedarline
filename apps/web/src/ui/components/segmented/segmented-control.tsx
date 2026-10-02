import styles from './segmented-control.module.css'

export interface SegmentOption<T extends string> {
  readonly value: T
  readonly label: string
}

interface SegmentedControlProps<T extends string> {
  readonly legend: string
  readonly name: string
  readonly value: T
  readonly options: readonly SegmentOption<T>[]
  readonly onChange: (value: T) => void
  readonly hideLegend?: boolean
}

/** Two or three short, mutually exclusive modes. Radio semantics, arrow-key navigation. */
export function SegmentedControl<T extends string>({
  legend,
  name,
  value,
  options,
  onChange,
  hideLegend = true,
}: SegmentedControlProps<T>) {
  return (
    <fieldset className={styles.group}>
      <legend className={hideLegend ? 'visually-hidden' : styles.legend}>{legend}</legend>
      <div className={styles.track}>
        {options.map((option) => (
          <label key={option.value} className={styles.segment}>
            <input
              className={`${styles.input} visually-hidden`}
              type="radio"
              name={name}
              value={option.value}
              checked={option.value === value}
              onChange={() => {
                onChange(option.value)
              }}
            />
            <span className={styles.text}>{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}
