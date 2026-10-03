/**
 * Builds the 3D scene assets from their CC0 sources (Poly Haven, ambientCG):
 *   skies     → public/scene/hdri/<key>.hdr (lighting) + public/scene/sky/<key>.webp (background)
 *   materials → public/scene/textures/<key>/<tier>/{color,normal,arm}.ktx2 (mipmapped KTX2)
 *   trees     → public/scene/trees/<key>/<tier>/{albedo,normal}.ktx2 (impostor atlases baked
 *               from photoscanned models in headless Chromium, software WebGL)
 * and writes src/modules/house-3d/scene/assets/generated.json (sun directions, sizes, authors).
 *
 * Needs `ktx` from KTX-Software (v4.4+), `unzip` and Playwright's Chromium. Stages can be run
 * one at a time to keep each run short:
 *   pnpm --filter @kedrovnik/web scene:assets [skies] [materials] [trees]
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

import { PATHS, readManifest } from './context.ts'
import { buildTrees } from './impostors.ts'
import { buildMaterial } from './materials.ts'
import { buildSky } from './skies.ts'

const STAGES = ['skies', 'materials', 'trees'] as const
type Stage = (typeof STAGES)[number]

const requested = process.argv
  .slice(2)
  .filter((arg): arg is Stage => (STAGES as readonly string[]).includes(arg))
const stages: readonly Stage[] = requested.length === 0 ? STAGES : requested
const manifest = readManifest()
const generated = (
  existsSync(PATHS.generated) ? JSON.parse(readFileSync(PATHS.generated, 'utf8')) : {}
) as Record<Stage, Record<string, unknown>>

/** The Basis Universal transcoder ships with three.js; the site serves its own copy. */
function copyTranscoder() {
  const source = path.join(PATHS.web, 'node_modules/three/examples/jsm/libs/basis')
  const target = path.join(PATHS.public, 'basis')
  mkdirSync(target, { recursive: true })
  for (const file of ['basis_transcoder.js', 'basis_transcoder.wasm']) {
    writeFileSync(path.join(target, file), readFileSync(path.join(source, file)))
  }
}

copyTranscoder()
if (stages.includes('skies')) {
  generated.skies = {}
  for (const [key, ref] of Object.entries(manifest.skies)) {
    generated.skies[key] = await buildSky(key, ref)
    process.stdout.write(`sky ${key}\n`)
  }
}
if (stages.includes('materials')) {
  generated.materials = {}
  for (const [key, ref] of Object.entries(manifest.materials)) {
    generated.materials[key] = await buildMaterial(key, ref)
    process.stdout.write(`material ${key}\n`)
  }
}
if (stages.includes('trees')) generated.trees = await buildTrees(manifest)
writeFileSync(PATHS.generated, `${JSON.stringify(generated, null, 2)}\n`)
