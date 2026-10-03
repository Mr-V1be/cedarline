/**
 * Illustrations drawn for the production stages. Each stage in the CMS picks one; a new
 * illustration is a new entry here and a new drawing, existing stages are untouched.
 */
export const STAGE_ILLUSTRATIONS = [
  'design',
  'cutting',
  'panels',
  'inspection',
  'delivery',
  'assembly',
] as const
export type StageIllustration = (typeof STAGE_ILLUSTRATIONS)[number]

export const isStageIllustration = (value: string): value is StageIllustration =>
  (STAGE_ILLUSTRATIONS as readonly string[]).includes(value)

export interface ProductionStage {
  readonly id: string
  readonly illustration: StageIllustration
  readonly title: string
  readonly text: string
  /** Where the stage happens: in the workshop or on the plot. */
  readonly place: 'workshop' | 'site'
}

/** The «О производстве» page as edited in the CMS. */
export interface ProductionContent {
  readonly title: string
  readonly lead: string
  readonly stages: readonly ProductionStage[]
}
