import { t, type Localized } from './localized'

export const PROJECT_TYPES: ReadonlyArray<{ slug: string; title: Localized; order: number }> = [
  { slug: 'house', title: t('Дом', 'House'), order: 10 },
  { slug: 'sauna', title: t('Баня', 'Sauna'), order: 20 },
  { slug: 'guest-house', title: t('Гостевой дом', 'Guest house'), order: 30 },
]

interface RoomKindSeed {
  readonly key: string
  readonly title: Localized
  readonly bedroom?: boolean
  readonly wetZone?: boolean
  readonly stair?: boolean
}

export const ROOM_KINDS: readonly RoomKindSeed[] = [
  { key: 'kitchen-living', title: t('Кухня-гостиная', 'Kitchen and living room') },
  { key: 'living', title: t('Гостиная', 'Living room') },
  { key: 'bedroom', title: t('Спальня', 'Bedroom'), bedroom: true },
  { key: 'bathroom', title: t('Санузел', 'Bathroom'), wetZone: true },
  { key: 'hall', title: t('Прихожая', 'Entrance hall') },
  { key: 'corridor', title: t('Коридор', 'Corridor') },
  { key: 'plant', title: t('Техническое помещение', 'Plant room') },
  { key: 'wardrobe', title: t('Гардеробная', 'Walk-in wardrobe') },
  { key: 'study', title: t('Кабинет', 'Study') },
  { key: 'stair', title: t('Лестница', 'Stairs'), stair: true },
  { key: 'lounge', title: t('Комната отдыха', 'Lounge') },
  { key: 'wash', title: t('Моечная', 'Washing room'), wetZone: true },
  { key: 'steam', title: t('Парная', 'Steam room'), wetZone: true },
]
