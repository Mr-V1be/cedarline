'use client'

import { useIntentStart } from '@/ui/hooks/use-intent-start'

import { detectQuality } from '../scene/quality'

const isLowTier = () => detectQuality() === 'low'

/**
 * Whether the 3D scene should start now: at once on capable devices; on phones and weak
 * devices after the first interaction or once the page has settled, with the render of the
 * same house shown meanwhile.
 */
export const useSceneActivation = (): boolean => useIntentStart(isLowTier)
