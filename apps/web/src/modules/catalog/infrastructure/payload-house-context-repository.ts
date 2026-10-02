import type { Payload } from 'payload'

import type { Locale } from '@/i18n/locales'
import { standardsFor } from '@/modules/technology/application/standards'
import type { TechnologyRepository } from '@/modules/technology/ports/technology-repository'

import type { HouseContext, HouseContextRepository } from '../ports/house-context-repository'
import { loadRoomKindIndex } from './room-kind-index'

export class PayloadHouseContextRepository implements HouseContextRepository {
  constructor(
    private readonly payload: Payload,
    private readonly technology: TechnologyRepository,
  ) {}

  async load(locale: Locale): Promise<HouseContext> {
    const [rooms, technology] = await Promise.all([
      loadRoomKindIndex(this.payload, locale),
      this.technology.load(),
    ])
    const insulation = technology.insulationOptions[0]
    if (insulation === undefined) throw new Error('Technology defines no insulation options')
    return {
      rooms: rooms.catalog,
      roomNames: rooms.names,
      standards: standardsFor(technology.layers, insulation),
    }
  }
}
