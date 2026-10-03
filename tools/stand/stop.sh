#!/bin/sh
# Stops the local stand: the detached site and the Docker services (containers are kept).
set -eu
. "$(dirname "$0")/common.sh"
cd "$ROOT"

if web_running; then
  kill -TERM "-$(cat "$WEB_PID")"
  echo "→ site stopped"
fi
rm -f "$WEB_PID"
docker compose stop
