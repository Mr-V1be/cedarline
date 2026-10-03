import type { ImageAsset } from '@/modules/catalog/domain/project'

/** A built house prepared for the explorer: texts already in the visitor's language. */
export interface ObjectView {
  readonly id: string
  readonly title: string
  readonly place: string
  readonly year: string
  readonly area: string
  readonly builtFrom: string | null
  readonly cover: ImageAsset | null
  readonly location: readonly [number, number]
  readonly projectSlug: string | null
}
