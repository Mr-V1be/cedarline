import { t, type Localized } from './localized'

/** Region of every handover in the demo: the building region of the company. */
const REGION = t('Ленинградская область', 'Leningrad Oblast')

export interface BuiltObjectSeed {
  readonly slug: string
  readonly project: string
  readonly title: Localized
  readonly settlement: Localized
  readonly region: Localized
  readonly year: number
  /** [longitude, latitude] of the settlement: plots are not shown precisely. */
  readonly location: readonly [number, number]
  /** Name of the cover render in seed-assets/renders. */
  readonly render: string
  /** Colour the house was built in, for its render. */
  readonly facadeColor: string
}

const built = (
  slug: string,
  project: string,
  title: Localized,
  settlement: Localized,
  year: number,
  location: readonly [number, number],
  facadeColor: string,
): BuiltObjectSeed => ({
  slug,
  project,
  title,
  settlement,
  region: REGION,
  year,
  location,
  render: `built-${slug}`,
  facadeColor,
})

/** Built houses: fictional handovers in real settlements of the building region. */
export const BUILT_OBJECTS: readonly BuiltObjectSeed[] = [
  built(
    'sosny-roshchino',
    'sosny',
    t('Дом «Сосны» у озера', '“Pines” house by the lake'),
    t('Рощино', 'Roshchino'),
    2025,
    [29.6013, 60.2512],
    '#5e6650',
  ),
  built(
    'kedr-toksovo',
    'kedr',
    t('Дом «Кедр» для семьи с детьми', '“Cedar” house for a family'),
    t('Токсово', 'Toksovo'),
    2025,
    [30.5236, 60.1535],
    '#c08a4b',
  ),
  built(
    'olkha-sosnovo',
    'olkha',
    t('Баня «Ольха» на склоне', '“Alder” sauna on a slope'),
    t('Сосново', 'Sosnovo'),
    2024,
    [30.2393, 60.5528],
    '#d2a86e',
  ),
  built(
    'mozhzhevelnik-luga',
    'mozhzhevelnik',
    t('Гостевой дом «Можжевельник» у реки', '“Juniper” guest house by the river'),
    t('Луга', 'Luga'),
    2026,
    [29.8461, 58.7375],
    '#8e9b8a',
  ),
  built(
    'yasen-kirovsk',
    'yasen',
    t('Дом «Ясень» с мансардой', '“Ash” house with an attic floor'),
    t('Кировск', 'Kirovsk'),
    2026,
    [30.9958, 59.8781],
    '#6c6f6c',
  ),
  built(
    'listvennitsa-zelenogorsk',
    'listvennitsa',
    t('Дом «Лиственница» в сосновом бору', '“Larch” house in a pine wood'),
    t('Зеленогорск', 'Zelenogorsk'),
    2024,
    [29.6981, 60.1958],
    '#3a3e3c',
  ),
  built(
    'pikhta-komarovo',
    'pikhta',
    t('Дом «Пихта» для выходных', '“Fir” weekend house'),
    t('Комарово', 'Komarovo'),
    2023,
    [29.8071, 60.1836],
    '#d2a86e',
  ),
  built(
    'bereza-ilichevo',
    'bereza',
    t('Баня «Берёза» с купелью', '“Birch” sauna with a plunge pool'),
    t('Ильичёво', 'Ilyichevo'),
    2025,
    [29.9163, 60.2331],
    '#3a3e3c',
  ),
  built(
    'ryabina-vaskelovo',
    'ryabina',
    t('Гостевой дом «Рябина» у леса', '“Rowan” guest house by the forest'),
    t('Васкелово', 'Vaskelovo'),
    2024,
    [30.3983, 60.3903],
    '#7b3226',
  ),
  built(
    'sosny-agalatovo',
    'sosny',
    t('Дом «Сосны» на просторном участке', '“Pines” house on a large plot'),
    t('Агалатово', 'Agalatovo'),
    2023,
    [30.2903, 60.2129],
    '#a7ada6',
  ),
  built(
    'kedr-lembolovo',
    'kedr',
    t('Дом «Кедр» у озера', '“Cedar” house by the lake'),
    t('Лемболово', 'Lembolovo'),
    2022,
    [30.3271, 60.3385],
    '#d2a86e',
  ),
  built(
    'pikhta-m-kuzmolovsky',
    'pikhta-m',
    t('Дом «Пихта М» с мансардой', '“Fir M” house with an attic floor'),
    t('Кузьмоловский', 'Kuzmolovsky'),
    2025,
    [30.4575, 60.1153],
    '#c08a4b',
  ),
  built(
    'yasen-2-vsevolozhsk',
    'yasen-2',
    t('Дом «Ясень-2» в посёлке', '“Ash 2” house in a village'),
    t('Всеволожск', 'Vsevolozhsk'),
    2026,
    [30.6372, 60.0204],
    '#e4e1d8',
  ),
  built(
    'bereza-koltushi',
    'bereza',
    t('Баня «Берёза» при доме', '“Birch” sauna next to the house'),
    t('Колтуши', 'Koltushi'),
    2023,
    [30.6331, 59.9283],
    '#5e6650',
  ),
  built(
    'olkha-otradnoe',
    'olkha',
    t('Баня «Ольха» на берегу Невы', '“Alder” sauna on the Neva'),
    t('Отрадное', 'Otradnoe'),
    2022,
    [30.8167, 59.7733],
    '#6e4a2e',
  ),
  built(
    'listvennitsa-mga',
    'listvennitsa',
    t('Дом «Лиственница» на опушке', '“Larch” house at the forest edge'),
    t('Мга', 'Mga'),
    2025,
    [31.0597, 59.7503],
    '#b98b5a',
  ),
  built(
    'kedr-gatchina',
    'kedr',
    t('Дом «Кедр» в Гатчинском районе', '“Cedar” house near Gatchina'),
    t('Гатчина', 'Gatchina'),
    2024,
    [30.1276, 59.5654],
    '#7b3226',
  ),
  built(
    'pikhta-vyritsa',
    'pikhta',
    t('Дом «Пихта» у реки Оредеж', '“Fir” house on the Oredezh river'),
    t('Вырица', 'Vyritsa'),
    2023,
    [30.3353, 59.4079],
    '#c08a4b',
  ),
  built(
    'ryabina-siversky',
    'ryabina',
    t('Гостевой дом «Рябина» на даче', '“Rowan” guest house at the dacha'),
    t('Сиверский', 'Siversky'),
    2026,
    [30.0674, 59.3539],
    '#d2a86e',
  ),
  built(
    'mozhzhevelnik-tosno',
    'mozhzhevelnik',
    t(
      'Гостевой дом «Можжевельник» рядом с производством',
      '“Juniper” guest house near the factory',
    ),
    t('Тосно', 'Tosno'),
    2021,
    [30.8772, 59.5401],
    '#2f3331',
  ),
  built(
    'sosny-ropsha',
    'sosny',
    t('Дом «Сосны» среди полей', '“Pines” house among fields'),
    t('Ропша', 'Ropsha'),
    2024,
    [29.8576, 59.7246],
    '#3a3e3c',
  ),
  built(
    'yasen-lebyazhye',
    'yasen',
    t('Дом «Ясень» у Финского залива', '“Ash” house by the Gulf of Finland'),
    t('Лебяжье', 'Lebyazhye'),
    2025,
    [29.4112, 59.9572],
    '#e4e1d8',
  ),
  built(
    'olkha-priozersk',
    'olkha',
    t('Баня «Ольха» на Ладоге', '“Alder” sauna on Lake Ladoga'),
    t('Приозерск', 'Priozersk'),
    2026,
    [30.1292, 61.035],
    '#7b3226',
  ),
  built(
    'listvennitsa-vyborg',
    'listvennitsa',
    t('Дом «Лиственница» на скалах', '“Larch” house on the rocks'),
    t('Выборг', 'Vyborg'),
    2025,
    [28.7522, 60.7093],
    '#5e6650',
  ),
]
