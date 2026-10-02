import type { GalleryView } from '@/modules/catalog/domain/project'
import type { CameraPreset } from '@/modules/house-3d/domain/camera-presets'

/** Gallery views rendered for every project, in display order, with the camera that shoots them. */
export const GALLERY_RENDERS = [
  { view: 'front', camera: 'corner' },
  { view: 'back', camera: 'back' },
  { view: 'side', camera: 'side' },
  { view: 'aerial', camera: 'aerial' },
] as const satisfies ReadonlyArray<{ view: GalleryView; camera: CameraPreset }>

export const projectRenderName = (slug: string, view: GalleryView) => `${slug}-${view}`

/** Render size: the stage's 16:11 frame, large enough for a full-width hero at 2× density. */
export const RENDER_SIZE = { width: 1800, height: 1238 } as const
