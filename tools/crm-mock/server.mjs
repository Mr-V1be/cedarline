// CRM mock in the Bitrix24 REST dialect, for local development and demos.
//
// Implements the incoming-webhook form of the public REST API documentation:
//   POST /rest/<user>/<token>/crm.lead.add.json   { fields, params } -> { result: <id>, time }
//   GET  /rest/<user>/<token>/crm.lead.get.json?id=<id>          -> { result: <lead> }
//   GET  /rest/<user>/<token>/crm.lead.list.json                  -> { result: [<lead>], total }
// A wrong token answers 401 { error: "INVALID_CREDENTIALS" } like the real service.
// GET / shows the received leads as a page, so a demo can show what reached the "CRM".
// Leads live in memory and in a JSON file, so a restart keeps them.
import { createServer } from 'node:http'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'

const PORT = Number(process.env.PORT ?? 8080)
const TOKEN = process.env.CRM_MOCK_TOKEN ?? ''
const STORE = process.env.CRM_MOCK_STORE ?? '/data/leads.json'
const MAX_BODY = 64 * 1024

if (TOKEN === '') {
  console.error('CRM_MOCK_TOKEN is required')
  process.exit(1)
}

const leads = existsSync(STORE) ? JSON.parse(readFileSync(STORE, 'utf8')) : []
const save = () => writeFileSync(STORE, JSON.stringify(leads, null, 2))

const send = (response, status, body, type = 'application/json; charset=utf-8') => {
  response.writeHead(status, { 'content-type': type })
  response.end(type.startsWith('application/json') ? JSON.stringify(body) : body)
}
const time = (start) => ({
  start: start / 1000,
  finish: Date.now() / 1000,
  duration: (Date.now() - start) / 1000,
})
const escape = (value) =>
  String(value ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  )

function readBody(request) {
  return new Promise((resolve, reject) => {
    let size = 0
    const chunks = []
    request.on('data', (chunk) => {
      size += chunk.length
      if (size > MAX_BODY) reject(new Error('too large'))
      else chunks.push(chunk)
    })
    request.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    request.on('error', reject)
  })
}

const page =
  () => `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>CRM mock — лиды</title>
<style>body{font:15px/1.5 system-ui,sans-serif;margin:0;background:#f4f5f7;color:#1f2933}header{background:#2fc6f6;color:#fff;padding:14px 24px;font-weight:600}main{padding:24px;max-width:1100px;margin:auto}table{width:100%;border-collapse:collapse;background:#fff}th,td{padding:10px 12px;border-bottom:1px solid #e3e7ec;text-align:left;vertical-align:top}th{font-size:13px;color:#5d6b78}td small{color:#5d6b78}</style></head>
<body><header>CRM mock · Битрикс24 REST · лиды (${leads.length})</header><main><table><thead><tr><th>ID</th><th>Лид</th><th>Контакт</th><th>Сумма</th><th>Источник</th><th>Создан</th></tr></thead><tbody>
${leads
  .slice()
  .reverse()
  .map(
    (lead) =>
      `<tr><td>${lead.ID}</td><td>${escape(lead.TITLE)}<br><small>${escape(lead.COMMENTS).replace(/\n/g, '<br>')}</small></td><td>${escape(lead.NAME)}<br><small>${escape(lead.PHONE?.[0]?.VALUE)}<br>${escape(lead.EMAIL?.[0]?.VALUE)}</small></td><td>${escape(lead.OPPORTUNITY)} ${escape(lead.CURRENCY_ID)}</td><td>${escape(lead.SOURCE_ID)}<br><small>${escape(lead.SOURCE_DESCRIPTION)}</small></td><td><small>${escape(lead.DATE_CREATE)}</small></td></tr>`,
  )
  .join('')}
</tbody></table></main></body></html>`

createServer(async (request, response) => {
  const start = Date.now()
  const url = new URL(request.url ?? '/', 'http://localhost')
  if (request.method === 'GET' && url.pathname === '/')
    return send(response, 200, page(), 'text/html; charset=utf-8')
  if (request.method === 'GET' && url.pathname === '/health')
    return send(response, 200, { ok: true })

  const match = /^\/rest\/(\d+)\/([^/]+)\/([a-z.]+?)(?:\.json)?$/.exec(url.pathname)
  if (match === null)
    return send(response, 404, { error: 'NOT_FOUND', error_description: 'Unknown path' })
  const [, , token, method] = match
  if (token !== TOKEN)
    return send(response, 401, {
      error: 'INVALID_CREDENTIALS',
      error_description: 'Invalid request credentials',
    })

  try {
    if (method === 'crm.lead.add' && request.method === 'POST') {
      const body = JSON.parse((await readBody(request)) || '{}')
      const fields = body.fields ?? {}
      if (typeof fields.TITLE !== 'string' || fields.TITLE.trim() === '') {
        return send(response, 400, {
          error: 'ERROR_CORE',
          error_description: 'Field TITLE is required',
        })
      }
      const lead = {
        ...fields,
        ID: String(leads.length + 1),
        DATE_CREATE: new Date().toISOString(),
        STATUS_ID: 'NEW',
      }
      leads.push(lead)
      save()
      return send(response, 200, { result: Number(lead.ID), time: time(start) })
    }
    if (method === 'crm.lead.get') {
      const lead = leads.find((candidate) => candidate.ID === url.searchParams.get('id'))
      return lead === undefined
        ? send(response, 400, { error: 'ERROR_NOT_FOUND', error_description: 'Not found' })
        : send(response, 200, { result: lead, time: time(start) })
    }
    if (method === 'crm.lead.list') {
      return send(response, 200, {
        result: leads.slice(-50),
        total: leads.length,
        time: time(start),
      })
    }
    return send(response, 400, {
      error: 'ERROR_METHOD_NOT_FOUND',
      error_description: 'Method not found',
    })
  } catch {
    return send(response, 400, { error: 'INVALID_REQUEST', error_description: 'Malformed request' })
  }
}).listen(PORT, () => {
  process.stdout.write(`CRM mock listening on ${PORT}\n`)
})
