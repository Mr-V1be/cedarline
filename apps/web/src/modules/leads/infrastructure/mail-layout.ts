/** Escapes text for HTML email bodies; every value from users or the CMS goes through it. */
export function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

/** Brand colours of the email; mail clients ignore CSS variables, so they are literal here. */
const COLOURS = {
  ink: '#1f2a24',
  muted: '#5d6660',
  band: '#1f3a2e',
  paper: '#f6f4ee',
  line: '#d9d4c7',
}

export interface MailRow {
  readonly label: string
  readonly value: string
}

export interface MailContent {
  readonly preheader: string
  readonly heading: string
  readonly paragraphs: readonly string[]
  readonly rows: readonly MailRow[]
  readonly action: { readonly label: string; readonly href: string } | null
  readonly footer: readonly string[]
}

/** A table-based layout every mail client renders the same; values are escaped here. */
export function renderMailHtml(content: MailContent, brand: string): string {
  const paragraphs = content.paragraphs
    .map((text) => `<p style="margin:0 0 14px;line-height:1.55">${escapeHtml(text)}</p>`)
    .join('')
  const rows = content.rows
    .map(
      (row) =>
        `<tr><td style="padding:8px 12px 8px 0;color:${COLOURS.muted};vertical-align:top;white-space:nowrap">${escapeHtml(row.label)}</td>` +
        `<td style="padding:8px 0;font-weight:600;white-space:pre-line">${escapeHtml(row.value)}</td></tr>`,
    )
    .join('')
  const action =
    content.action === null
      ? ''
      : `<p style="margin:22px 0"><a href="${escapeHtml(content.action.href)}" style="background:${COLOURS.band};color:#ffffff;padding:12px 20px;border-radius:6px;text-decoration:none;font-weight:600;display:inline-block">${escapeHtml(content.action.label)}</a></p>`
  const footer = content.footer
    .map(
      (line) =>
        `<p style="margin:0 0 6px;color:${COLOURS.muted};font-size:13px">${escapeHtml(line)}</p>`,
    )
    .join('')
  return `<!doctype html><html><body style="margin:0;background:${COLOURS.paper};font-family:Arial,Helvetica,sans-serif;color:${COLOURS.ink}">
<span style="display:none;max-height:0;overflow:hidden">${escapeHtml(content.preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLOURS.paper}"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border:1px solid ${COLOURS.line};border-radius:8px">
<tr><td style="background:${COLOURS.band};color:#ffffff;padding:18px 24px;font-size:20px;font-weight:700;border-radius:8px 8px 0 0">${escapeHtml(brand)}</td></tr>
<tr><td style="padding:24px">
<h1 style="margin:0 0 16px;font-size:22px;line-height:1.3">${escapeHtml(content.heading)}</h1>
${paragraphs}
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 4px;border-top:1px solid ${COLOURS.line};width:100%">${rows}</table>
${action}
<div style="border-top:1px solid ${COLOURS.line};padding-top:14px;margin-top:8px">${footer}</div>
</td></tr></table></td></tr></table></body></html>`
}

/** The plain-text alternative of the same content. */
export function renderMailText(content: MailContent): string {
  return [
    content.heading,
    '',
    ...content.paragraphs.flatMap((text) => [text, '']),
    ...content.rows.map((row) => `${row.label}: ${row.value}`),
    '',
    ...(content.action === null ? [] : [`${content.action.label}: ${content.action.href}`, '']),
    ...content.footer,
  ].join('\n')
}
