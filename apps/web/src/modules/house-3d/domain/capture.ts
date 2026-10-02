import type { CameraPreset } from './camera-presets'

export interface CaptureRequest {
  readonly width: number
  readonly height: number
  readonly preset: CameraPreset
}

/** Renders the live scene once from a preset camera at a fixed size and returns a JPEG. */
export type SceneCapture = (request: CaptureRequest) => Promise<Blob | null>
