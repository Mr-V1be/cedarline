import type { SiteContent } from '@/modules/site/domain/site'

/**
 * schema.org descriptions of the company and its content for search engines. Builders take
 * domain data and absolute URLs; pages render the result with <JsonLd>.
 */
type Schema = Readonly<Record<string, unknown>>

export interface BusinessInput {
  readonly name: string
  readonly url: string
  readonly logo: string
  readonly site: SiteContent
}

/** The company as a local construction business: contacts, address and where it builds. */
export function businessSchema({ name, url, logo, site }: BusinessInput): Schema {
  return {
    '@type': 'HomeAndConstructionBusiness',
    '@id': `${url}#organization`,
    name,
    legalName: site.legal.name,
    url,
    logo,
    telephone: site.phone,
    email: site.email,
    address: { '@type': 'PostalAddress', streetAddress: site.address, addressCountry: 'RU' },
    ...(site.location === null
      ? {}
      : {
          geo: {
            '@type': 'GeoCoordinates',
            longitude: site.location[0],
            latitude: site.location[1],
          },
        }),
    areaServed: site.region,
  }
}

/** The site itself, published by the company. */
export function websiteSchema(input: { name: string; url: string; language: string }): Schema {
  return {
    '@type': 'WebSite',
    '@id': `${input.url}#website`,
    name: input.name,
    url: input.url,
    inLanguage: input.language,
    publisher: { '@id': `${input.url}#organization` },
  }
}

export interface Crumb {
  readonly name: string
  readonly url: string
}

export function breadcrumbSchema(crumbs: readonly Crumb[]): Schema {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: crumb.url,
    })),
  }
}

export interface ArticleInput {
  readonly title: string
  readonly description: string
  readonly url: string
  readonly image: string | null
  readonly publishedAt: Date
  readonly language: string
  readonly publisherUrl: string
}

export function articleSchema(input: ArticleInput): Schema {
  return {
    '@type': 'Article',
    headline: input.title,
    description: input.description,
    url: input.url,
    mainEntityOfPage: input.url,
    datePublished: input.publishedAt.toISOString(),
    inLanguage: input.language,
    ...(input.image === null ? {} : { image: [input.image] }),
    author: { '@id': `${input.publisherUrl}#organization` },
    publisher: { '@id': `${input.publisherUrl}#organization` },
  }
}
