import type { WallLayer } from '../domain/wall-assembly'

export interface WallLayerContent extends WallLayer {
  readonly name: string
}

export interface TechnologyContent {
  readonly layers: readonly WallLayerContent[]
  /** Insulation thicknesses offered to customers, mm, the first is the default. */
  readonly insulationOptions: readonly number[]
}

export interface TechnologyRepository {
  load(): Promise<TechnologyContent>
}
