import type { Project, ProjectType } from '@/cms/generated/payload-types'

import {
  GALLERY_VIEWS,
  type GalleryItem,
  type ProjectMetrics,
  type ProjectPricing,
  type ProjectSummary,
} from '../domain/project'
import { toImageAsset } from './media-mapper'

export type SummaryDocument = Pick<
  Project,
  'id' | 'slug' | 'title' | 'summary' | 'type' | 'gallery' | 'metrics' | 'pricing'
>

function toTypeRef(type: number | ProjectType) {
  if (typeof type === 'number') throw new Error(`Project type ${type} is not populated`)
  return { slug: type.slug, title: type.title }
}

/** Projections are written by the save hook, so a stored project always has them. */
function toMetrics(metrics: Project['metrics']): ProjectMetrics {
  return {
    totalArea: metrics?.totalArea ?? 0,
    terraceArea: metrics?.terraceArea ?? 0,
    bedrooms: metrics?.bedrooms ?? 0,
    wetZones: metrics?.wetZones ?? 0,
    levels: metrics?.levels ?? 1,
    storeys: metrics?.storeys ?? 1,
    attic: metrics?.attic ?? false,
    storeyType: metrics?.storeyType ?? '1',
    width: metrics?.width ?? 0,
    depth: metrics?.depth ?? 0,
    ridgeHeight: metrics?.ridgeHeight ?? 0,
  }
}

function toPricing(pricing: Project['pricing']): ProjectPricing | null {
  if (pricing?.fromPrice == null || pricing.fromCompleteness == null) return null
  return {
    fromPrice: pricing.fromPrice,
    fromCompleteness: pricing.fromCompleteness,
    totalWeeks: pricing.totalWeeks ?? 0,
    tariffRevision: pricing.tariffRevision ?? 0,
  }
}

export function toGallery(gallery: Project['gallery']): GalleryItem[] {
  return (gallery ?? []).flatMap((item) => {
    const image = toImageAsset(item.image)
    const view = GALLERY_VIEWS.find((candidate) => candidate === item.view)
    return image === null || view === undefined ? [] : [{ view, image }]
  })
}

export function toProjectSummary(document: SummaryDocument): ProjectSummary {
  return {
    id: document.id,
    slug: document.slug,
    title: document.title,
    summary: document.summary,
    type: toTypeRef(document.type),
    cover: toGallery(document.gallery)[0]?.image ?? null,
    metrics: toMetrics(document.metrics),
    pricing: toPricing(document.pricing),
  }
}
