/**
 * Camera presets of the house scene. Azimuth is measured from the front facade towards the
 * right side, elevation from the horizon; both in degrees. Renders and the interactive
 * viewer share these presets so the gallery and the 3D view match.
 */
export const CAMERA_PRESETS = {
  corner: { azimuth: 34, elevation: 13 },
  front: { azimuth: 0, elevation: 7 },
  back: { azimuth: 214, elevation: 15 },
  side: { azimuth: -90, elevation: 8 },
  aerial: { azimuth: 38, elevation: 44 },
} as const satisfies Record<string, { azimuth: number; elevation: number }>

export type CameraPreset = keyof typeof CAMERA_PRESETS

/** Presets offered in the interactive viewer, in order. */
export const VIEWER_PRESETS = [
  'corner',
  'front',
  'aerial',
] as const satisfies readonly CameraPreset[]
export type ViewerPreset = (typeof VIEWER_PRESETS)[number]

export const isCameraPreset = (value: string): value is CameraPreset => value in CAMERA_PRESETS
