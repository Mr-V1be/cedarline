// Capacity of the read paths: visitors without pauses on the catalogue, project pages and the
// configurator, VUS of them at once for a minute. Run it for growing VUS to see where latency
// climbs: VUS=25 tools/load/run.sh <url> "" capacity.js
import { check } from 'k6'
import http from 'k6/http'

const BASE = __ENV.BASE_URL
const PATHS = [
  '/projects',
  '/projects?type=house',
  '/projects/sosny',
  '/projects/kedr',
  '/projects/yasen',
  '/configurator/pikhta',
  '/configurator/olkha',
]

export const options = {
  insecureSkipTLSVerify: true,
  scenarios: {
    reads: {
      executor: 'constant-vus',
      vus: Number(__ENV.VUS ?? 10),
      duration: '1m',
    },
  },
}

const octet = () => 1 + Math.floor(Math.random() * 254)

export default function reads() {
  const path = PATHS[Math.floor(Math.random() * PATHS.length)]
  const res = http.get(`${BASE}${path}`, {
    headers: { 'X-Forwarded-For': `10.${octet()}.${octet()}.${octet()}` },
  })
  check(res, { 'read: 200': (r) => r.status === 200 })
}
