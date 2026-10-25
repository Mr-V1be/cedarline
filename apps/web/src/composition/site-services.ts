import type { Payload } from 'payload'

import type { Locale } from '@/i18n/locales'
import { PayloadArticleRepository } from '@/modules/articles/infrastructure/payload-article-repository'
import { PayloadBuiltObjectRepository } from '@/modules/built-objects/infrastructure/payload-built-object-repository'
import { PayloadHouseContextRepository } from '@/modules/catalog/infrastructure/payload-house-context-repository'
import { PayloadProjectRepository } from '@/modules/catalog/infrastructure/payload-project-repository'
import type { ConfiguratorDeps } from '@/modules/configurator/application/configurator-model'
import { CryptoShareCodes } from '@/modules/configurator/infrastructure/crypto-share-codes'
import { PayloadConfiguratorOptionsRepository } from '@/modules/configurator/infrastructure/payload-configurator-options-repository'
import { PayloadDocumentStore } from '@/modules/configurator/infrastructure/payload-document-store'
import { PayloadProjectFamilyRepository } from '@/modules/configurator/infrastructure/payload-project-family-repository'
import { PayloadSavedConfigurationRepository } from '@/modules/configurator/infrastructure/payload-saved-configuration-repository'
import { SharpRenderImages } from '@/modules/configurator/infrastructure/sharp-render-images'
import { PayloadHomeRepository } from '@/modules/home/infrastructure/payload-home-repository'
import { PayloadProductionRepository } from '@/modules/production/infrastructure/payload-production-repository'
import { PayloadExchangeRateRepository } from '@/modules/pricing/infrastructure/payload-exchange-rate-repository'
import { PayloadPricingRepositoryFactory } from '@/modules/pricing/infrastructure/payload-tariff-repository'
import { SharpPreviewImages } from '@/modules/seo/infrastructure/sharp-preview-images'
import { PayloadSiteRepository } from '@/modules/site/infrastructure/payload-site-repository'
import { PayloadTechnologyRepository } from '@/modules/technology/infrastructure/payload-technology-repository'

import { financeServices } from './finance'
import { leadServices } from './leads'

/**
 * Composition root of the site: binds every port to its adapter for one language. Pages, layouts
 * and server actions get it through `getServices` (memoised per request); the seed and jobs build
 * it from their own Payload instance.
 */
export function siteServices(payload: Payload, locale: Locale) {
  const technology = new PayloadTechnologyRepository(payload, locale)
  const houseContext = new PayloadHouseContextRepository(payload, technology)
  const tariffs = new PayloadPricingRepositoryFactory(payload)
  const exchangeRates = new PayloadExchangeRateRepository(payload)
  const site = new PayloadSiteRepository(payload)
  const configurator: ConfiguratorDeps = {
    families: new PayloadProjectFamilyRepository(payload),
    options: new PayloadConfiguratorOptionsRepository(payload, technology),
    houseContext,
    tariff: (language) => tariffs.forLocale(language),
    technology,
  }
  const saved = new PayloadSavedConfigurationRepository(payload)
  const documents = new PayloadDocumentStore(payload)
  return {
    projects: new PayloadProjectRepository(payload),
    houseContext,
    tariff: tariffs.forLocale(locale),
    exchangeRates,
    technology,
    home: new PayloadHomeRepository(payload),
    builtObjects: new PayloadBuiltObjectRepository(payload),
    articles: new PayloadArticleRepository(payload),
    production: new PayloadProductionRepository(payload),
    previews: new SharpPreviewImages(payload),
    finance: financeServices(payload),
    site,
    configurator,
    saving: {
      ...configurator,
      saved,
      documents,
      renders: new SharpRenderImages(),
      codes: new CryptoShareCodes(),
      exchangeRates,
      clock: () => new Date(),
    },
    saved,
    ...leadServices({ payload, saved, documents, site, exchangeRates }),
    logger: payload.logger,
  }
}

export type Services = ReturnType<typeof siteServices>
