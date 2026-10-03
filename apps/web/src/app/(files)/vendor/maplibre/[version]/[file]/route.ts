import { readMaplibreFile } from '@/modules/site/infrastructure/maplibre-vendor'
import { MAPLIBRE_FILES, MAPLIBRE_VERSION, isMaplibreFile } from '@/ui/components/map/vendor'

/** Built once: the files are part of the installed library version. */
export const dynamic = 'force-static'
export const dynamicParams = false

export function generateStaticParams() {
  return MAPLIBRE_FILES.map((file) => ({ version: MAPLIBRE_VERSION, file }))
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ version: string; file: string }> },
) {
  const { version, file } = await params
  if (version !== MAPLIBRE_VERSION || !isMaplibreFile(file)) {
    return new Response(null, { status: 404 })
  }
  return new Response(new Uint8Array(await readMaplibreFile(file)), {
    headers: {
      'content-type': 'text/javascript; charset=utf-8',
      'cache-control': 'public, max-age=31536000, immutable',
    },
  })
}
