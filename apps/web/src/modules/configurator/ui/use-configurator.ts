'use client'

import {
  Configurator,
  ConfiguratorError,
  type Choice,
  type Configuration,
  type ConfigurationState,
} from '@kedrovnik/configurator'
import { useMemo, useState } from 'react'

import type { ConfiguratorView } from '../application/open-configurator'
import { stepOfGroup, visibleSteps, type Step, type StepKey } from './steps/steps'

export interface ConfiguratorController {
  readonly configuration: Configuration
  readonly state: ConfigurationState
  readonly steps: readonly Step[]
  readonly step: Step
  readonly camera: Step['camera']
  /** Bumps on every applied choice; the summary uses it to announce the new total. */
  readonly revision: number
  readonly choose: (choice: Choice) => void
  readonly goTo: (step: StepKey) => void
}

/**
 * Configurator state in the browser: the configuration, its evaluated state and the current
 * step. Every choice is applied through the domain, which refuses impossible ones; the
 * interface only offers possible ones anyway.
 */
export function useConfigurator(view: ConfiguratorView): ConfiguratorController {
  const configurator = useMemo(() => new Configurator(view.model), [view.model])
  const [configuration, setConfiguration] = useState(view.initial)
  const [stepKey, setStepKey] = useState<StepKey>('size')
  const [camera, setCamera] = useState<Step['camera']>('aerial')
  const [revision, setRevision] = useState(0)

  const state = useMemo(() => configurator.evaluate(configuration), [configurator, configuration])
  const steps = useMemo(() => visibleSteps(state), [state])
  const step =
    steps.find((candidate) => candidate.key === stepKey) ?? steps[0] ?? stepOfGroup('footprint')

  return {
    configuration,
    state,
    steps,
    step,
    camera,
    revision,
    choose: (choice) => {
      try {
        setConfiguration(configurator.apply(configuration, choice))
        setCamera(stepOfGroup(choice.group).camera)
        setRevision((value) => value + 1)
      } catch (error) {
        // A blocked choice is not offered; a stale click after a change is simply ignored.
        if (!(error instanceof ConfiguratorError)) throw error
      }
    },
    goTo: (key) => {
      const target = steps.find((candidate) => candidate.key === key)
      if (target === undefined) return
      setStepKey(target.key)
      setCamera(target.camera)
    },
  }
}
