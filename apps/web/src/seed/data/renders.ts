import type { GalleryView } from '@/modules/catalog/domain/project'
import type { CameraPreset } from '@/modules/house-3d/domain/camera-presets'
import type { ScenePresetKey } from '@/modules/house-3d/scene/presets'

/**
 * Gallery views rendered for every project, in display order, with the camera and lighting
 * that shoot them. The first is the catalog cover; the evening view leads the home page.
 */
export const GALLERY_RENDERS = [
  { view: 'front', camera: 'corner', scene: 'day' },
  { view: 'evening', camera: 'eye', scene: 'evening' },
  { view: 'back', camera: 'back', scene: 'day' },
  { view: 'side', camera: 'side', scene: 'day' },
  { view: 'aerial', camera: 'aerial', scene: 'day' },
] as const satisfies ReadonlyArray<{
  view: GalleryView
  camera: CameraPreset
  scene: ScenePresetKey
}>

export const projectRenderName = (slug: string, view: GalleryView) => `${slug}-${view}`

/** Render size: the stage's 16:11 frame, large enough for a full-width hero at 2× density. */
export const RENDER_SIZE = { width: 1800, height: 1238 } as const
