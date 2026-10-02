import type { SelectionOption } from '@kedrovnik/configurator'
import type { FacadeFinish, RoofKindKey, WindowStyle } from '@kedrovnik/house'

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

export const ENGINEERING_SYSTEMS: ReadonlyArray<{
  key: string
  name: Localized
  requires: readonly string[]
}> = [
  { key: 'electrics', name: t('Электрика', 'Electrical wiring'), requires: [] },
  {
    key: 'water',
    name: t('Водоснабжение и канализация', 'Water supply and drainage'),
    requires: ['electrics'],
  },
  { key: 'heating', name: t('Отопление', 'Heating'), requires: ['electrics'] },
  {
    key: 'ventilation',
    name: t('Приточно-вытяжная вентиляция', 'Mechanical ventilation'),
    requires: ['electrics'],
  },
]

export const OFFERED_ROOFS: readonly RoofKindKey[] = ['gable', 'shed', 'gambrel']
export const OFFERED_WINDOWS: readonly WindowStyle[] = ['standard', 'panoramic']
/** Terrace depths offered besides each project's own, mm. */
export const TERRACE_DEPTHS: readonly number[] = [1500, 2000, 2500, 3000]

/** Combinations the factory does not build, with the reason told to the customer. */
export const COMPATIBILITY_RULES: ReadonlyArray<{
  key: string
  when: ReadonlyArray<{ option: SelectionOption; values: readonly string[] }>
  message: Localized
}> = [
  {
    key: 'panoramic-needs-200',
    when: [
      { option: 'windows', values: ['panoramic'] },
      { option: 'insulation', values: ['150'] },
    ],
    message: t(
      'Панорамное остекление делаем только со стеной 200 мм: через большие стёкла уходит больше тепла, и более тёплая стена это компенсирует.',
      'Panoramic glazing comes only with 200 mm walls: large panes lose more heat, and the warmer wall makes up for it.',
    ),
  },
  {
    key: 'gambrel-only-attic',
    when: [
      { option: 'storeys', values: ['1', '2', '3'] },
      { option: 'roof', values: ['gambrel'] },
    ],
    message: t(
      'Ломаная кровля нужна, чтобы под ней жить: ставим её только над мансардой. Без мансарды она даёт холодный объём, за который пришлось бы платить зря.',
      'A gambrel roof exists to live under it, so we build it only over an attic. Without one it encloses cold space you would pay for in vain.',
    ),
  },
  {
    key: 'timber-not-shed',
    when: [
      { option: 'roof', values: ['shed'] },
      { option: 'facade', values: ['timber-imitation'] },
    ],
    message: t(
      'Имитация бруса — фасад для традиционных двускатных домов; с односкатной кровлей мы её не сочетаем. Выберите планкен или фиброцемент.',
      'Timber imitation suits traditional gabled houses; we do not pair it with a shed roof. Choose planken or fibre cement.',
    ),
  },
]
