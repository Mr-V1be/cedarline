# Shared settings of the local stand scripts (sourced, not run).
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
RUN_DIR="$ROOT/.run"
LOG_DIR="$RUN_DIR/logs"
WEB_PID="$RUN_DIR/web.pid"
WEB_PORT=46100
WEB_URL="http://localhost:$WEB_PORT"

# The site's process group is alive (pid file of the detached `next start`).
web_running() {
  [ -f "$WEB_PID" ] && kill -0 "-$(cat "$WEB_PID")" 2>/dev/null
}

# Waits up to $2 seconds for the URL to answer 200.
wait_for() {
  url="$1"; seconds="$2"
  while [ "$seconds" -gt 0 ]; do
    curl -sf -o /dev/null "$url" && return 0
    sleep 1; seconds=$((seconds - 1))
  done
  return 1
}
