import type { ConfigurationState, OptionGroup } from '@cedarline/configurator'

import type { CameraPreset } from '@/modules/house-3d/domain/camera-presets'

/** Steps of the configurator: which option groups each shows and where the camera looks. */
export const STEPS = [
  { key: 'size', groups: ['footprint', 'layout'], camera: 'aerial' },
  { key: 'storeys', groups: ['project'], camera: 'corner' },
  { key: 'roof', groups: ['roof'], camera: 'corner' },
  { key: 'facade', groups: ['facade', 'colour'], camera: 'front' },
  { key: 'windows', groups: ['windows'], camera: 'eye' },
  { key: 'terrace', groups: ['terrace'], camera: 'front' },
  { key: 'insulation', groups: ['insulation'], camera: 'side' },
  { key: 'services', groups: ['completeness', 'engineering'], camera: 'back' },
  { key: 'summary', groups: [], camera: 'corner' },
] as const satisfies ReadonlyArray<{
  readonly key: string
  readonly groups: readonly OptionGroup[]
  readonly camera: CameraPreset
}>

export type Step = (typeof STEPS)[number]
export type StepKey = Step['key']

/**
 * Steps worth showing for this project: a step with nothing to choose (one storey variant,
 * no terrace) is left out. Size, services and the summary are always there.
 */
export function visibleSteps(state: ConfigurationState): readonly Step[] {
  const choices = (group: OptionGroup) =>
    state.groups.find((candidate) => candidate.group === group)?.choices.length ?? 0
  return STEPS.filter((step) =>
    step.key === 'summary' || step.key === 'size' || step.key === 'services'
      ? true
      : step.groups.some((group) => choices(group) > 1),
  )
}

export const stepOfGroup = (group: OptionGroup): Step =>
  STEPS.find((step) => (step.groups as readonly OptionGroup[]).includes(group)) ?? STEPS[0]
