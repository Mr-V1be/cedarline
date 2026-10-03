#!/bin/sh
# Local demo stand: Docker services, migrations, the seed on an empty database, a production
# build of the site and `next start` on :46100 in demo mode — detached from the terminal, with
# logs in .run/logs/. Safe to run again: it restarts only what is not running.
set -eu
. "$(dirname "$0")/common.sh"
cd "$ROOT"
mkdir -p "$LOG_DIR"

echo "→ docker services"
docker compose up -d --wait

echo "→ migrations"
pnpm --filter @kedrovnik/web migrate >>"$LOG_DIR/migrate.log" 2>&1

users="$(docker compose exec -T postgres sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAc "select count(*) from users"')"
if [ "$users" = "0" ]; then
  echo "→ seed (empty database)"
  pnpm --filter @kedrovnik/web seed >>"$LOG_DIR/seed.log" 2>&1
fi

if web_running; then
  echo "→ site already running: $WEB_URL"
  exit 0
fi

build_id="apps/web/.next/BUILD_ID"
if [ ! -f "$build_id" ] || [ -n "$(find apps/web/src apps/web/public packages -newer "$build_id" -type f -print -quit)" ]; then
  echo "→ production build (a few minutes)"
  pnpm build >"$LOG_DIR/build.log" 2>&1
fi

echo "→ site in demo mode"
DEMO_MODE=true setsid nohup pnpm --filter @kedrovnik/web start >"$LOG_DIR/web.log" 2>&1 </dev/null &
echo $! >"$WEB_PID"

if wait_for "$WEB_URL/api/health" 120; then
  echo "✓ $WEB_URL  (CMS: $WEB_URL/admin, demo sign-in: $WEB_URL/demo)"
else
  echo "✗ the site did not answer in 2 minutes, see $LOG_DIR/web.log" >&2
  exit 1
fi
