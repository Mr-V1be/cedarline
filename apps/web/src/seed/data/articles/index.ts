import type { ArticleTopic } from '@/modules/articles/domain/article'

import { t, type Localized } from '../localized'
import { ARTICLES_EN } from './content-en'
import { ARTICLES_RU } from './content-ru'

/** Schemes drawn from the site's data (see `schemes.ts`), with the caption each one carries. */
export const SCHEME_ALTS = {
  'wall-section': t(
    'Схема: разрез наружной стены по слоям, толщины в миллиметрах',
    'Scheme: section of the exterior wall by layer, thicknesses in millimetres',
  ),
  'pile-foundation': t(
    'Схема: винтовые сваи под обвязкой и лагами пола',
    'Scheme: screw piles under the ring beam and floor joists',
  ),
  'insulation-compare': t(
    'Схема: стена с утеплителем 150 и 200 мм в одном масштабе',
    'Scheme: the wall with 150 and 200 mm of insulation at one scale',
  ),
} as const satisfies Record<string, Localized>

export type SchemeName = keyof typeof SCHEME_ALTS

export const isSchemeName = (value: string): value is SchemeName => value in SCHEME_ALTS

/**
 * An article picture: a render of the scene or one of the schemes. Covers are pictures; in the
 * text a line `{{figure:render:<name>}}` or `{{figure:scheme:<name>}}` places one as a figure.
 */
export type ArticlePicture =
  | { readonly kind: 'render'; readonly name: string }
  | { readonly kind: 'scheme'; readonly name: SchemeName }

export interface ArticleSeed {
  readonly slug: string
  readonly topic: ArticleTopic
  readonly publishedAt: string
  readonly title: Localized
  readonly excerpt: Localized
  readonly body: Localized
  readonly cover: ArticlePicture
  /** Related catalog projects, by slug. */
  readonly projects: readonly string[]
}

const body = (slug: string): Localized => {
  const ru = ARTICLES_RU[slug]
  const en = ARTICLES_EN[slug]
  if (ru === undefined || en === undefined) throw new Error(`Article ${slug} has no body`)
  return { ru, en }
}

export const ARTICLES: readonly ArticleSeed[] = [
  {
    slug: 'choosing-a-project',
    topic: 'design',
    publishedAt: '2026-09-29',
    title: t('Как выбрать проект каркасного дома', 'How to choose a frame house project'),
    excerpt: t(
      'Площадь на человека, один этаж или мансарда, участок и стороны света, комплектация и бюджет — по порядку, с фильтрами каталога и конфигуратором.',
      'Floor area per person, one storey or an attic, the plot and the points of the compass, package and budget — step by step, with the catalogue filters and the configurator.',
    ),
    body: body('choosing-a-project'),
    cover: { kind: 'render', name: 'pikhta-m-evening' },
    projects: ['sosny', 'pikhta-m', 'yasen'],
  },
  {
    slug: 'how-we-build',
    topic: 'construction',
    publishedAt: '2026-09-22',
    title: t('Как мы строим: от заявки до ключей', 'How we build: from request to keys'),
    excerpt: t(
      'Шесть этапов от договора до сдачи: что делаем в цеху, что на участке и что нужно от вас.',
      'Six stages from contract to handover: what happens in the workshop, what on site, and what we need from you.',
    ),
    body: body('how-we-build'),
    cover: { kind: 'render', name: 'listvennitsa-aerial' },
    projects: ['listvennitsa', 'kedr'],
  },
  {
    slug: 'insulation-150-or-200',
    topic: 'technology',
    publishedAt: '2026-09-15',
    title: t('Утепление 150 или 200 мм: что выбрать', 'Insulation 150 or 200 mm: which to choose'),
    excerpt: t(
      'Обе стены проходят норму для Ленинградской области. Разбираем, кому нужны 200 мм, а кому хватит 150, — с цифрами теплопотерь и сметы.',
      'Both walls meet the standard for the Leningrad region. Who needs 200 mm and who is fine with 150 — with figures for heat loss and the estimate.',
    ),
    body: body('insulation-150-or-200'),
    cover: { kind: 'render', name: 'listvennitsa-evening' },
    projects: ['sosny', 'listvennitsa'],
  },
  {
    slug: 'frame-technology',
    topic: 'technology',
    publishedAt: '2026-09-08',
    title: t(
      'Технология каркаса: как устроен дом из дерева и утеплителя',
      'Frame technology: how a house of timber and insulation is built',
    ),
    excerpt: t(
      'Скелет из сухой доски, утеплитель, две мембраны и вентзазор: из чего собран каркасный дом, почему его стена тоньше бревенчатой и теплее её и что делает цех.',
      'A skeleton of dry timber, insulation, two membranes and a ventilated gap: what a frame house is made of, why its wall is thinner and warmer than a log wall, and what the workshop does.',
    ),
    body: body('frame-technology'),
    cover: { kind: 'scheme', name: 'wall-section' },
    projects: ['sosny', 'pikhta'],
  },
  {
    slug: 'estimate-explained',
    topic: 'money',
    publishedAt: '2026-08-25',
    title: t(
      'Как считается смета каркасного дома',
      'How the estimate of a frame house is calculated',
    ),
    excerpt: t(
      'Объём из модели дома, умноженный на расценку производства, — по каждой статье. Откуда берутся квадратные метры, что входит в комплектации и как считается срок.',
      'A quantity from the house model times a factory rate, line by line. Where the square metres come from, what the packages include and how the schedule is worked out.',
    ),
    body: body('estimate-explained'),
    cover: { kind: 'render', name: 'kedr-front' },
    projects: ['kedr', 'yasen'],
  },
  {
    slug: 'choosing-a-roof',
    topic: 'design',
    publishedAt: '2026-08-11',
    title: t('Двускатная, односкатная или ломаная кровля', 'Gable, shed or gambrel roof'),
    excerpt: t(
      'Как форма кровли влияет на второй этаж, цену и снег — и когда какая подходит.',
      'How the roof shape affects the upper floor, the price and snow, and which suits what.',
    ),
    body: body('choosing-a-roof'),
    cover: { kind: 'render', name: 'yasen-aerial' },
    projects: ['yasen', 'mozhzhevelnik', 'sosny'],
  },
  {
    slug: 'screw-piles',
    topic: 'construction',
    publishedAt: '2026-07-28',
    title: t('Фундамент на винтовых сваях', 'A foundation on screw piles'),
    excerpt: t(
      'Почему дом стоит на сваях, как их ставят за день и когда сваи не подходят.',
      'Why the house stands on piles, how they go in within a day, and when piles do not fit.',
    ),
    body: body('screw-piles'),
    cover: { kind: 'scheme', name: 'pile-foundation' },
    projects: ['pikhta', 'bereza'],
  },
  {
    slug: 'sauna-frame',
    topic: 'sauna',
    publishedAt: '2026-07-14',
    title: t('Каркасная баня: что важно в парной', 'A frame sauna: what matters in the steam room'),
    excerpt: t(
      'Фольга вместо плёнки, зазор под вагонкой, размеры парной, печь и вентиляция — чем парная отличается от комнаты.',
      'Foil instead of film, a gap behind the lining, steam room size, the stove and ventilation: how a steam room differs from a room.',
    ),
    body: body('sauna-frame'),
    cover: { kind: 'render', name: 'olkha-evening' },
    projects: ['olkha', 'bereza'],
  },
]
