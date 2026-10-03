import type { ImageAsset } from '@/modules/catalog/domain/project'

/** A house that has been built and handed over. */
export interface BuiltObject {
  readonly id: number
  readonly slug: string
  readonly title: string
  readonly settlement: string
  readonly region: string
  readonly year: number
  readonly area: number
  /** [longitude, latitude] */
  readonly location: readonly [number, number]
  readonly cover: ImageAsset | null
  /** The catalog project it was built from, when that project is still published. */
  readonly project: { readonly slug: string; readonly title: string } | null
}
