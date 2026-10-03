import type { Payload } from 'payload'

import type { Locale } from '@/i18n/locales'

import { isStageIllustration, type ProductionContent } from '../domain/production'
import type { ProductionRepository } from '../ports/production-repository'

export class PayloadProductionRepository implements ProductionRepository {
  constructor(private readonly payload: Payload) {}

  async load(locale: Locale): Promise<ProductionContent> {
    const stored = await this.payload.findGlobal({
      slug: 'production',
      locale,
      depth: 0,
      overrideAccess: false,
    })
    return {
      title: stored.title,
      lead: stored.lead,
      stages: (stored.stages ?? []).flatMap((stage) =>
        isStageIllustration(stage.illustration)
          ? [
              {
                id: stage.id ?? stage.illustration,
                illustration: stage.illustration,
                title: stage.title,
                text: stage.text,
                place: stage.place,
              },
            ]
          : [],
      ),
    }
  }
}
