# Cedarline

Сайт производителя каркасных домов и бань: каталог проектов с фильтрами, страница проекта
с 3D-моделью, планировками по уровням, комплектациями и сроками, 3D-конфигуратор с живой
сметой, сохранением по ссылке, КП в PDF и заявкой, карта построенных домов, калькулятор
ипотеки и рассрочки от ключевой ставки ЦБ, статьи, страница о производстве, контакты, CMS для
контент-менеджера и менеджера продаж. Демо-версия: компания и данные вымышленные.

## Состав репозитория

| Путь                    | Что внутри                                                                                         |
| ----------------------- | -------------------------------------------------------------------------------------------------- |
| `packages/house`        | Параметрическая модель дома: спецификация, каркас, сетка для 3D, ведомость объёмов, обмерные планы |
| `packages/pricing`      | Смета и график: деньги в копейках, тарифная сетка, комплектации, критический путь этапов           |
| `packages/configurator` | Конфигуратор: опции, правила совместимости, состояние выбора, живая смета, коды ссылок             |
| `apps/web`              | Next.js 16 (App Router) + Payload CMS 3 + PostgreSQL/PostGIS: сайт, CMS, демо-контент              |
| `tools/code-shape`      | Гейт формы кода: файл ≤ 700 строк, папка ≤ 15 файлов исходников                                    |
| `tools/crm-mock`        | Мок внешней CRM в REST-диалекте Битрикс24 (локально в Docker Compose)                              |
| `tools/stand`           | Локальный демо-стенд: `make stand`, `make status`, `make stop`                                     |
| `tools/load`            | Нагрузочный тест k6 (в Docker-образе `grafana/k6`)                                                 |
| `deploy/`, `Dockerfile` | Продакшен: образы, `docker-compose.prod.yml`, Caddy с автоматическим TLS, бэкапы                   |
| `docs/`                 | Архитектура, производительность, выкатка, материалы кейса и скриншоты вех                          |

Подробно об устройстве — в [docs/architecture.md](docs/architecture.md).

## Запуск локально

Нужны Node 24, pnpm 10 и Docker с Compose.

```bash
cp .env.example .env          # заполнить значения (см. комментарии в файле)
pnpm install
docker compose up -d          # PostGIS 46132, Mailpit: SMTP 46125 и UI 46180, мок CRM 46140
pnpm --filter @cedarline/web migrate
pnpm --filter @cedarline/web seed
pnpm dev                      # http://localhost:46100
```

- Сайт: <http://localhost:46100> (русский), <http://localhost:46100/en> (английский).
- CMS: <http://localhost:46100/admin>.
- Конфигуратор: <http://localhost:46100/configurator>.
- Письма: в демо-режиме (`MAIL_MODE=demo`, по умолчанию) они не покидают сервер — клиент
  после заявки открывает своё письмо по ссылке, все письма видны в CMS в разделе «Демо-почта».
  С `MAIL_MODE=smtp` письма уходят по SMTP; локально — Mailpit: <http://localhost:46180>.
- Мок CRM (лиды, дошедшие до «внешней CRM»): <http://localhost:46140>. Если мок остановлен,
  доставка повторяется сама (очередь задач), а в карточке заявки есть ручной повтор.

### Демо-стенд одной командой

```bash
make stand    # Docker-сервисы, миграции, сид на пустой базе, продакшен-сборка, сайт на :46100
make status   # что запущено и отвечают ли сайт, CMS и /demo
make stop     # остановить сайт и Docker-сервисы
```

Сайт работает отвязанно от терминала (`setsid`), логи — в `.run/logs/`. Стенд запускается в
демо-режиме (`DEMO_MODE=true`): вход в CMS под любой ролью в один клик со страницы
<http://localhost:46100/demo> (ссылка «Войти в CMS как…» в подвале) и с экрана входа CMS, а
каждую ночь в 03:30 данные возвращаются к сиду — заявки, конфигурации, письма и правки
контента; три заявки-примера с КП и письмами сид создаёт заново. Вручную то же делает `pnpm --filter @cedarline/web demo:reset`. Без `DEMO_MODE`
(по умолчанию) ни страницы `/demo`, ни сброса нет.

### Демо-доступы в CMS

Учётные записи создаёт `seed` (адреса — `apps/web/src/modules/demo/domain/demo-tours.ts`,
пароли — `apps/web/src/seed/data/users.ts`). На демо-стенде их нельзя изменить или удалить:

| Роль             | Логин                       | Пароль                   |
| ---------------- | --------------------------- | ------------------------ |
| Администратор    | `admin@cedarline.example`   | `cedarline-admin-demo`   |
| Контент-менеджер | `content@cedarline.example` | `cedarline-content-demo` |
| Менеджер продаж  | `sales@cedarline.example`   | `cedarline-sales-demo`   |

### Рендеры проектов

Изображения каталога — рендеры собственной 3D-сцены сайта. Они лежат в
`apps/web/seed-assets/renders` и загружаются сидом. Пересоздать их можно при запущенном сайте:

```bash
pnpm --filter @cedarline/web render:covers   # все рендеры; можно указать префиксы: sosny kedr-back
pnpm --filter @cedarline/web seed            # загрузить обновлённые рендеры в медиатеку
```

## Проверки

```bash
pnpm check          # всё сразу: форма кода, типы, линтеры, форматирование, тесты
pnpm gate:shape     # лимиты размеров файлов и папок
pnpm typecheck
pnpm lint           # ESLint (с границами слоёв) и Stylelint (только токены дизайн-системы)
pnpm format:check
pnpm test
```

Замеры производительности (на продакшен-сборке, результаты — в
[docs/performance.md](docs/performance.md)):

```bash
pnpm --filter @cedarline/web perf:lighthouse http://localhost:46100 3   # Lighthouse, мобильный
pnpm --filter @cedarline/web perf:scene http://localhost:46100 /configurator/sosny 3
sh tools/load/run.sh http://localhost:46100                            # нагрузка, k6 в Docker
```

## Видео продукта

Ролики в `docs/case/video` записаны с живого сайта: Playwright снимает короткие дубли (кадры
экрана с отметками времени, видимый указатель), ffmpeg монтирует их в 1920×1080 и 1080×1920.

```bash
pnpm --filter @cedarline/web video:record landscape browse      # и configure; portrait — телефон
pnpm --filter @cedarline/web video:assemble landscape
```

## Продакшен

Образы, стек с Caddy и бэкапами, пошаговая выкатка на чистый Ubuntu и проверка стека на своей
машине — в [docs/deploy.md](docs/deploy.md).

CI (GitHub Actions) запускает те же проверки, затем применяет миграции к пустой базе,
выполняет сид и собирает продакшен-сборку.

## Схема базы

Схема меняется только миграциями (`apps/web/src/migrations`):

```bash
pnpm --filter @cedarline/web generate:types   # типы Payload после изменения модели
pnpm --filter @cedarline/web migrate:create <name>
pnpm --filter @cedarline/web migrate
```
