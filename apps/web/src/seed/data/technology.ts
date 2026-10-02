import type { LayerRole } from '@/modules/technology/domain/wall-assembly'

import { t, type Localized } from './localized'

/** Exterior wall, outside in. Conductivities per SP 50.13330 for operating conditions B. */
export const WALL_LAYERS: ReadonlyArray<{
  key: string
  name: Localized
  role: LayerRole
  thickness: number
  conductivity?: number
}> = [
  { key: 'cladding', name: t('Фасадная доска', 'Facade boards'), role: 'cladding', thickness: 20 },
  {
    key: 'vent-gap',
    name: t('Вентилируемый зазор на контррейке', 'Ventilated gap on counter-battens'),
    role: 'air-gap',
    thickness: 30,
  },
  {
    key: 'wind-barrier',
    name: t('Ветрозащитная мембрана', 'Wind barrier membrane'),
    role: 'membrane',
    thickness: 1,
  },
  {
    key: 'frame',
    name: t(
      'Каркас из камерной сушки и минеральная вата',
      'Kiln-dried timber frame with mineral wool',
    ),
    role: 'insulation',
    thickness: 150,
    conductivity: 0.045,
  },
  {
    key: 'vapour-barrier',
    name: t('Пароизоляция', 'Vapour barrier'),
    role: 'membrane',
    thickness: 1,
  },
  {
    key: 'service-void',
    name: t('Инсталляционный зазор', 'Service void'),
    role: 'batten',
    thickness: 25,
  },
  {
    key: 'lining',
    name: t('Внутренняя обшивка, хвойная доска', 'Softwood interior lining'),
    role: 'lining',
    thickness: 14,
    conductivity: 0.18,
  },
]

export const INSULATION_OPTIONS = [150, 200] as const
