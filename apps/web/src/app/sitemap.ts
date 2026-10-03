import type { MetadataRoute } from 'next'

import { getServices } from '@/composition/services'
import { env } from '@/config/env'
import { DEFAULT_LOCALE, LOCALES, LOCALE_DEFINITIONS } from '@/i18n/locales'
import { localizedPath } from '@/modules/seo/ui/page-metadata'
import { LEGAL_LINKS, SITE_NAVIGATION } from '@/modules/site/domain/navigation'

/** Rebuilt on every request: catalog and articles change without a deployment. */
export const dynamic = 'force-dynamic'

const absolute = (path: string, locale = DEFAULT_LOCALE) =>
  `${env.SITE_URL}${localizedPath(locale, path)}`

function entry(path: string, lastModified?: Date): MetadataRoute.Sitemap[number] {
  return {
    url: absolute(path),
    ...(lastModified === undefined ? {} : { lastModified }),
    alternates: {
      languages: Object.fromEntries(
        LOCALES.map((locale) => [LOCALE_DEFINITIONS[locale].tag, absolute(path, locale)]),
      ),
    },
  }
}

/** Every public page in every language: sections, projects and articles. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const services = await getServices(DEFAULT_LOCALE)
  const [projects, articles] = await Promise.all([
    services.projects.sitemap(),
    services.articles.sitemap(),
  ])
  return [
    entry('/'),
    ...SITE_NAVIGATION.map((item) => entry(item.href)),
    ...LEGAL_LINKS.map((item) => entry(item.href)),
    ...projects.map((project) => entry(`/projects/${project.slug}`, project.updatedAt)),
    ...projects.map((project) => entry(`/configurator/${project.slug}`, project.updatedAt)),
    ...articles.map((article) => entry(`/articles/${article.slug}`, article.updatedAt)),
  ]
}
