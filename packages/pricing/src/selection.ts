/**
 * Customer choices keyed by option code (`roof`, `facade`, `engineering`, …). Option codes and
 * values are data: the pricing domain only compares them, it never interprets them.
 */
export type SelectionValue = string | readonly string[]
export type Selections = Readonly<Record<string, SelectionValue>>

/** Specification: holds when the selected value (or any of the selected values) is listed. */
export interface Condition {
  readonly option: string
  readonly anyOf: readonly string[]
}

export function conditionHolds(condition: Condition, selections: Selections): boolean {
  const selected = selections[condition.option]
  if (selected === undefined) return false
  const values: readonly string[] = typeof selected === 'string' ? [selected] : selected
  return values.some((value) => condition.anyOf.includes(value))
}

/** All conditions must hold; an empty list always applies. */
export function allConditionsHold(
  conditions: readonly Condition[] | undefined,
  selections: Selections,
): boolean {
  return (conditions ?? []).every((condition) => conditionHolds(condition, selections))
}
