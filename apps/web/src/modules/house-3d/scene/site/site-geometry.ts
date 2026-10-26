import type { GroundRect, SiteAnchors } from '@cedarline/house'
import { BoxGeometry, BufferAttribute, PlaneGeometry, type BufferGeometry } from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

/** Horizontal plane with UVs in metres, so tiled textures keep their real size. */
export function metricPlane(width: number, depth: number, segments = 1): BufferGeometry {
  const plane = new PlaneGeometry(width, depth, segments, segments).rotateX(-Math.PI / 2)
  const positions = plane.getAttribute('position')
  const uvs = new Float32Array(positions.count * 2)
  for (let index = 0; index < positions.count; index += 1) {
    uvs[index * 2] = positions.getX(index)
    uvs[index * 2 + 1] = -positions.getZ(index)
  }
  plane.setAttribute('uv', new BufferAttribute(uvs, 2))
  return plane
}

/**
 * A box between two ground corners and two heights, with metric UVs on every face: tops map
 * x/z, sides map their run and height, so slabs and kerbs keep their texture's real scale.
 */
export function metricBox(rect: GroundRect, bottom: number, top: number): BufferGeometry {
  const [x0, z0] = rect.min
  const [x1, z1] = rect.max
  const box = new BoxGeometry(x1 - x0, top - bottom, z1 - z0).translate(
    (x0 + x1) / 2,
    (bottom + top) / 2,
    (z0 + z1) / 2,
  )
  const positions = box.getAttribute('position')
  const normals = box.getAttribute('normal')
  const uvs = new Float32Array(positions.count * 2)
  for (let index = 0; index < positions.count; index += 1) {
    const [x, y, z] = [positions.getX(index), positions.getY(index), positions.getZ(index)]
    const [u, v] =
      Math.abs(normals.getY(index)) > 0.5
        ? [x, -z]
        : Math.abs(normals.getX(index)) > 0.5
          ? [z, y]
          : [x, y]
    uvs[index * 2] = u
    uvs[index * 2 + 1] = v
  }
  box.setAttribute('uv', new BufferAttribute(uvs, 2))
  return box
}

const overlaps = (a: GroundRect, b: GroundRect) =>
  a.min[0] < b.max[0] && b.min[0] < a.max[0] && a.min[1] < b.max[1] && b.min[1] < a.max[1]

/** Parts of a strip outside an obstacle, cut along the strip's long axis. */
function cut(strip: GroundRect, obstacle: GroundRect): GroundRect[] {
  if (!overlaps(strip, obstacle)) return [strip]
  const alongX = strip.max[0] - strip.min[0] >= strip.max[1] - strip.min[1]
  const axis = alongX ? 0 : 1
  const pieces: GroundRect[] = []
  if (obstacle.min[axis] > strip.min[axis]) {
    const max: [number, number] = [strip.max[0], strip.max[1]]
    max[axis] = obstacle.min[axis]
    pieces.push({ min: strip.min, max })
  }
  if (obstacle.max[axis] < strip.max[axis]) {
    const min: [number, number] = [strip.min[0], strip.min[1]]
    min[axis] = obstacle.max[axis]
    pieces.push({ min, max: strip.max })
  }
  return pieces
}

/**
 * The blind area (отмостка): a paved strip around the walls that sheds rain away from the
 * plinth, left out under the terrace and porches, which have their own decks and steps.
 */
export function blindAreaGeometry(
  site: SiteAnchors,
  width: number,
  height: number,
): BufferGeometry | null {
  const { min, max } = site.footprint
  const strips: GroundRect[] = [
    { min: [min[0] - width, max[1]], max: [max[0] + width, max[1] + width] },
    { min: [min[0] - width, min[1] - width], max: [max[0] + width, min[1]] },
    { min: [min[0] - width, min[1]], max: [min[0], max[1]] },
    { min: [max[0], min[1]], max: [max[0] + width, max[1]] },
  ]
  const obstacles = site.landings.flatMap((landing) => [landing.deck, landing.stair])
  const pieces = obstacles.reduce(
    (remaining, obstacle) => remaining.flatMap((strip) => cut(strip, obstacle)),
    strips,
  )
  if (pieces.length === 0) return null
  const boxes = pieces.map((piece) => metricBox(piece, -height, height))
  const merged = mergeGeometries(boxes)
  boxes.forEach((box) => {
    box.dispose()
  })
  return merged
}
