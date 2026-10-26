'use client'

import { houseModel, measureHouse, type HouseModel } from '@cedarline/house'
import { useMemo } from 'react'

import type { HouseViewerInput } from '@/modules/catalog/application/project-overview'

/** Builds the mesh from the same domain model that measures and prices the house. */
export function useHouseModel(input: HouseViewerInput): HouseModel {
  return useMemo(() => houseModel(measureHouse(input)), [input])
}
