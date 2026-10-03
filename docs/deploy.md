# Выкатка в продакшен

Сайт поставляется двумя образами из одного `Dockerfile` и стеком `docker-compose.prod.yml`:

| Сервис     | Что делает                                                                                                     |
| ---------- | -------------------------------------------------------------------------------------------------------------- |
| `postgres` | PostgreSQL 18 с PostGIS, данные в томе `postgres-data`                                                         |
| `migrate`  | образ `tools`: применяет миграции и завершается; сайт стартует только после него                               |
| `web`      | образ `runner`: Next.js + CMS (standalone-сервер), непривилегированный пользователь, healthcheck `/api/health` |
| `caddy`    | HTTPS с автоматическим сертификатом Let's Encrypt, HTTP/3, сжатие, заголовки                                   |
| `backup`   | каждую ночь: дамп базы и архив загрузок, хранение N дней                                                       |
| `crm-mock` | только демо-стенд (`--profile demo`): мок CRM для канала `bitrix24`                                            |

Секреты и настройки — в файле `.env.production` на сервере (шаблон —
`.env.production.example`), в репозиторий он не попадает. Каждый сервис получает только свои
переменные.

## Требования к серверу

- Ubuntu Server 24.04 LTS или новее, x86-64.
- 2 vCPU, 4 ГБ RAM, 40 ГБ SSD. Сборка образов на самом сервере требует ещё ~3 ГБ памяти —
  на 4 ГБ включите swap 4 ГБ или собирайте образы на другой машине и переносите их через
  registry.
- Docker Engine 29 и плагин Compose v2 (официальный репозиторий Docker).
- Домен с A-записью (и AAAA, если есть IPv6) на адрес сервера.
- Открытые входящие порты 80/tcp, 443/tcp, 443/udp; исходящий доступ к Let's Encrypt, к
  тайлам OpenFreeMap и к cbr.ru.

## Первая выкатка на чистый сервер

1. **Docker.** По инструкции docs.docker.com/engine/install/ubuntu: подключить репозиторий
   Docker, установить `docker-ce`, `docker-ce-cli`, `containerd.io`, `docker-compose-plugin`.
   Пользователя, который выкатывает, добавить в группу `docker`.
2. **Файрвол.**
   ```sh
   sudo ufw allow OpenSSH && sudo ufw allow 80/tcp && sudo ufw allow 443/tcp && sudo ufw allow 443/udp
   sudo ufw enable
   ```
3. **Код.** Репозиторий приватный: добавить на сервере deploy-ключ только на чтение и
   склонировать в `/opt/kedrovnik`.
4. **Настройки.**
   ```sh
   cd /opt/kedrovnik
   cp .env.production.example .env.production
   chmod 600 .env.production
   openssl rand -hex 24   # POSTGRES_PASSWORD
   openssl rand -hex 32   # PAYLOAD_SECRET
   ```
   Заполнить все строки: домен (`SITE_DOMAIN`, `SITE_URL=https://<домен>`), почту для
   Let's Encrypt, доступ к базе (`DATABASE_URL` указывает на `postgres:5432`), отправку писем
   (`MAIL_MODE=smtp` и SMTP-релей компании), каналы заявок.
5. **Сборка и запуск.**
   ```sh
   docker compose -f docker-compose.prod.yml --env-file .env.production build
   docker compose -f docker-compose.prod.yml --env-file .env.production up -d
   ```
   `migrate` создаёт схему, затем стартует `web`, после его healthcheck — `caddy`, который
   получает сертификат за полминуты.
6. **Первый пользователь.** Открыть `https://<домен>/admin` — CMS предложит создать первого
   администратора. Остальных сотрудников он заводит в разделе «Пользователи» с ролями.
7. **Проверка.** `curl -fsS https://<домен>/api/health` отвечает `{"status":"ok"}`;
   `docker compose -f docker-compose.prod.yml ps` показывает `web` как `healthy`.

### Демо-стенд

Для публичной демо-версии в `.env.production`: `DEMO_MODE=true`, `MAIL_MODE=demo`, по желанию
`LEAD_SINKS=cms,bitrix24` с `BITRIX24_WEBHOOK_URL=http://crm-mock:8080/rest/1/<CRM_MOCK_TOKEN>/`.
После первого запуска залить демо-данные и запускать с профилем `demo`:

```sh
docker compose -f docker-compose.prod.yml --env-file .env.production run --rm migrate run src/seed/run.ts
docker compose -f docker-compose.prod.yml --env-file .env.production --profile demo up -d
```

Каждую ночь в 03:30 по времени сервера (`TZ`) стенд сам возвращается к исходным данным; вручную —
`... run --rm migrate run src/seed/reset.ts`.

## Обновление

```sh
cd /opt/kedrovnik
git pull
docker compose -f docker-compose.prod.yml --env-file .env.production build
docker compose -f docker-compose.prod.yml --env-file .env.production up -d
```

Миграции применяются сами перед стартом новой версии. Перерыв — время перезапуска `web`
(10–20 секунд): Caddy в это время отвечает 502. Откат — `git checkout <тег>` и те же команды;
миграции пишутся по схеме «расширить → перенести → сузить», поэтому предыдущая версия работает
с базой, расширенной следующей.

## Бэкапы и восстановление

Сервис `backup` раз в сутки (`BACKUP_TIME`, по умолчанию 03:00) кладёт в том `backups`
дамп базы `db_<дата>.dump` и архив загрузок и КП `files_<дата>.tar.gz`, удаляя файлы старше
`BACKUP_KEEP_DAYS` (14). Копию тома стоит забирать за пределы сервера (rsync, rclone в объектное
хранилище) — это зависит от инфраструктуры заказчика.

Восстановление:

```sh
compose="docker compose -f docker-compose.prod.yml --env-file .env.production"
$compose stop web caddy
$compose run --rm --entrypoint sh backup -c \
  'PGPASSWORD="$POSTGRES_PASSWORD" pg_restore -h postgres -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists /backups/db_<дата>.dump'
$compose run --rm --entrypoint sh -v kedrovnik_media:/data/media -v kedrovnik_documents:/data/documents backup -c \
  'tar -xzf /backups/files_<дата>.tar.gz -C /data'
$compose up -d
```

## Логи и наблюдение

- `docker compose -f docker-compose.prod.yml logs -f web` — журнал сайта (JSON-строки Payload и
  Next.js), `caddy` — журнал запросов в JSON.
- Логи всех контейнеров ротируются Docker'ом: до 5 файлов по 10 МБ на сервис.
- `/api/health` проверяет, что сайт отвечает и база принимает запросы; его используют
  healthcheck контейнера и Caddy. Упавший контейнер перезапускается (`restart: unless-stopped`).

## Память и соединения

Сайт — один процесс Node: Next.js и CMS. На сервере, который он делит с другими сервисами:

- `WEB_NODE_OPTIONS=--max-old-space-size=<МБ>` — потолок кучи V8 только для `web`; разовые
  задачи (`migrate`, сид, сброс демо) его не получают: сиду нужна память на рендеры. Лимит
  контейнера оставляет сверх кучи запас на нативную память: sharp, буферы ответов, код.
- `DATABASE_POOL_MAX` — соединений процесса с PostgreSQL (по умолчанию 10). Сумма пулов всех
  сервисов сервера держится ниже `max_connections`.

## Кэширование

| Что                                | Заголовок                                                       | Кто ставит                  |
| ---------------------------------- | --------------------------------------------------------------- | --------------------------- |
| `/_next/static/*`, `/vendor/*`     | `public, max-age=31536000, immutable` — имена с хешем           | Next.js, сайт               |
| `/_next/image` (обложки, рендеры)  | `max-age=86400` — сутки                                         | Next.js (`minimumCacheTTL`) |
| `/api/media/file/*` (оригиналы)    | `public, max-age=86400, stale-while-revalidate=604800`          | CMS                         |
| `/scene/*` (текстуры и HDRI сцены) | `public, max-age=86400, stale-while-revalidate=604800`          | Next.js                     |
| `/files/c/<код>/render`            | `public, max-age=31536000, immutable` — рендер кода не меняется | сайт                        |
| страницы, КП, письма демо-ящика    | без кэша или `private, no-store`                                | сайт                        |

## Проверка на своей машине

Стек целиком поднимается и локально — в своей подсети и на свободных портах. Для проверки
нужен отдельный env-файл (например, `/tmp/kedrovnik.prodcheck.env`) с `SITE_DOMAIN=localhost`,
`SITE_URL=https://localhost:46143`, `HTTP_PORT=127.0.0.1:46181`, `HTTPS_PORT=127.0.0.1:46143` и
остальными значениями как для сервера. Caddy для `localhost` выпускает сертификат своего
локального центра сертификации.

```sh
export APP_ENV_FILE=/tmp/kedrovnik.prodcheck.env
compose="docker compose -p kedrovnik-prodcheck -f docker-compose.prod.yml -f deploy/compose.local-check.yml --env-file $APP_ENV_FILE"
$compose up -d --build
curl -kfsS https://localhost:46143/api/health
$compose down -v   # убрать стек проверки вместе с томами
```

## Что нужно от заказчика для выкатки

- Сервер по требованиям выше и SSH-доступ для выкатки.
- Домен и управление его DNS (A/AAAA-записи на сервер).
- Почта для уведомлений Let's Encrypt.
- SMTP-релей компании (хост, порт, логин, пароль) и адрес отправителя писем.
- Если заявки должны уходить в CRM — адрес входящего вебхука Битрикс24.
- Место для внешней копии бэкапов (объектное хранилище или другой сервер).
- Реальные реквизиты, текст политики обработки персональных данных от юриста и снятая
  отметка «Демо-реквизиты» в CMS (раздел «Компания»).
