# Источники и лицензии

## Шрифты

| Ассет    | Источник                                                                  | Лицензия                  |
| -------- | ------------------------------------------------------------------------- | ------------------------- |
| Manrope  | The Manrope Project Authors, пакет `@fontsource-variable/manrope` (npm)   | SIL Open Font License 1.1 |
| Literata | The Literata Project Authors, пакет `@fontsource-variable/literata` (npm) | SIL Open Font License 1.1 |

Шрифты хранятся на собственном сервере (self-hosted), сторонние CDN не используются.

## Иконки

| Ассет          | Источник                                      | Лицензия |
| -------------- | --------------------------------------------- | -------- |
| Phosphor Icons | Phosphor Icons, пакет `@phosphor-icons/react` | MIT      |

## Изображения

Все изображения домов в каталоге, на главной и в CMS — рендеры собственной 3D-сцены сайта
(`apps/web/seed-assets/renders`, генерируются скриптом `render:covers` из данных проектов).
Фотографии и стоковые изображения не используются.

## Окружение и материалы 3D-сцены

Небо, освещение и PBR-текстуры сцены скачаны скриптом `pnpm --filter @kedrovnik/web scene:assets`
(`apps/web/scripts/build-scene-assets.ts`) с официальных сайтов библиотек, уменьшены и сжаты
в KTX2 (Basis Universal) и WebP. Результат лежит в `apps/web/public/scene`. Все ассеты — CC0 1.0
(общественное достояние): коммерческое использование без ограничений, указание авторства не
требуется, но мы его приводим.

| Назначение в сцене               | Ассет                                   | Источник                                                                   | Авторы                           | Лицензия |
| -------------------------------- | --------------------------------------- | -------------------------------------------------------------------------- | -------------------------------- | -------- |
| Дневное небо и освещение (HDRI)  | Kloofendal 48d Partly Cloudy (Pure Sky) | [Poly Haven](https://polyhaven.com/a/kloofendal_48d_partly_cloudy_puresky) | Greg Zaal, Jarod Guest           | CC0 1.0  |
| Вечернее небо и освещение (HDRI) | Qwantani Dusk 2 (Pure Sky)              | [Poly Haven](https://polyhaven.com/a/qwantani_dusk_2_puresky)              | Greg Zaal, Jarod Guest           | CC0 1.0  |
| Трава участка                    | Grass 001                               | [ambientCG](https://ambientcg.com/view?id=Grass001)                        | ambientCG                        | CC0 1.0  |
| Гравийная отсыпка                | Gravel Floor                            | [Poly Haven](https://polyhaven.com/a/gravel_floor)                         | Jenelle van Heerden, Matterfield | CC0 1.0  |
| Садовая дорожка                  | Grey Stone Path                         | [Poly Haven](https://polyhaven.com/a/grey_stone_path)                      | Amal Kumar                       | CC0 1.0  |
| Настил террасы                   | Oak Wood Planks                         | [Poly Haven](https://polyhaven.com/a/oak_wood_planks)                      | Dimitrios Savva                  | CC0 1.0  |
| Цоколь                           | Brushed Concrete                        | [Poly Haven](https://polyhaven.com/a/brushed_concrete)                     | Dario Barresi, Dimitrios Savva   | CC0 1.0  |
| Фасад: планкен                   | Brown Planks 05                         | [Poly Haven](https://polyhaven.com/a/brown_planks_05)                      | Rob Tuytel                       | CC0 1.0  |
| Фасад: имитация бруса            | Weathered Plank Siding                  | [Poly Haven](https://polyhaven.com/a/weathered_plank_siding)               | Dimitrios Savva                  | CC0 1.0  |
| Фасад: фиброцемент               | Grey Plaster                            | [Poly Haven](https://polyhaven.com/a/grey_plaster)                         | Rob Tuytel                       | CC0 1.0  |
| Кровля: металл                   | Box Profile Metal Sheet                 | [Poly Haven](https://polyhaven.com/a/box_profile_metal_sheet)              | Amal Kumar                       | CC0 1.0  |

Хвойные деревья, трава и рельеф участка строятся процедурно в коде сцены
(`apps/web/src/modules/house-3d/scene`), моделей из сторонних библиотек нет.

## Программные компоненты в `public`

| Ассет                                             | Источник                                                | Лицензия   |
| ------------------------------------------------- | ------------------------------------------------------- | ---------- |
| Транскодер Basis Universal (`public/scene/basis`) | пакет `three` (`examples/jsm/libs/basis`), Binomial LLC | Apache 2.0 |

Логотип и чертёжные иллюстрации (планы, разрез стены, график) нарисованы в коде проекта.
