import type { FacadeFinish } from '@kedrovnik/house'
import { CanvasTexture, RepeatWrapping, SRGBColorSpace, type Texture } from 'three'

const SIZE = 512

/** Pattern texture with its real-world repeat in metres. */
export interface Pattern {
  readonly map: Texture
  readonly bump: Texture
  /** Metres covered by one texture tile along u and v. */
  readonly tile: readonly [number, number]
}

type Painter = (context: CanvasRenderingContext2D, bump: boolean) => void

function canvasTexture(paint: Painter, bump: boolean): Texture {
  const canvas = document.createElement('canvas')
  canvas.width = SIZE
  canvas.height = SIZE
  const context = canvas.getContext('2d')
  if (context === null) throw new Error('2D canvas is not available')
  paint(context, bump)
  const texture = new CanvasTexture(canvas)
  texture.wrapS = RepeatWrapping
  texture.wrapT = RepeatWrapping
  texture.anisotropy = 8
  if (!bump) texture.colorSpace = SRGBColorSpace
  return texture
}

/** Deterministic pseudo-random tone per board, so renders are reproducible. */
const tone = (index: number) => {
  const value = Math.sin(index * 12.9898) * 43758.5453
  return value - Math.floor(value)
}

const grey = (value: number) => {
  const channel = Math.round(Math.max(0, Math.min(1, value)) * 255)
  return `rgb(${channel},${channel},${channel})`
}

/** Horizontal boards; `profile` shades each board, `gap` is the dark joint between boards. */
function boards(count: number, gap: number, profile: 'rounded' | 'flat'): Painter {
  return (context, bump) => {
    const height = SIZE / count
    for (let index = 0; index < count; index += 1) {
      const top = index * height
      const base = bump ? 0.62 : 0.9 + tone(index) * 0.1
      if (profile === 'rounded') {
        const gradient = context.createLinearGradient(0, top, 0, top + height)
        gradient.addColorStop(0, grey(base + (bump ? 0.3 : 0.06)))
        gradient.addColorStop(0.55, grey(base))
        gradient.addColorStop(1, grey(base - (bump ? 0.35 : 0.14)))
        context.fillStyle = gradient
      } else {
        context.fillStyle = grey(base)
      }
      context.fillRect(0, top, SIZE, height)
      context.fillStyle = grey(bump ? 0 : 0.42)
      context.fillRect(0, top + height - gap, SIZE, gap)
    }
  }
}

/** Large panels with thin seams on a two-panel grid. */
const panels: Painter = (context, bump) => {
  context.fillStyle = grey(bump ? 0.6 : 0.97)
  context.fillRect(0, 0, SIZE, SIZE)
  context.fillStyle = grey(bump ? 0 : 0.6)
  context.fillRect(0, SIZE / 2 - 2, SIZE, 4)
  context.fillRect(0, SIZE - 4, SIZE, 4)
  context.fillRect(SIZE - 4, 0, 4, SIZE)
}

/** Standing seams of a metal roof, running down the slope. */
const seams: Painter = (context, bump) => {
  context.fillStyle = grey(bump ? 0.5 : 0.94)
  context.fillRect(0, 0, SIZE, SIZE)
  const step = SIZE / 2
  for (let x = 0; x < SIZE; x += step) {
    context.fillStyle = grey(bump ? 1 : 1)
    context.fillRect(x, 0, 6, SIZE)
    context.fillStyle = grey(bump ? 0.2 : 0.7)
    context.fillRect(x + 6, 0, 4, SIZE)
  }
}

interface PatternRecipe {
  readonly painter: Painter
  readonly tile: readonly [number, number]
}

/** Board widths are the real ones: 146 mm imitation timber, 140 mm planken, 1.2 × 0.6 m panels. */
const FACADE_PATTERNS: Readonly<Record<FacadeFinish, PatternRecipe>> = {
  'timber-imitation': { painter: boards(8, 5, 'rounded'), tile: [1.168, 1.168] },
  planken: { painter: boards(8, 9, 'flat'), tile: [1.12, 1.12] },
  'fiber-cement': { painter: panels, tile: [1.2, 1.2] },
}

const ROOF_PATTERN: PatternRecipe = { painter: seams, tile: [1.04, 1.04] }
const DECK_PATTERN: PatternRecipe = { painter: boards(8, 10, 'flat'), tile: [1.2, 1.2] }

const cache = new Map<string, Pattern>()

function pattern(key: string, recipe: PatternRecipe): Pattern {
  const cached = cache.get(key)
  if (cached !== undefined) return cached
  const created = {
    map: canvasTexture(recipe.painter, false),
    bump: canvasTexture(recipe.painter, true),
    tile: recipe.tile,
  }
  cache.set(key, created)
  return created
}

export const facadePattern = (finish: FacadeFinish) =>
  pattern(`facade:${finish}`, FACADE_PATTERNS[finish])
export const roofPattern = () => pattern('roof', ROOF_PATTERN)
export const deckPattern = () => pattern('deck', DECK_PATTERN)
