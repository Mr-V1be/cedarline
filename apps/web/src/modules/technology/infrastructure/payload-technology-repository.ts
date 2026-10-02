import type { Payload, PayloadRequest } from 'payload'

import type { Locale } from '@/i18n/locales'

import type { TechnologyContent, TechnologyRepository } from '../ports/technology-repository'

export class PayloadTechnologyRepository implements TechnologyRepository {
  constructor(
    private readonly payload: Payload,
    private readonly locale: Locale,
    private readonly req?: PayloadRequest,
  ) {}

  async load(): Promise<TechnologyContent> {
    const document = await this.payload.findGlobal({
      slug: 'technology',
      locale: this.locale,
      depth: 0,
      ...(this.req === undefined ? {} : { req: this.req }),
    })
    return {
      layers: (document.layers ?? []).map((layer) => ({
        key: layer.key,
        name: layer.name,
        role: layer.role,
        thickness: layer.thickness,
        conductivity: layer.conductivity ?? null,
      })),
      insulationOptions: (document.insulationOptions ?? []).map((option) => option.thickness),
    }
  }
}
