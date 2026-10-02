import type { FloorPlan, PlanRect } from '@kedrovnik/house'

/** A partition strip on a room axis that is not part of the outer contour. */
export interface PartitionSegment {
  readonly orientation: 'horizontal' | 'vertical'
  /** y for horizontal, x for vertical segments. */
  readonly at: number
  readonly from: number
  readonly to: number
}

/**
 * Interior partitions from room rectangles: every room edge inside the footprint is a wall
 * axis. Edges shared by two rooms are merged so each partition is drawn once.
 */
export function partitions(plan: FloorPlan): PartitionSegment[] {
  const segments = new Map<string, PartitionSegment>()
  const add = (segment: PartitionSegment) => {
    if (segment.to - segment.from <= 0) return
    segments.set(`${segment.orientation}:${segment.at}:${segment.from}:${segment.to}`, segment)
  }
  for (const { axes } of plan.rooms) {
    if (axes.y0 > 0) add({ orientation: 'horizontal', at: axes.y0, from: axes.x0, to: axes.x1 })
    if (axes.y1 < plan.depth)
      add({ orientation: 'horizontal', at: axes.y1, from: axes.x0, to: axes.x1 })
    if (axes.x0 > 0) add({ orientation: 'vertical', at: axes.x0, from: axes.y0, to: axes.y1 })
    if (axes.x1 < plan.width)
      add({ orientation: 'vertical', at: axes.x1, from: axes.y0, to: axes.y1 })
  }
  return [...segments.values()]
}

/** Drawing extent: the footprint, the terrace and room for the dimension chains. */
export function drawingBounds(
  plan: FloorPlan,
  margins: { readonly near: number; readonly far: number },
): PlanRect {
  const terrace = plan.terrace
  return {
    x0: Math.min(0, terrace?.x0 ?? 0) - margins.near,
    y0: Math.min(0, terrace?.y0 ?? 0) - margins.near,
    x1: Math.max(plan.width, terrace?.x1 ?? 0) + margins.far,
    y1: Math.max(plan.depth, terrace?.y1 ?? 0) + margins.far,
  }
}

/** Treads of a straight flight across the longer side of a stair room, mm. */
export const TREAD = 280

export function treads(rect: PlanRect): Array<{ x1: number; y1: number; x2: number; y2: number }> {
  const horizontal = rect.x1 - rect.x0 >= rect.y1 - rect.y0
  const length = horizontal ? rect.x1 - rect.x0 : rect.y1 - rect.y0
  const count = Math.floor(length / TREAD)
  return Array.from({ length: count }, (_, index) => {
    const offset = (index + 1) * TREAD
    return horizontal
      ? { x1: rect.x0 + offset, y1: rect.y0, x2: rect.x0 + offset, y2: rect.y1 }
      : { x1: rect.x0, y1: rect.y0 + offset, x2: rect.x1, y2: rect.y0 + offset }
  })
}
