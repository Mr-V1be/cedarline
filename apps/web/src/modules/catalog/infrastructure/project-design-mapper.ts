import type { HouseDesign, HouseOptions } from '@kedrovnik/house'

import type { Project } from '@/cms/generated/payload-types'

import type { ProjectionInput } from '../application/project-projection'

type Relation<T extends { id: number }> = number | T

export const relationId = <T extends { id: number }>(value: Relation<T>): number =>
  typeof value === 'number' ? value : value.id

export type ProjectSource = Pick<Project, 'design' | 'defaults'> &
  Partial<Pick<Project, 'slug' | 'configurator'>>

/** CMS design group → house domain design. Room kinds are referenced by stable keys. */
export function toHouseDesign(
  design: Project['design'],
  roomKeyOf: (id: number) => string,
): HouseDesign {
  const terrace = design.terrace
  const chimney = design.chimney
  return {
    width: design.width,
    depth: design.depth,
    storeys: design.storeys,
    attic: design.attic ?? false,
    storeyHeight: design.storeyHeight,
    ridgeAxis: design.ridgeAxis,
    rooms: (design.rooms ?? []).map((room) => ({
      id: room.key,
      kind: roomKeyOf(relationId(room.kind)),
      level: room.level,
      x: room.x,
      y: room.y,
      width: room.width,
      depth: room.depth,
    })),
    openings: (design.openings ?? []).map((opening) => ({
      id: opening.key,
      type: opening.type,
      role: opening.role,
      side: opening.side,
      level: opening.level,
      offset: opening.offset,
      width: opening.width,
      height: opening.height,
      sill: opening.sill,
      ...(opening.panoramicWidth ? { panoramicWidth: opening.panoramicWidth } : {}),
    })),
    doors: (design.doors ?? []).map((door) => ({
      id: door.key,
      level: door.level,
      x: door.x,
      y: door.y,
      width: door.width,
      orientation: door.orientation,
    })),
    terrace:
      terrace?.enabled === true
        ? {
            side: terrace.side ?? 'front',
            offset: terrace.offset ?? 0,
            length: terrace.length ?? 0,
            depth: terrace.depth ?? 0,
          }
        : null,
    chimney: chimney?.enabled === true ? { x: chimney.x ?? 0, y: chimney.y ?? 0 } : null,
  }
}

export function toHouseOptions(defaults: Project['defaults']): HouseOptions {
  return {
    roofKind: defaults.roofKind,
    roofPitch: defaults.roofPitch,
    facadeFinish: defaults.facadeFinish,
    facadeColor: defaults.facadeColor,
    windowStyle: defaults.windowStyle,
    insulation: defaults.insulation,
  }
}

export function toProjectionInput(
  source: ProjectSource,
  roomKeyOf: (id: number) => string,
): ProjectionInput {
  return {
    design: toHouseDesign(source.design, roomKeyOf),
    options: toHouseOptions(source.defaults),
    engineering: source.defaults.engineering ?? [],
  }
}
