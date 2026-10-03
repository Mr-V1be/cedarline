import { getTranslations } from 'next-intl/server'

import { env } from '@/config/env'
import type { MapLabels, MapSetup } from '@/ui/components/map/map-view'
import { maplibreFileUrl } from '@/ui/components/map/vendor'

/** Map provider settings and interface texts in the visitor's language, for any page with a map. */
export async function mapProps(): Promise<{ setup: MapSetup; labels: MapLabels }> {
  const t = await getTranslations('common.map')
  return {
    setup: {
      styles: { light: env.MAP_STYLE_LIGHT_URL, dark: env.MAP_STYLE_DARK_URL },
      moduleUrl: maplibreFileUrl('maplibre-gl.mjs'),
    },
    labels: {
      title: t('title'),
      zoomIn: t('zoomIn'),
      zoomOut: t('zoomOut'),
      attribution: t('attribution'),
      gesturesDesktop: t('gesturesDesktop'),
      gesturesMac: t('gesturesMac'),
      gesturesMobile: t('gesturesMobile'),
      loading: t('loading'),
      error: t('error'),
      errorHint: t('errorHint'),
      retry: t('retry'),
    },
  }
}
