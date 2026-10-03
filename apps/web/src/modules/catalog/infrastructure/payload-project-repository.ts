import type { Payload } from 'payload'

import type { Locale } from '@/i18n/locales'

import { CATALOG_PAGE_SIZE, type CatalogQuery } from '../domain/catalog-query'
import type { CatalogFacets, Range } from '../domain/facets'
import type { ProjectDetails, ProjectSummary } from '../domain/project'
import type { Page, ProjectPrice, ProjectRepository } from '../ports/project-repository'
import { CATALOG_SORT_FIELDS, PUBLISHED, catalogWhere } from './catalog-where'
import { toHouseDesign, toHouseOptions } from './project-design-mapper'
import { toGallery, toProjectSummary } from './project-read-mapper'
import { loadRoomKindIndex } from './room-kind-index'

/** Columns a catalog card needs; the design and defaults stay in the database. */
const SUMMARY_SELECT = {
  slug: true,
  title: true,
  summary: true,
  type: true,
  gallery: true,
  metrics: true,
  pricing: true,
} as const

/** Distinct values may come back keyed by the dotted path or as a nested object. */
function distinctValue(row: Record<string, unknown>, path: string): unknown {
  if (path in row) return row[path]
  return path
    .split('.')
    .reduce<unknown>(
      (value, segment) =>
        typeof value === 'object' && value !== null
          ? (value as Record<string, unknown>)[segment]
          : undefined,
      row,
    )
}

/** Public reads go through access control: visitors only ever see published documents. */
const PUBLIC = { overrideAccess: false } as const

export class PayloadProjectRepository implements ProjectRepository {
  constructor(private readonly payload: Payload) {}

  async list(query: CatalogQuery, locale: Locale): Promise<Page<ProjectSummary>> {
    const result = await this.payload.find({
      ...PUBLIC,
      collection: 'projects',
      locale,
      depth: 1,
      where: catalogWhere(query),
      sort: CATALOG_SORT_FIELDS[query.sort],
      limit: CATALOG_PAGE_SIZE,
      page: query.page,
      select: SUMMARY_SELECT,
    })
    return {
      items: result.docs.map(toProjectSummary),
      total: result.totalDocs,
      page: result.page ?? query.page,
      pageCount: result.totalPages,
    }
  }

  async facets(locale: Locale): Promise<CatalogFacets> {
    const distinct = (field: string) =>
      this.payload.findDistinct({
        ...PUBLIC,
        collection: 'projects',
        field,
        where: PUBLISHED,
        sort: field,
      })
    const [typeIds, storeyTypes, bedrooms, area, price] = await Promise.all([
      distinct('type'),
      distinct('metrics.storeyType'),
      distinct('metrics.bedrooms'),
      this.range('metrics.totalArea', locale),
      this.range('pricing.fromPrice', locale),
    ])
    const values = (result: { values: Array<Record<string, unknown>> }, path: string) =>
      result.values
        .map((row) => distinctValue(row, path))
        .filter((value) => value !== null && value !== undefined)
    const used = new Set(values(typeIds, 'type').map(Number))
    const types = await this.payload.find({
      ...PUBLIC,
      collection: 'project-types',
      locale,
      depth: 0,
      pagination: false,
      sort: 'order',
      where: { id: { in: [...used] } },
    })
    return {
      types: types.docs.map((type) => ({ slug: type.slug, title: type.title })),
      storeyTypes: values(storeyTypes, 'metrics.storeyType').map(String),
      bedrooms: values(bedrooms, 'metrics.bedrooms').map(Number).filter(Number.isFinite),
      area,
      price,
    }
  }

  private async range(
    field: 'metrics.totalArea' | 'pricing.fromPrice',
    locale: Locale,
  ): Promise<Range | null> {
    const read = async (direction: '' | '-') => {
      const { docs } = await this.payload.find({
        ...PUBLIC,
        collection: 'projects',
        locale,
        depth: 0,
        limit: 1,
        where: PUBLISHED,
        sort: `${direction}${field}`,
        select: { metrics: true, pricing: true },
      })
      const doc = docs[0]
      if (doc === undefined) return undefined
      return field === 'metrics.totalArea' ? doc.metrics?.totalArea : doc.pricing?.fromPrice
    }
    const [min, max] = await Promise.all([read(''), read('-')])
    return min == null || max == null ? null : { min, max }
  }

  async findBySlug(slug: string, locale: Locale): Promise<ProjectDetails | null> {
    const [{ docs }, rooms] = await Promise.all([
      this.payload.find({
        ...PUBLIC,
        collection: 'projects',
        locale,
        depth: 1,
        limit: 1,
        where: { and: [PUBLISHED, { slug: { equals: slug } }] },
      }),
      loadRoomKindIndex(this.payload, locale),
    ])
    const document = docs[0]
    if (document === undefined) return null
    return {
      ...toProjectSummary(document),
      gallery: toGallery(document.gallery),
      design: toHouseDesign(document.design, rooms.keyOf),
      options: toHouseOptions(document.defaults),
      engineering: document.defaults.engineering ?? [],
    }
  }

  async findSimilar(
    project: ProjectSummary,
    limit: number,
    locale: Locale,
  ): Promise<readonly ProjectSummary[]> {
    const { docs } = await this.payload.find({
      ...PUBLIC,
      collection: 'projects',
      locale,
      depth: 1,
      limit,
      where: {
        and: [
          PUBLISHED,
          { 'type.slug': { equals: project.type.slug } },
          { id: { not_equals: project.id } },
        ],
      },
      sort: CATALOG_SORT_FIELDS.recommended,
      select: SUMMARY_SELECT,
    })
    return docs.map(toProjectSummary)
  }

  async priceList(locale: Locale): Promise<readonly ProjectPrice[]> {
    const { docs } = await this.payload.find({
      ...PUBLIC,
      collection: 'projects',
      locale,
      depth: 0,
      pagination: false,
      where: PUBLISHED,
      sort: CATALOG_SORT_FIELDS.recommended,
      select: { slug: true, title: true, pricing: true },
    })
    return docs.flatMap((doc) =>
      typeof doc.pricing?.fromPrice === 'number'
        ? [{ slug: doc.slug, title: doc.title, fromPrice: doc.pricing.fromPrice }]
        : [],
    )
  }
}
