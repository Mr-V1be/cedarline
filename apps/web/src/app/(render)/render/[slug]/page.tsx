import { notFound } from 'next/navigation'

import { getServices } from '@/composition/services'
import { DEFAULT_LOCALE } from '@/i18n/locales'
import { loadProjectOverview } from '@/modules/catalog/application/project-overview'
import { isCameraPreset } from '@/modules/house-3d/domain/camera-presets'
import { isScenePresetKey } from '@/modules/house-3d/scene/presets'
import { RenderStill } from '@/modules/house-3d/ui/render-still'

export const dynamic = 'force-dynamic'

const HEX_COLOR = /^#[0-9a-f]{6}$/i

interface RenderPageProps {
  readonly params: Promise<{ slug: string }>
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>
}

/**
 * Still render of a project's 3D scene for catalog images. Optional `view` picks a camera
 * preset, `scene` the lighting preset, `facade` overrides the facade colour.
 */
export default async function RenderPage({ params, searchParams }: RenderPageProps) {
  const [{ slug }, query] = await Promise.all([params, searchParams])
  const view = typeof query.view === 'string' && isCameraPreset(query.view) ? query.view : 'corner'
  const facade =
    typeof query.facade === 'string' && HEX_COLOR.test(query.facade) ? query.facade : undefined
  const scene =
    typeof query.scene === 'string' && isScenePresetKey(query.scene) ? query.scene : 'day'
  const overview = await loadProjectOverview(
    await getServices(DEFAULT_LOCALE),
    slug,
    DEFAULT_LOCALE,
  )
  if (overview === null) notFound()
  const input =
    facade === undefined
      ? overview.viewer
      : { ...overview.viewer, options: { ...overview.viewer.options, facadeColor: facade } }
  return <RenderStill input={input} preset={view} scene={scene} label={overview.project.title} />
}
