import maplibrePackage from 'maplibre-gl/package.json' with { type: 'json' }

/**
 * MapLibre is served from the site as its own ES modules rather than bundled: the library
 * finds its worker next to its module, and the module and the worker share one cached chunk.
 */
export const MAPLIBRE_VERSION = maplibrePackage.version
export const MAPLIBRE_FILES = [
  'maplibre-gl.mjs',
  'maplibre-gl-shared.mjs',
  'maplibre-gl-worker.mjs',
] as const
export type MaplibreFile = (typeof MAPLIBRE_FILES)[number]

export const isMaplibreFile = (value: string): value is MaplibreFile =>
  (MAPLIBRE_FILES as readonly string[]).includes(value)

/** URL of a library file for the installed version; the browser caches it for good. */
export const maplibreFileUrl = (file: MaplibreFile): string =>
  `/vendor/maplibre/${MAPLIBRE_VERSION}/${file}`
