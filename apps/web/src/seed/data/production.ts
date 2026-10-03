import type { StageIllustration } from '@/modules/production/domain/production'

import { t, type Localized } from './localized'

/** The production page: how a house is made, stage by stage. */
export const PRODUCTION: {
  readonly title: Localized
  readonly lead: Localized
  readonly stages: ReadonlyArray<{
    readonly illustration: StageIllustration
    readonly place: 'workshop' | 'site'
    readonly title: Localized
    readonly text: Localized
  }>
} = {
  title: t('Производство', 'Production'),
  lead: t(
    'Дом делается в цеху по чертежу из той же модели, что вы настраиваете на сайте, и собирается на участке за одну-две недели.',
    'A house is made in the workshop to drawings from the same model you configure on the site, and assembled on the plot in one or two weeks.',
  ),
  stages: [
    {
      illustration: 'design',
      place: 'workshop',
      title: t('Чертёж и раскладка', 'Drawing and layout'),
      text: t(
        'Из конфигурации получаются рабочие чертежи: планы, разрезы, раскладка панелей и спецификация каждой детали.',
        'The configuration becomes working drawings: plans, sections, the panel layout and a specification of every part.',
      ),
    },
    {
      illustration: 'cutting',
      place: 'workshop',
      title: t('Раскрой на станке', 'Machine cutting'),
      text: t(
        'Доску камерной сушки режут по спецификации; каждая деталь получает метку с номером панели.',
        'Kiln-dried timber is cut to the specification; every part is labelled with its panel number.',
      ),
    },
    {
      illustration: 'panels',
      place: 'workshop',
      title: t('Сборка панелей', 'Panel assembly'),
      text: t(
        'На столе собирают каркас, укладывают утеплитель и мембраны, ставят окна. Панель выходит из цеха закрытой.',
        'On the table the frame is assembled, insulation and membranes are laid and windows fitted. A panel leaves the workshop closed.',
      ),
    },
    {
      illustration: 'inspection',
      place: 'workshop',
      title: t('Контроль и маркировка', 'Inspection and marking'),
      text: t(
        'Геометрию и узлы проверяют по чек-листу, панели маркируют в порядке монтажа и упаковывают от влаги.',
        'Geometry and joints are checked against a checklist; panels are marked in assembly order and wrapped against moisture.',
      ),
    },
    {
      illustration: 'delivery',
      place: 'site',
      title: t('Доставка', 'Delivery'),
      text: t(
        'Комплект едет на участок одной-двумя машинами вместе с бригадой; к этому времени сваи уже стоят.',
        'The kit goes to the plot on one or two trucks with the crew; by then the piles are already in.',
      ),
    },
    {
      illustration: 'assembly',
      place: 'site',
      title: t('Монтаж на сваях', 'Assembly on piles'),
      text: t(
        'Панели ставят на обвязку по маркировке, затем перекрытия и кровля. Дом закрыт от погоды в первую неделю.',
        'Panels go onto the strapping beam by their marks, then the floors and the roof. The house is weathertight in the first week.',
      ),
    },
  ],
}
