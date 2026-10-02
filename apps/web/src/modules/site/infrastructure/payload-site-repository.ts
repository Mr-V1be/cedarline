import type { Payload } from 'payload'

import type { Locale } from '@/i18n/locales'

import type { SiteContent } from '../domain/site'
import type { SiteRepository } from '../ports/site-repository'

export class PayloadSiteRepository implements SiteRepository {
  constructor(private readonly payload: Payload) {}

  async load(locale: Locale): Promise<SiteContent> {
    const site = await this.payload.findGlobal({
      slug: 'site',
      locale,
      depth: 0,
      overrideAccess: false,
    })
    return {
      phone: site.phone,
      email: site.email,
      address: site.address,
      hours: site.hours,
      region: site.region,
    }
  }
}
