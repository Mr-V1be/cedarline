#!/bin/sh
# Runs the k6 load test (Docker image grafana/k6, nothing installed on the machine) against a
# running build of the site. The server action ids differ per build, so they are read from the
# build's manifest: a local `next start` (default) or the web container of a compose project.
#   tools/load/run.sh http://localhost:46100
#   tools/load/run.sh http://localhost:46144 "docker exec kedrovnik-prodcheck-web-1"
# Afterwards `pnpm --filter @kedrovnik/web demo:reset` removes the test's leads and mail.
set -eu
BASE_URL="${1:?base URL of the site}"
IN_CONTAINER="${2:-}"
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
K6_IMAGE="grafana/k6:2.3.0"
MANIFEST=".next/server/server-reference-manifest.json"

if [ -n "$IN_CONTAINER" ]; then
  manifest="$($IN_CONTAINER cat "$MANIFEST")"
else
  manifest="$(cat "$ROOT/apps/web/$MANIFEST")"
fi
action_id() {
  printf '%s' "$manifest" | node -e '
    let input = ""; process.stdin.on("data", (c) => (input += c)).on("end", () => {
      const found = Object.entries(JSON.parse(input).node).find(([, v]) => v.exportedName === process.argv[1])
      if (!found) { console.error("no action " + process.argv[1]); process.exit(1) }
      console.log(found[0])
    })' "$1"
}

mkdir -p "$ROOT/.run/load"
docker run --rm --network host \
  -e BASE_URL="$BASE_URL" \
  -e SAVE_ACTION="$(action_id saveConfigurationAction)" \
  -e LEAD_ACTION="$(action_id submitLeadAction)" \
  -v "$ROOT/tools/load:/scripts:ro" \
  -v "$ROOT/.run/load:/results" \
  --user "$(id -u):$(id -g)" \
  "$K6_IMAGE" run --summary-export=/results/summary.json /scripts/scenarios.js
