// Load test of the site's main paths (k6). Run with tools/load/run.sh, which finds the server
// action ids of the build under test. Every iteration is a different visitor (own address), so
// the per-visitor rate limits behave as they would with real traffic.
import { check, sleep } from 'k6'
import http from 'k6/http'

const BASE = __ENV.BASE_URL
const SAVE_ACTION = __ENV.SAVE_ACTION
const LEAD_ACTION = __ENV.LEAD_ACTION
const PROJECTS = ['sosny', 'kedr', 'yasen', 'listvennitsa', 'pikhta', 'olkha', 'bereza', 'ryabina']
const CATALOG_QUERIES = [
  '',
  '?type=house',
  '?type=sauna',
  '?storeys=1',
  '?bedrooms=3',
  '?sort=price-asc',
]

/** Variations of one project's configuration: facade with its colours, windows, package. */
const FACADES = {
  'timber-imitation': ['#d2a86e', '#c08a4b', '#6e4a2e', '#7b3226'],
  planken: ['#3a3e3c', '#b98b5a', '#5e6650', '#a7ada6'],
  'fiber-cement': ['#e4e1d8', '#6c6f6c', '#2f3331'],
}

const RAMP = (target) => [
  { duration: '30s', target },
  { duration: '2m', target },
  { duration: '15s', target: 0 },
]

export const options = {
  insecureSkipTLSVerify: true,
  scenarios: {
    catalog: { executor: 'ramping-vus', exec: 'catalog', stages: RAMP(10) },
    project: { executor: 'ramping-vus', exec: 'project', stages: RAMP(10) },
    configure: { executor: 'ramping-vus', exec: 'configure', stages: RAMP(5) },
    save: {
      executor: 'constant-arrival-rate',
      exec: 'save',
      rate: 2,
      timeUnit: '1s',
      duration: '2m',
      startTime: '30s',
      preAllocatedVUs: 10,
      maxVUs: 30,
    },
    lead: {
      executor: 'constant-arrival-rate',
      exec: 'lead',
      rate: 1,
      timeUnit: '2s',
      duration: '2m',
      startTime: '30s',
      preAllocatedVUs: 10,
      maxVUs: 30,
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    'http_req_duration{scenario:catalog}': ['p(95)<1500'],
    'http_req_duration{scenario:project}': ['p(95)<1500'],
    'http_req_duration{scenario:configure}': ['p(95)<2000'],
    'http_req_duration{scenario:save}': ['p(95)<3000'],
    'http_req_duration{scenario:lead}': ['p(95)<5000'],
  },
}

const pick = (list) => list[Math.floor(Math.random() * list.length)]
const octet = () => 1 + Math.floor(Math.random() * 254)
const visitor = () => ({ 'X-Forwarded-For': `10.${octet()}.${octet()}.${octet()}` })

/** A server action call as the browser makes it: multipart fields of the FormData argument. */
function callAction(path, action, fields, headers) {
  const boundary = `----cedarline${Math.random().toString(16).slice(2)}`
  const parts = Object.entries(fields).map(
    ([name, value]) =>
      `--${boundary}\r\nContent-Disposition: form-data; name="_1_${name}"\r\n\r\n${value}\r\n`,
  )
  const body = `${parts.join('')}--${boundary}\r\nContent-Disposition: form-data; name="0"\r\n\r\n["$K1"]\r\n--${boundary}--\r\n`
  return http.post(`${BASE}${path}`, body, {
    headers: {
      ...headers,
      'Next-Action': action,
      Accept: 'text/x-component',
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
    },
  })
}

function configuration() {
  const facade = pick(Object.keys(FACADES))
  const windows = pick(['standard', 'panoramic'])
  return {
    project: 'pikhta',
    footprint: { width: 8000, depth: 6000 },
    mirrored: Math.random() < 0.5,
    roof: 'gable',
    facade,
    colour: pick(FACADES[facade]),
    windows,
    terrace: 1800,
    // A compatibility rule of the catalogue: panoramic glazing comes with 200 mm walls.
    insulation: windows === 'panoramic' ? 200 : pick([150, 200]),
    engineering: ['electrics', 'water', 'heating'],
    completeness: pick(['shell', 'prefinish', 'turnkey']),
  }
}

/** Saves a configuration; returns its share code or null. */
function saveConfiguration(headers) {
  const res = callAction(
    '/configurator/pikhta',
    SAVE_ACTION,
    { locale: 'ru', configuration: JSON.stringify(configuration()) },
    headers,
  )
  const code = /"code":"([a-z0-9]+)"/.exec(res.body)?.[1] ?? null
  check(res, { 'save: saved': () => res.status === 200 && code !== null })
  return code
}

export function catalog() {
  const res = http.get(`${BASE}/projects${pick(CATALOG_QUERIES)}`, { headers: visitor() })
  check(res, { 'catalog: 200': (r) => r.status === 200 })
  sleep(1)
}

export function project() {
  const res = http.get(`${BASE}/projects/${pick(PROJECTS)}`, { headers: visitor() })
  check(res, { 'project: 200': (r) => r.status === 200 })
  sleep(1)
}

/** The configurator page: the server builds the house and its estimate for the project. */
export function configure() {
  const res = http.get(`${BASE}/configurator/${pick(PROJECTS)}`, { headers: visitor() })
  check(res, { 'configure: 200': (r) => r.status === 200 })
  sleep(2)
}

export function save() {
  saveConfiguration(visitor())
}

/** A visitor saves a configuration and sends a lead for it: PDF, CMS record, demo mail. */
export function lead() {
  const headers = visitor()
  const code = saveConfiguration(headers)
  if (code === null) return
  const res = callAction(
    '/configurator/pikhta',
    LEAD_ACTION,
    {
      name: 'Нагрузочный тест',
      phone: '+7 000 518-20-64',
      email: 'load@example.ru',
      comment: '',
      consent: 'true',
      website: '',
      code,
      locale: 'ru',
    },
    headers,
  )
  check(res, { 'lead: accepted': (r) => r.status === 200 && r.body.includes('"ok":true') })
}
