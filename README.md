# Кедровник

Сайт производителя каркасных домов и бань: каталог проектов с фильтрами, страница проекта
с 3D-моделью, планировками по уровням, комплектациями и сроками, CMS для контент-менеджера
и менеджера продаж. Демо-версия: компания и данные вымышленные.

## Состав репозитория

| Путь               | Что внутри                                                                                         |
| ------------------ | -------------------------------------------------------------------------------------------------- |
| `packages/house`   | Параметрическая модель дома: спецификация, каркас, сетка для 3D, ведомость объёмов, обмерные планы |
| `packages/pricing` | Смета и график: деньги в копейках, тарифная сетка, комплектации, критический путь этапов           |
| `apps/web`         | Next.js 16 (App Router) + Payload CMS 3 + PostgreSQL/PostGIS: сайт, CMS, демо-контент              |
| `tools/code-shape` | Гейт формы кода: файл ≤ 700 строк, папка ≤ 15 файлов исходников                                    |
| `docs/`            | Архитектура и скриншоты вех                                                                        |

Подробно об устройстве — в [docs/architecture.md](docs/architecture.md).

## Запуск локально

Нужны Node 24, pnpm 10 и Docker с Compose.

```bash
cp .env.example .env          # заполнить значения (см. комментарии в файле)
pnpm install
docker compose up -d          # PostGIS на 127.0.0.1:46132, Mailpit: SMTP 46125, UI 46180
pnpm --filter @kedrovnik/web migrate
pnpm --filter @kedrovnik/web seed
pnpm dev                      # http://localhost:46100
```

- Сайт: <http://localhost:46100> (русский), <http://localhost:46100/en> (английский).
- CMS: <http://localhost:46100/admin>.
- Mailpit: <http://localhost:46180> (письма появятся со следующей вехи).

### Демо-доступы в CMS

Учётные записи создаёт `seed` (файл `apps/web/src/seed/data/users.ts`):

| Роль             | Логин                       | Пароль                   |
| ---------------- | --------------------------- | ------------------------ |
| Администратор    | `admin@kedrovnik.example`   | `kedrovnik-admin-demo`   |
| Контент-менеджер | `content@kedrovnik.example` | `kedrovnik-content-demo` |
| Менеджер продаж  | `sales@kedrovnik.example`   | `kedrovnik-sales-demo`   |

### Рендеры проектов

Изображения каталога — рендеры собственной 3D-сцены сайта. Они лежат в
`apps/web/seed-assets/renders` и загружаются сидом. Пересоздать их можно при запущенном сайте:

```bash
pnpm --filter @kedrovnik/web render:covers   # все рендеры; можно указать префиксы: sosny kedr-back
pnpm --filter @kedrovnik/web seed            # загрузить обновлённые рендеры в медиатеку
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

CI (GitHub Actions) запускает те же проверки, затем применяет миграции к пустой базе,
выполняет сид и собирает продакшен-сборку.

## Схема базы

Схема меняется только миграциями (`apps/web/src/migrations`):

```bash
pnpm --filter @kedrovnik/web generate:types   # типы Payload после изменения модели
pnpm --filter @kedrovnik/web migrate:create <name>
pnpm --filter @kedrovnik/web migrate
```
