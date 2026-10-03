import type { FeatureCollection, Point } from 'geojson'
import type { GeoJSONSourceSpecification, Map as MapLibreMap } from 'maplibre-gl'

export interface MapPoint {
  readonly id: string
  /** [longitude, latitude] */
  readonly position: readonly [number, number]
}

export const SOURCE = 'points'
export const LAYERS = {
  clusters: 'points-clusters',
  clusterCount: 'points-cluster-count',
  points: 'points-single',
  selected: 'points-selected',
} as const

/** Clusters merge points closer than this many pixels; they split as the map zooms in. */
const CLUSTER_RADIUS = 48
const CLUSTER_MAX_ZOOM = 12
/** Glyphs every OpenFreeMap style serves. */
const COUNT_FONT = ['Noto Sans Regular']

const token = (name: string) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim()

export function pointsData(points: readonly MapPoint[]): FeatureCollection<Point> {
  return {
    type: 'FeatureCollection',
    features: points.map((point) => ({
      type: 'Feature',
      properties: { id: point.id },
      geometry: { type: 'Point', coordinates: [point.position[0], point.position[1]] },
    })),
  }
}

/**
 * Adds the points with their clusters on top of the base style. Colours come from the design
 * tokens of the current theme, so the markers follow the site in light and dark.
 */
export function addPointLayers(
  map: MapLibreMap,
  points: readonly MapPoint[],
  cluster: boolean,
  selected: string | null,
) {
  const colours = {
    marker: token('--color-pine'),
    onMarker: token('--color-on-pine'),
    halo: token('--color-surface'),
    selected: token('--color-accent'),
  }
  const source: GeoJSONSourceSpecification = {
    type: 'geojson',
    data: pointsData(points),
    ...(cluster
      ? { cluster: true, clusterRadius: CLUSTER_RADIUS, clusterMaxZoom: CLUSTER_MAX_ZOOM }
      : {}),
  }
  map.addSource(SOURCE, source)
  map.addLayer({
    id: LAYERS.clusters,
    type: 'circle',
    source: SOURCE,
    filter: ['has', 'point_count'],
    paint: {
      'circle-color': colours.marker,
      'circle-radius': ['step', ['get', 'point_count'], 16, 5, 20, 10, 24],
      'circle-stroke-width': 3,
      'circle-stroke-color': colours.halo,
    },
  })
  map.addLayer({
    id: LAYERS.clusterCount,
    type: 'symbol',
    source: SOURCE,
    filter: ['has', 'point_count'],
    layout: {
      'text-field': ['get', 'point_count_abbreviated'],
      'text-font': COUNT_FONT,
      'text-size': 13,
    },
    paint: { 'text-color': colours.onMarker },
  })
  map.addLayer({
    id: LAYERS.points,
    type: 'circle',
    source: SOURCE,
    filter: ['!', ['has', 'point_count']],
    paint: {
      'circle-color': colours.marker,
      'circle-radius': 8,
      'circle-stroke-width': 3,
      'circle-stroke-color': colours.halo,
    },
  })
  map.addLayer({
    id: LAYERS.selected,
    type: 'circle',
    source: SOURCE,
    filter: selectedFilter(selected),
    paint: {
      'circle-color': colours.selected,
      'circle-radius': 11,
      'circle-stroke-width': 3,
      'circle-stroke-color': colours.halo,
    },
  })
}

export const selectedFilter = (
  selected: string | null,
): ['all', ['!', ['has', 'point_count']], ['==', ['get', 'id'], string]] => [
  'all',
  ['!', ['has', 'point_count']],
  ['==', ['get', 'id'], selected ?? ''],
]

/** South-west and north-east corners around the points. */
export function boundsOf(points: readonly MapPoint[]): [[number, number], [number, number]] {
  const longitudes = points.map((point) => point.position[0])
  const latitudes = points.map((point) => point.position[1])
  return [
    [Math.min(...longitudes), Math.min(...latitudes)],
    [Math.max(...longitudes), Math.max(...latitudes)],
  ]
}
