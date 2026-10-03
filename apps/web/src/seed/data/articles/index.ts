import type { ArticleTopic } from '@/modules/articles/domain/article'

import { t, type Localized } from '../localized'
import { ARTICLES_EN } from './content-en'
import { ARTICLES_RU } from './content-ru'

/** Article covers: a render of the scene or one of the schemes drawn from the site's data. */
export type ArticleCover =
  | { readonly kind: 'render'; readonly name: string }
  | { readonly kind: 'scheme'; readonly name: 'wall-section' | 'pile-foundation' }

export interface ArticleSeed {
  readonly slug: string
  readonly topic: ArticleTopic
  readonly publishedAt: string
  readonly title: Localized
  readonly excerpt: Localized
  readonly body: Localized
  readonly cover: ArticleCover
  readonly coverAlt: Localized
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
    slug: 'how-we-build',
    topic: 'construction',
    publishedAt: '2026-09-22',
    title: t('Как мы строим: от заявки до ключей', 'How we build: from request to keys'),
    excerpt: t(
      'Шесть этапов от договора до сдачи: что делаем в цеху, что на участке и когда дом закрыт от погоды.',
      'Six stages from contract to handover: what happens in the workshop, what on site, and when the house is weather-tight.',
    ),
    body: body('how-we-build'),
    cover: { kind: 'render', name: 'listvennitsa-aerial' },
    coverAlt: t('Дом «Лиственница» сверху', 'The “Larch” house from above'),
    projects: ['listvennitsa', 'kedr'],
  },
  {
    slug: 'wall-assembly',
    topic: 'technology',
    publishedAt: '2026-09-08',
    title: t('Из чего состоит стена каркасного дома', 'What the wall of a frame house is made of'),
    excerpt: t(
      'Семь слоёв от фасада до обшивки: зачем нужен вентзазор, чем ветрозащита отличается от пароизоляции и когда брать 200 мм утеплителя.',
      'Seven layers from cladding to lining: why the ventilated gap matters, how a wind barrier differs from a vapour barrier, and when to choose 200 mm of insulation.',
    ),
    body: body('wall-assembly'),
    cover: { kind: 'scheme', name: 'wall-section' },
    coverAlt: t(
      'Схема: разрез наружной стены по слоям',
      'Scheme: section of the exterior wall by layer',
    ),
    projects: ['sosny', 'pikhta'],
  },
  {
    slug: 'estimate-explained',
    topic: 'money',
    publishedAt: '2026-08-25',
    title: t('Из чего складывается цена дома', 'What the price of a house is made of'),
    excerpt: t(
      'Смета по статьям вместо «от и до»: объёмы из модели дома, расценки производства и что меняет итог.',
      'An itemised estimate instead of a price range: quantities from the house model, the factory rates and what changes the total.',
    ),
    body: body('estimate-explained'),
    cover: { kind: 'render', name: 'kedr-front' },
    coverAlt: t('Дом «Кедр», вид с угла участка', 'The “Cedar” house from the corner of the plot'),
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
    coverAlt: t(
      'Дом «Ясень» с ломаной кровлей сверху',
      'The “Ash” house with a gambrel roof from above',
    ),
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
    coverAlt: t(
      'Схема: винтовые сваи под обвязкой и лагами',
      'Scheme: screw piles under the strapping beam and joists',
    ),
    projects: ['pikhta', 'bereza'],
  },
  {
    slug: 'sauna-frame',
    topic: 'sauna',
    publishedAt: '2026-07-14',
    title: t('Каркасная баня: что важно в парной', 'A frame sauna: what matters in the steam room'),
    excerpt: t(
      'Фольга вместо плёнки, зазор под вагонкой, дымоход и вентиляция — чем парная отличается от комнаты.',
      'Foil instead of film, a gap behind the lining, the flue and ventilation: how a steam room differs from a room.',
    ),
    body: body('sauna-frame'),
    cover: { kind: 'render', name: 'olkha-evening' },
    coverAlt: t('Баня «Ольха» вечером', 'The “Alder” sauna in the evening'),
    projects: ['olkha', 'bereza'],
  },
]
