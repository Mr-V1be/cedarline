import { t, type Localized } from './localized'

/** Built houses: fictional handovers in real settlements of the building region. */
export const BUILT_OBJECTS: ReadonlyArray<{
  slug: string
  project: string
  title: Localized
  settlement: Localized
  region: Localized
  year: number
  /** [longitude, latitude] */
  location: [number, number]
  render: string
  /** Colour the house was built in, for its render. */
  facadeColor: string
}> = [
  {
    slug: 'sosny-roshchino',
    project: 'sosny',
    title: t('Дом «Сосны» у озера', '“Pines” house by the lake'),
    settlement: t('Рощино', 'Roshchino'),
    region: t('Ленинградская область', 'Leningrad Oblast'),
    year: 2025,
    location: [29.6013, 60.2512],
    render: 'built-sosny-roshchino',
    facadeColor: '#5e6650',
  },
  {
    slug: 'kedr-toksovo',
    project: 'kedr',
    title: t('Дом «Кедр» для семьи с детьми', '“Cedar” house for a family'),
    settlement: t('Токсово', 'Toksovo'),
    region: t('Ленинградская область', 'Leningrad Oblast'),
    year: 2025,
    location: [30.5236, 60.1535],
    render: 'built-kedr-toksovo',
    facadeColor: '#c08a4b',
  },
  {
    slug: 'olkha-sosnovo',
    project: 'olkha',
    title: t('Баня «Ольха» на склоне', '“Alder” sauna on a slope'),
    settlement: t('Сосново', 'Sosnovo'),
    region: t('Ленинградская область', 'Leningrad Oblast'),
    year: 2024,
    location: [30.2393, 60.5528],
    render: 'built-olkha-sosnovo',
    facadeColor: '#d2a86e',
  },
  {
    slug: 'mozhzhevelnik-luga',
    project: 'mozhzhevelnik',
    title: t('Гостевой дом «Можжевельник» у реки', '“Juniper” guest house by the river'),
    settlement: t('Луга', 'Luga'),
    region: t('Ленинградская область', 'Leningrad Oblast'),
    year: 2026,
    location: [29.8461, 58.7375],
    render: 'built-mozhzhevelnik-luga',
    facadeColor: '#8e9b8a',
  },
  {
    slug: 'yasen-kirovsk',
    project: 'yasen',
    title: t('Дом «Ясень» с мансардой', '“Ash” house with an attic floor'),
    settlement: t('Кировск', 'Kirovsk'),
    region: t('Ленинградская область', 'Leningrad Oblast'),
    year: 2026,
    location: [30.9958, 59.8781],
    render: 'built-yasen-kirovsk',
    facadeColor: '#6c6f6c',
  },
]

export const SITE = {
  phone: '+7 (812) 000-46-10',
  email: 'hello@kedrovnik.example',
  address: t(
    'Ленинградская область, Тосненский район, производственная зона «Северная», 4',
    'Leningrad Oblast, Tosno District, Severnaya industrial zone, 4',
  ),
  hours: t('Пн–пт 9:00–19:00, сб 10:00–16:00', 'Mon–Fri 9:00–19:00, Sat 10:00–16:00'),
  region: t(
    'Санкт-Петербург и Ленинградская область, до 250 км',
    'St Petersburg and Leningrad Oblast, within 250 km',
  ),
}

export const HOME = {
  hero: 'sosny',
  featured: ['sosny', 'listvennitsa', 'kedr', 'yasen', 'bereza', 'mozhzhevelnik'],
  builtObjects: [
    'sosny-roshchino',
    'kedr-toksovo',
    'olkha-sosnovo',
    'mozhzhevelnik-luga',
    'yasen-kirovsk',
  ],
}
