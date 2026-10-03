# Источники и лицензии

## Шрифты

| Ассет    | Источник                                                                  | Лицензия                  |
| -------- | ------------------------------------------------------------------------- | ------------------------- |
| Manrope  | The Manrope Project Authors, пакет `@fontsource-variable/manrope` (npm)   | SIL Open Font License 1.1 |
| Literata | The Literata Project Authors, пакет `@fontsource-variable/literata` (npm) | SIL Open Font License 1.1 |

Шрифты хранятся на собственном сервере (self-hosted), сторонние CDN не используются.
Заголовочный Literata на сайте — статические начертания 500 (`apps/web/assets/fonts/web`),
полученные из вариативных файлов пакета `@fontsource-variable/literata` (подмножества latin
и cyrillic) инструментом `fontTools varLib.instancer` (`wght=500`); лицензия та же, SIL OFL 1.1.

Для КП в PDF (`apps/web/assets/fonts`) — статические начертания тех же шрифтов: Manrope 400 и
600, Literata 500. Они получены из вариативных файлов репозитория Google Fonts
(`ofl/manrope/Manrope[wght].ttf`, `ofl/literata/Literata[opsz,wght].ttf`) инструментом
`fontTools varLib.instancer`; лицензия SIL OFL 1.1 сохранена, её тексты лежат рядом
(`OFL-Manrope.txt`, `OFL-Literata.txt`).

## Иконки

| Ассет          | Источник                                      | Лицензия |
| -------------- | --------------------------------------------- | -------- |
| Phosphor Icons | Phosphor Icons, пакет `@phosphor-icons/react` | MIT      |

## Изображения

Все изображения домов в каталоге, на главной и в CMS — рендеры собственной 3D-сцены сайта
(`apps/web/seed-assets/renders`, генерируются скриптом `render:covers` из данных проектов).
Фотографии и стоковые изображения не используются.

## Окружение, материалы и деревья 3D-сцены

Небо, освещение, PBR-текстуры и модели деревьев скачаны скриптом
`pnpm --filter @kedrovnik/web scene:assets` (`apps/web/scripts/scene-assets`) с официальных сайтов
библиотек, уменьшены и сжаты в KTX2 (Basis Universal) и WebP. Результат лежит в
`apps/web/public/scene`. Все ассеты — CC0 1.0 (общественное достояние): коммерческое
использование без ограничений, указание авторства не требуется, но мы его приводим.

| Назначение в сцене               | Ассет                                   | Источник                                                                   | Авторы                               | Лицензия |
| -------------------------------- | --------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------ | -------- |
| Дневное небо и освещение (HDRI)  | Kloofendal 48d Partly Cloudy (Pure Sky) | [Poly Haven](https://polyhaven.com/a/kloofendal_48d_partly_cloudy_puresky) | Greg Zaal, Jarod Guest               | CC0 1.0  |
| Вечернее небо и освещение (HDRI) | Industrial Sunset 02 (Pure Sky)         | [Poly Haven](https://polyhaven.com/a/industrial_sunset_02_puresky)         | Jarod Guest, Sergej Majboroda        | CC0 1.0  |
| Газон                            | Grass 001                               | [ambientCG](https://ambientcg.com/view?id=Grass001)                        | ambientCG                            | CC0 1.0  |
| Лесная подстилка на опушке       | Forest Leaves 04                        | [Poly Haven](https://polyhaven.com/a/forest_leaves_04)                     | Rob Tuytel                           | CC0 1.0  |
| Гравийная дорожка                | Gravel Floor 02                         | [Poly Haven](https://polyhaven.com/a/gravel_floor_02)                      | Jenelle van Heerden, Dimitrios Savva | CC0 1.0  |
| Отмостка                         | Concrete Pavement                       | [Poly Haven](https://polyhaven.com/a/concrete_pavement)                    | Charlotte Baglioni                   | CC0 1.0  |
| Настил террасы и крыльца         | Oak Wood Planks                         | [Poly Haven](https://polyhaven.com/a/oak_wood_planks)                      | Dimitrios Savva                      | CC0 1.0  |
| Цоколь                           | Brushed Concrete                        | [Poly Haven](https://polyhaven.com/a/brushed_concrete)                     | Dario Barresi, Dimitrios Savva       | CC0 1.0  |
| Фасад: планкен                   | Brown Planks 05                         | [Poly Haven](https://polyhaven.com/a/brown_planks_05)                      | Rob Tuytel                           | CC0 1.0  |
| Фасад: имитация бруса            | Weathered Plank Siding                  | [Poly Haven](https://polyhaven.com/a/weathered_plank_siding)               | Dimitrios Savva                      | CC0 1.0  |
| Фасад: фиброцемент               | Grey Plaster                            | [Poly Haven](https://polyhaven.com/a/grey_plaster)                         | Rob Tuytel                           | CC0 1.0  |
| Кровля: металл                   | Box Profile Metal Sheet                 | [Poly Haven](https://polyhaven.com/a/box_profile_metal_sheet)              | Amal Kumar                           | CC0 1.0  |
| Ели (две формы)                  | Fir Sapling Medium (a, b)               | [Poly Haven](https://polyhaven.com/a/fir_sapling_medium)                   | Rob Tuytel, Rico Cilliers            | CC0 1.0  |
| Сосны (две формы)                | Pine Sapling Medium (a, b)              | [Poly Haven](https://polyhaven.com/a/pine_sapling_medium)                  | Rob Tuytel, Rico Cilliers            | CC0 1.0  |

Деревья в сцене — импостеры: скрипт ассетов извлекает каждую модель из файла glTF
(glTF Transform, MIT), снимает её с 64 направлений полусферы в атлас цвета и нормалей
(headless Chromium, программный рендер) и сжимает атлас в KTX2. Лес собирается из этих
атласов инстансингом; рельеф, переход газона в подстилку, отмостка и дорожка строятся в коде
сцены (`apps/web/src/modules/house-3d/scene`).

## Карта

| Что                                    | Источник                                                             | Лицензия                     |
| -------------------------------------- | -------------------------------------------------------------------- | ---------------------------- |
| Картографические данные                | © участники [OpenStreetMap](https://www.openstreetmap.org/copyright) | ODbL 1.0                     |
| Векторные тайлы и стили Positron, Dark | [OpenFreeMap](https://openfreemap.org), схема OpenMapTiles           | данные ODbL, стили BSD/CC-BY |
| Библиотека карты                       | [MapLibre GL JS](https://maplibre.org), пакет `maplibre-gl`          | BSD 3-Clause                 |

Атрибуция показывается на самой карте. MapLibre отдаётся сайтом как ES-модули из
`node_modules` (маршрут `/vendor/maplibre/<версия>/…`), тайлы и стили — с серверов OpenFreeMap.

## Программные компоненты в `public`

| Ассет                                             | Источник                                                | Лицензия   |
| ------------------------------------------------- | ------------------------------------------------------- | ---------- |
| Транскодер Basis Universal (`public/scene/basis`) | пакет `three` (`examples/jsm/libs/basis`), Binomial LLC | Apache 2.0 |

Логотип и чертёжные иллюстрации (планы, разрез стены, график) нарисованы в коде проекта.
