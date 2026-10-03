import { getServices } from '@/composition/services'
import { DEFAULT_LOCALE } from '@/i18n/locales'

export const dynamic = 'force-dynamic'

/** An attachment of a demo mailbox letter; the letter's key is the only way to it. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string; index: string }> },
) {
  const { key, index } = await params
  if (!/^\d{1,2}$/.test(index)) return new Response(null, { status: 404 })
  const services = await getServices(DEFAULT_LOCALE)
  const attachment = await services.mailbox.attachment(key, Number(index))
  if (attachment === null) return new Response(null, { status: 404 })
  return new Response(new Uint8Array(attachment.data), {
    headers: {
      'content-type': attachment.contentType,
      'content-disposition': `attachment; filename*=UTF-8''${encodeURIComponent(attachment.filename)}`,
      'cache-control': 'private, no-store',
      'x-robots-tag': 'noindex',
      'referrer-policy': 'no-referrer',
    },
  })
}
