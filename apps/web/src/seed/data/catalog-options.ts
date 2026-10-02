import type { FacadeFinish } from '@kedrovnik/house'

import { t, type Localized } from './localized'

export const FACADE_PALETTES: ReadonlyArray<{
  finish: FacadeFinish
  colors: ReadonlyArray<{ name: Localized; hex: string }>
}> = [
  {
    finish: 'timber-imitation',
    colors: [
      { name: t('Сосна натуральная', 'Natural pine'), hex: '#d2a86e' },
      { name: t('Мёд', 'Honey'), hex: '#c08a4b' },
      { name: t('Орех', 'Walnut'), hex: '#6e4a2e' },
      { name: t('Фалунский красный', 'Falu red'), hex: '#7b3226' },
    ],
  },
  {
    finish: 'planken',
    colors: [
      { name: t('Графит', 'Graphite'), hex: '#3a3e3c' },
      { name: t('Лиственница', 'Larch'), hex: '#b98b5a' },
      { name: t('Олива', 'Olive'), hex: '#5e6650' },
      { name: t('Туман', 'Mist'), hex: '#a7ada6' },
    ],
  },
  {
    finish: 'fiber-cement',
    colors: [
      { name: t('Белый камень', 'White stone'), hex: '#e4e1d8' },
      { name: t('Серый базальт', 'Basalt grey'), hex: '#6c6f6c' },
      { name: t('Антрацит', 'Anthracite'), hex: '#2f3331' },
      { name: t('Шалфей', 'Sage'), hex: '#8e9b8a' },
    ],
  },
]

export const ENGINEERING_SYSTEMS: ReadonlyArray<{ key: string; name: Localized }> = [
  { key: 'electrics', name: t('Электрика', 'Electrical wiring') },
  { key: 'water', name: t('Водоснабжение и канализация', 'Water supply and drainage') },
  { key: 'heating', name: t('Отопление', 'Heating') },
  { key: 'ventilation', name: t('Приточно-вытяжная вентиляция', 'Mechanical ventilation') },
]
