import type { FloorPlan, PlanDeck, PlanRect } from '@kedrovnik/house'

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

/** The footprint with everything drawn outside the walls: decks and their steps. */
export function outdoorExtent(plan: FloorPlan): PlanRect {
  const rects = plan.decks.flatMap((deck) =>
    deck.stair === null ? [deck.rect] : [deck.rect, deck.stair],
  )
  return rects.reduce<PlanRect>(
    (extent, rect) => ({
      x0: Math.min(extent.x0, rect.x0),
      y0: Math.min(extent.y0, rect.y0),
      x1: Math.max(extent.x1, rect.x1),
      y1: Math.max(extent.y1, rect.y1),
    }),
    { x0: 0, y0: 0, x1: plan.width, y1: plan.depth },
  )
}

/** Drawing extent: the footprint, decks, steps and room for the dimension chains. */
export function drawingBounds(
  plan: FloorPlan,
  margins: { readonly near: number; readonly far: number },
): PlanRect {
  const extent = outdoorExtent(plan)
  return {
    x0: extent.x0 - margins.near,
    y0: extent.y0 - margins.near,
    x1: extent.x1 + margins.far,
    y1: extent.y1 + margins.far,
  }
}

/** Nosing lines of an entrance flight, parallel to the wall it leads away from. */
export function entranceTreads(
  deck: PlanDeck,
): Array<{ x1: number; y1: number; x2: number; y2: number }> {
  const { stair, steps } = deck
  if (stair === null) return []
  const alongX = deck.side === 'front' || deck.side === 'back'
  const run = (alongX ? stair.y1 - stair.y0 : stair.x1 - stair.x0) / steps
  return Array.from({ length: steps - 1 }, (_, index) => {
    const offset = (index + 1) * run
    return alongX
      ? { x1: stair.x0, y1: stair.y0 + offset, x2: stair.x1, y2: stair.y0 + offset }
      : { x1: stair.x0 + offset, y1: stair.y0, x2: stair.x0 + offset, y2: stair.y1 }
  })
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
