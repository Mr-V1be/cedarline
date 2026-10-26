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
   склонировать в `/opt/cedarline`.
4. **Настройки.**
   ```sh
   cd /opt/cedarline
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
cd /opt/cedarline
git pull
docker compose -f docker-compose.prod.yml --env-file .env.production build
docker compose -f docker-compose.prod.yml --env-file .env.production up -d
```

Миграции применяются сами перед стартом новой версии. Перерыв — время перезапуска `web`
(10–20 секунд): Caddy в это время отвечает 502. Откат — `git checkout <тег>` и те же команды;
миграции пишутся по схеме «расширить → перенести → сузить», поэтому предыдущая версия работает
с базой, расширенной следующей.

## Переход со старого имени

Компания переименована: «Кедровник» (Kedrovnik) стал Cedarline. Вместе с названием сменились
имена проекта Compose, образов, базы и роли, поэтому установка, развёрнутая под старым
именем, переезжает один раз по шагам ниже. Сервисы и порты прежние.

| Что                                            | Было                                                        | Стало                                            |
| ---------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------ |
| Проект Compose (контейнеры, сеть)              | `kedrovnik`, сеть `kedrovnik_default`                       | `cedarline`, сеть `cedarline_default`            |
| Тома                                           | `kedrovnik_<том>`                                           | `cedarline_<том>`                                |
| Образы                                         | `kedrovnik-web`, `kedrovnik-tools`                          | `cedarline-web`, `cedarline-tools`               |
| Переменные образов                             | `KEDROVNIK_WEB_IMAGE`, `KEDROVNIK_TOOLS_IMAGE`              | `CEDARLINE_WEB_IMAGE`, `CEDARLINE_TOOLS_IMAGE`   |
| Сервисы                                        | `postgres`, `migrate`, `web`, `caddy`, `backup`, `crm-mock` | без изменений                                    |
| База и роль                                    | `kedrovnik`                                                 | `cedarline`                                      |
| `POSTGRES_DB`, `POSTGRES_USER`, `DATABASE_URL` | с `kedrovnik`                                               | с `cedarline`                                    |
| Отправитель писем (`MAIL_FROM_NAME`)           | Кедровник                                                   | Cedarline                                        |
| Демо-учётки CMS                                | `*@kedrovnik.example`, пароли `kedrovnik-*-demo`            | `*@cedarline.example`, пароли `cedarline-*-demo` |
| Каталог на сервере                             | `/opt/kedrovnik`                                            | `/opt/cedarline`                                 |
| Проект проверки на своей машине                | `kedrovnik-prodcheck`                                       | `cedarline-prodcheck`                            |
| Ключ темы в `localStorage`                     | `kedrovnik-theme`                                           | `cedarline-theme`                                |

Тома: `postgres-data`, `media`, `documents`, `mailbox-files`, `backups`, `caddy-data`,
`caddy-config`, `crm-mock-data`. Keycloak, Redis и внешних очередей в проекте нет: очередь задач
Payload живёт в базе и переезжает вместе с ней. Посетители, выбравшие тему вручную, один раз
увидят тему системы. Адрес сайта не меняется, поэтому сертификат из `caddy-data` переезжает
вместе с томом.

Порядок проверен на стеке проверки (`kedrovnik-prodcheck` → `cedarline-prodcheck`): база,
загрузки, КП, письма демо-ящика, бэкапы и сертификаты на месте, сайт работает на
переименованной базе с прежним паролем роли. Перерыв — от шага 2 до шага 8, несколько минут.

```sh
# 1. Новый код и образы; старый стек пока работает. На демо-стенде к обеим строкам
#    добавить --profile demo.
cd /opt/kedrovnik
git pull
old="docker compose -p kedrovnik -f docker-compose.prod.yml --env-file .env.production"
new="docker compose -f docker-compose.prod.yml --env-file .env.production"
$new build

# 2. Остановить всех, кто пишет в базу и тома.
$old stop caddy web backup crm-mock

# 3. Переименовать базу и роль. Через сокет контейнера psql входит без пароля; роль нельзя
#    переименовать из-под неё самой, поэтому на время нужен второй суперпользователь. Пароль
#    роли (SCRAM) переименование не сбрасывает.
$old exec -T postgres psql -v ON_ERROR_STOP=1 -U kedrovnik -d postgres \
  -c 'CREATE ROLE rename_helper SUPERUSER LOGIN'
$old exec -T postgres psql -v ON_ERROR_STOP=1 -U rename_helper -d postgres \
  -c 'ALTER DATABASE kedrovnik RENAME TO cedarline' -c 'ALTER ROLE kedrovnik RENAME TO cedarline'
$old exec -T postgres psql -v ON_ERROR_STOP=1 -U cedarline -d postgres -c 'DROP ROLE rename_helper'

# 4. Убрать контейнеры и сеть старого проекта; тома остаются.
$old down

# 5. Новые имена в настройках. Значения переменных образов — ссылки на новые образы.
#    MAIL_FROM_NAME=Cedarline и адрес отправителя — вручную.
sed -i -e 's/^POSTGRES_DB=kedrovnik$/POSTGRES_DB=cedarline/' \
  -e 's/^POSTGRES_USER=kedrovnik$/POSTGRES_USER=cedarline/' \
  -e 's#^DATABASE_URL=postgres://kedrovnik:\(.*\)@postgres:5432/kedrovnik$#DATABASE_URL=postgres://cedarline:\1@postgres:5432/cedarline#' \
  -e 's/^KEDROVNIK_\([A-Z]*_IMAGE\)=/CEDARLINE_\1=/' .env.production

# 6. Каталог.
cd /opt && mv kedrovnik cedarline && cd cedarline

# 7. Тома нового проекта с метками Compose (create ничего не запускает) и копия данных в них.
$new create
for volume in postgres-data media documents mailbox-files backups caddy-data caddy-config crm-mock-data; do
  docker volume inspect "kedrovnik_$volume" >/dev/null 2>&1 || continue
  docker run --rm -v "kedrovnik_$volume:/from:ro" -v "cedarline_$volume:/to" \
    --entrypoint sh postgis/postgis:18-3.6 -c 'cp -a /from/. /to/'
done

# 8. Запуск: миграции, сайт, Caddy.
$new up -d --wait
curl -fsS https://<домен>/api/health

# 9. Только демо-стенд: демо-учётки, реквизиты компании и примеры заявок с КП — под новым
#    именем (то же сделал бы ночной сброс).
$new run --rm migrate run src/seed/reset.ts

# 10. Когда всё проверено (сайт, вход в CMS, заявка, бэкап ночью), удалить старые тома.
for volume in postgres-data media documents mailbox-files backups caddy-data caddy-config crm-mock-data; do
  docker volume rm "kedrovnik_$volume" 2>/dev/null || true
done
```

Откат до шага 10: `$new down`, вернуть каталог и `.env.production`, поднять в старом проекте
только `postgres` (`$old up -d postgres`), выполнить шаг 3 с переставленными именами и затем
`$old up -d`. Старые тома после шага 3 не меняются: копия данных живёт в новых.

Локальный стенд разработчика проще поднять заново: поправить имена в `.env` по таблице,
`docker compose -p kedrovnik down` (освобождает подсеть, тома остаются) и `make stand` —
пустая база получит миграции и сид.

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
$compose run --rm --entrypoint sh -v cedarline_media:/data/media -v cedarline_documents:/data/documents backup -c \
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
нужен отдельный env-файл (например, `/tmp/cedarline.prodcheck.env`) с `SITE_DOMAIN=localhost`,
`SITE_URL=https://localhost:46143`, `HTTP_PORT=127.0.0.1:46181`, `HTTPS_PORT=127.0.0.1:46143` и
остальными значениями как для сервера. Caddy для `localhost` выпускает сертификат своего
локального центра сертификации.

```sh
export APP_ENV_FILE=/tmp/cedarline.prodcheck.env
compose="docker compose -p cedarline-prodcheck -f docker-compose.prod.yml -f deploy/compose.local-check.yml --env-file $APP_ENV_FILE"
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
