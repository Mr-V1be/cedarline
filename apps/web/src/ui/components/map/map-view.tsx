'use client'

import { MapTrifoldIcon } from '@phosphor-icons/react/ssr'
import type * as MaplibreModule from 'maplibre-gl'
import type { GeoJSONSource, Map as MapLibreMap, MapLayerMouseEvent } from 'maplibre-gl'
import { useEffect, useEffectEvent, useRef, useState } from 'react'

import { useIntentStart } from '../../hooks/use-intent-start'
import { useTheme } from '../../theme/use-theme'
import { Button } from '../button/button'
import { Skeleton } from '../skeleton/skeleton'
import { StateMessage } from '../state/state-message'
import {
  LAYERS,
  SOURCE,
  addPointLayers,
  boundsOf,
  pointsData,
  selectedFilter,
  type MapPoint,
} from './map-layers'
import './maplibre-theme.css'
import styles from './map-view.module.css'

export type { MapPoint } from './map-layers'

/** Base map styles per theme: vector tile styles of the map provider. */
export interface MapStyles {
  readonly light: string
  readonly dark: string
}

/** Where the map comes from: the provider's styles and the URL of the library module. */
export interface MapSetup {
  readonly styles: MapStyles
  readonly moduleUrl: string
}

type Maplibre = typeof MaplibreModule

const isMaplibre = (value: unknown): value is Maplibre =>
  typeof value === 'object' && value !== null && 'Map' in value && 'NavigationControl' in value

/** The library is loaded as a plain ES module from the site, outside the bundle. */
async function loadMaplibre(url: string): Promise<Maplibre> {
  const library: unknown = await import(/* webpackIgnore: true */ /* turbopackIgnore: true */ url)
  if (!isMaplibre(library)) throw new Error(`${url} is not the map library`)
  return library
}

export interface MapLabels {
  readonly title: string
  readonly zoomIn: string
  readonly zoomOut: string
  readonly attribution: string
  readonly gesturesDesktop: string
  readonly gesturesMac: string
  readonly gesturesMobile: string
  readonly loading: string
  readonly error: string
  readonly errorHint: string
  readonly retry: string
}

interface MapViewProps {
  readonly points: readonly MapPoint[]
  readonly setup: MapSetup
  readonly labels: MapLabels
  readonly selected?: string | null
  readonly onSelect?: (id: string) => void
  /** Merge nearby points into numbered clusters. */
  readonly cluster?: boolean
  /** Zoom for a single point and the closest the map gets when fitting several. */
  readonly maxZoom?: number
  readonly className?: string
}

type Phase = 'loading' | 'ready' | 'error'

/** The map library is large: it loads when the map comes near the viewport, not with the page. */
const VISIBILITY_MARGIN = '300px'
/** A style that has not loaded by then is treated as unavailable. */
const LOAD_TIMEOUT_MS = 15_000
const FIT_PADDING = 56
const FLY_ZOOM = 11

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
/** Phones and small screens start the map on intent; desktops as soon as it is in view. */
const isHandheld = () => !window.matchMedia('(pointer: fine) and (min-width: 1024px)').matches

/**
 * Interactive vector map with points and optional clusters (MapLibre). The base style follows
 * the colour theme, markers use the design tokens, and the library is fetched lazily. While it
 * loads the area keeps its size; if tiles are unreachable the visitor gets a retry.
 */
export function MapView({
  points,
  setup,
  labels,
  selected = null,
  onSelect,
  cluster = false,
  maxZoom = FLY_ZOOM,
  className,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const [visible, setVisible] = useState(false)
  const allowed = useIntentStart(isHandheld)
  const [phase, setPhase] = useState<Phase>('loading')
  const [attempt, setAttempt] = useState(0)
  const theme = useTheme()
  const themeKnown = theme !== null
  const styleUrl = theme === 'dark' ? setup.styles.dark : setup.styles.light

  const select = useEffectEvent((id: string) => onSelect?.(id))
  // Read when the map is created or its style reloads, without recreating the map.
  const current = useEffectEvent(() => ({
    points,
    cluster,
    selected,
    styleUrl,
    labels,
    maxZoom,
    moduleUrl: setup.moduleUrl,
  }))

  // Start loading once the map is about to be seen.
  useEffect(() => {
    const element = containerRef.current
    if (element === null || visible) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) setVisible(true)
      },
      { rootMargin: VISIBILITY_MARGIN },
    )
    observer.observe(element)
    return () => {
      observer.disconnect()
    }
  }, [visible])

  useEffect(() => {
    const container = containerRef.current
    if (container === null || !visible || !allowed || !themeKnown) return
    // Aborted when the effect is cleaned up: async steps check it before touching the map.
    const lifetime = new AbortController()
    const disposed = () => lifetime.signal.aborted
    let map: MapLibreMap | null = null
    const timeout = window.setTimeout(() => {
      if (!disposed() && map?.loaded() !== true) setPhase('error')
    }, LOAD_TIMEOUT_MS)

    void (async () => {
      try {
        const initial = current()
        const [maplibre] = await Promise.all([
          loadMaplibre(initial.moduleUrl),
          import('maplibre-gl/dist/maplibre-gl.css'),
        ])
        if (disposed()) return
        const single = initial.points.length === 1 ? initial.points[0] : undefined
        const view =
          single !== undefined
            ? {
                center: [single.position[0], single.position[1]] as [number, number],
                zoom: initial.maxZoom,
              }
            : initial.points.length > 0
              ? {
                  bounds: boundsOf(initial.points),
                  fitBoundsOptions: { padding: FIT_PADDING, maxZoom: initial.maxZoom },
                }
              : {}
        const created = new maplibre.Map({
          container,
          style: initial.styleUrl,
          ...view,
          attributionControl: { compact: true },
          cooperativeGestures: true,
          dragRotate: false,
          touchPitch: false,
          pitchWithRotate: false,
          locale: {
            'Map.Title': initial.labels.title,
            'NavigationControl.ZoomIn': initial.labels.zoomIn,
            'NavigationControl.ZoomOut': initial.labels.zoomOut,
            'AttributionControl.ToggleAttribution': initial.labels.attribution,
            'CooperativeGesturesHandler.WindowsHelpText': initial.labels.gesturesDesktop,
            'CooperativeGesturesHandler.MacHelpText': initial.labels.gesturesMac,
            'CooperativeGesturesHandler.MobileHelpText': initial.labels.gesturesMobile,
          },
        })
        map = created
        mapRef.current = created
        created.addControl(new maplibre.NavigationControl({ showCompass: false }), 'top-right')
        // A new style (theme switch) drops custom layers: they are added again every time.
        created.on('style.load', () => {
          const state = current()
          addPointLayers(created, state.points, state.cluster, state.selected)
        })
        created.on('load', () => {
          if (!disposed()) setPhase('ready')
        })
        created.on('error', () => {
          if (!disposed() && !created.loaded()) setPhase('error')
        })
        created.on('click', LAYERS.points, (event: MapLayerMouseEvent) => {
          const id: unknown = event.features?.[0]?.properties.id
          if (typeof id === 'string') select(id)
        })
        created.on('click', LAYERS.clusters, (event: MapLayerMouseEvent) => {
          const feature = event.features?.[0]
          const clusterId: unknown = feature?.properties.cluster_id
          const source = created.getSource<GeoJSONSource>(SOURCE)
          if (typeof clusterId !== 'number' || source === undefined || feature === undefined) return
          void source.getClusterExpansionZoom(clusterId).then((zoom) => {
            if (feature.geometry.type !== 'Point') return
            const [longitude = 0, latitude = 0] = feature.geometry.coordinates
            created.easeTo({
              center: [longitude, latitude],
              zoom,
              animate: !prefersReducedMotion(),
            })
          })
        })
        for (const layer of [LAYERS.points, LAYERS.clusters]) {
          created.on('mouseenter', layer, () => {
            created.getCanvas().style.cursor = 'pointer'
          })
          created.on('mouseleave', layer, () => {
            created.getCanvas().style.cursor = ''
          })
        }
      } catch {
        if (!disposed()) setPhase('error')
      }
    })()

    return () => {
      lifetime.abort()
      window.clearTimeout(timeout)
      map?.remove()
      mapRef.current = null
    }
  }, [visible, allowed, themeKnown, attempt])

  // Theme switch: swap the base style, the layers come back on style.load.
  useEffect(() => {
    const map = mapRef.current
    if (map === null || phase !== 'ready') return
    map.setStyle(styleUrl)
  }, [styleUrl, phase])

  useEffect(() => {
    const map = mapRef.current
    if (map === null || phase !== 'ready') return
    void map.getSource<GeoJSONSource>(SOURCE)?.setData(pointsData(points))
  }, [points, phase])

  useEffect(() => {
    const map = mapRef.current
    if (map === null || phase !== 'ready') return
    if (map.getLayer(LAYERS.selected) !== undefined) {
      map.setFilter(LAYERS.selected, selectedFilter(selected))
    }
    const point = points.find((item) => item.id === selected)
    if (point === undefined) return
    const target = {
      center: [point.position[0], point.position[1]] as [number, number],
      zoom: Math.max(map.getZoom(), maxZoom),
    }
    if (prefersReducedMotion()) map.jumpTo(target)
    else map.flyTo({ ...target, speed: 1.4 })
  }, [selected, points, phase, maxZoom])

  return (
    <div
      className={[styles.frame, className].filter(Boolean).join(' ')}
      data-map
      role="region"
      aria-label={labels.title}
      aria-busy={phase === 'loading'}
    >
      <div ref={containerRef} className={styles.map} />
      {phase === 'loading' ? (
        <div className={styles.overlay}>
          <Skeleton className={styles.skeleton} />
          <span className="visually-hidden">{labels.loading}</span>
        </div>
      ) : null}
      {phase === 'error' ? (
        <div className={styles.overlay}>
          <StateMessage
            glyph={MapTrifoldIcon}
            title={labels.error}
            description={labels.errorHint}
            tone="error"
            action={
              <Button
                variant="secondary"
                onClick={() => {
                  setPhase('loading')
                  setAttempt((value) => value + 1)
                }}
              >
                {labels.retry}
              </Button>
            }
          />
        </div>
      ) : null}
    </div>
  )
}
