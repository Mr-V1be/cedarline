#!/bin/sh
# Shows what of the local stand is running and whether the site answers.
set -u
. "$(dirname "$0")/common.sh"
cd "$ROOT"

docker compose ps --format 'table {{.Service}}\t{{.Status}}\t{{.Ports}}'
if web_running; then
  echo "site: running (process group $(cat "$WEB_PID")), logs in $LOG_DIR/web.log"
else
  echo "site: not running"
fi
for path in /api/health / /admin /demo; do
  code="$(curl -s -o /dev/null -w '%{http_code}' "$WEB_URL$path" || true)"
  echo "  $WEB_URL$path → $code"
done
