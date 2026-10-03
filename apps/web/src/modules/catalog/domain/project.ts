import type { HouseDesign, HouseOptions } from '@kedrovnik/house'

/** A CMS image; responsive sizes are produced by the image optimizer on request. */
/** An image the site can show: its address, intrinsic size and description. */
export interface Picture {
  readonly url: string
  readonly width: number
  readonly height: number
  readonly alt: string
}

/** A picture from the media library. */
export interface ImageAsset extends Picture {
  /** The media document, for derived images such as link previews. */
  readonly id: number
}

export interface ProjectTypeRef {
  readonly slug: string
  readonly title: string
}

/** Catalog characteristics, stored as a projection of the design. */
export interface ProjectMetrics {
  readonly totalArea: number
  readonly terraceArea: number
  readonly bedrooms: number
  readonly wetZones: number
  readonly levels: number
  readonly storeys: number
  readonly attic: boolean
  readonly storeyType: string
  readonly width: number
  readonly depth: number
  readonly ridgeHeight: number
}

/** Price «от» and its schedule, stored as a projection of the design and the tariff. */
export interface ProjectPricing {
  readonly fromPrice: number
  readonly fromCompleteness: string
  readonly totalWeeks: number
  readonly tariffRevision: number
}

export const GALLERY_VIEWS = ['front', 'evening', 'back', 'side', 'aerial', 'detail'] as const
export type GalleryView = (typeof GALLERY_VIEWS)[number]

export interface GalleryItem {
  readonly view: GalleryView
  readonly image: ImageAsset
}

export interface ProjectSummary {
  readonly id: number
  readonly slug: string
  readonly title: string
  readonly summary: string
  readonly type: ProjectTypeRef
  readonly cover: ImageAsset | null
  readonly metrics: ProjectMetrics
  readonly pricing: ProjectPricing | null
}

export interface ProjectDetails extends ProjectSummary {
  readonly gallery: readonly GalleryItem[]
  readonly design: HouseDesign
  readonly options: HouseOptions
  readonly engineering: readonly string[]
}

/** Storey type key: «1», «1-attic», «2»… Used for filtering and labels. */
export const storeyTypeOf = (storeys: number, attic: boolean): string =>
  attic ? `${storeys}-attic` : String(storeys)

export interface StoreyType {
  readonly storeys: number
  readonly attic: boolean
}

export function parseStoreyType(key: string): StoreyType | null {
  const match = /^([1-9])(-attic)?$/.exec(key)
  if (match === null) return null
  return { storeys: Number(match[1]), attic: match[2] !== undefined }
}
