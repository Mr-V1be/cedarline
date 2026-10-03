import {
  createReadStream,
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { createServer, type Server } from 'node:http'
import path from 'node:path'

import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { prune } from '@gltf-transform/functions'
import { chromium } from 'playwright'
import sharp from 'sharp'

import {
  PATHS,
  TREE_TIERS,
  colourKtx,
  download,
  normalKtx,
  polyhaven,
  polyhavenAuthors,
  type Manifest,
  type TreeRef,
} from './context.ts'

/** The bake page is served locally: large models are streamed, not passed through the driver. */
const BAKE_PORT = 46190
const ORIGIN = `http://127.0.0.1:${BAKE_PORT}`
const THREE_ROOT = path.join(PATHS.web, 'node_modules/three')
const BAKE_PAGE = path.join(import.meta.dirname, 'bake/impostor-bake.js')
/** Passes of colour bleeding into transparent texels, so mipmaps do not fringe dark. */
const DILATE_PASSES = 12
/** Normal atlases are half the albedo resolution: lighting varies slowly across a tree. */
const NORMAL_SHARE = 0.5

const CONTENT_TYPES: Record<string, string> = {
  '.js': 'text/javascript',
  '.gltf': 'model/gltf+json',
  '.glb': 'model/gltf-binary',
  '.bin': 'application/octet-stream',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
}

/** Downloads a Poly Haven model (glTF, 1k textures) into the cache; returns the .gltf path. */
async function fetchModel(id: string): Promise<string> {
  const files = (await polyhaven(`files/${id}`)) as {
    gltf: Record<string, { gltf: { url: string; include: Record<string, { url: string }> } }>
  }
  const entry = files.gltf['1k']?.gltf
  if (entry === undefined) throw new Error(`No 1k glTF for ${id}`)
  const folder = path.join(PATHS.cache, 'models', id)
  const gltf = await download(entry.url, path.join(folder, `${id}.gltf`))
  for (const [relative, include] of Object.entries(entry.include)) {
    await download(include.url, path.join(folder, relative))
  }
  return gltf
}

/**
 * One tree as its own binary glTF: Poly Haven ships several trees per file, and a browser
 * loading only the one it renders needs a fraction of the memory.
 */
async function prepareTree(id: string, node: string): Promise<string> {
  const output = path.join(PATHS.cache, 'models', id, `${node}.glb`)
  if (existsSync(output)) return output
  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS)
  const document = await io.read(await fetchModel(id))
  const root = document.getRoot()
  if (!root.listNodes().some((candidate) => candidate.getName() === node)) {
    throw new Error(`No node ${node} in ${id}`)
  }
  for (const other of root.listNodes()) {
    if (other.getName() !== node && other.getParentNode() === null) other.dispose()
  }
  await document.transform(prune())
  await io.write(output, document)
  return output
}

/** Bleeds opaque colours into transparent texels, keeping the alpha channel as it is. */
function dilate(rgba: Buffer, width: number, height: number): Buffer {
  const data = Buffer.from(rgba)
  const filled = new Uint8Array(width * height)
  for (let index = 0; index < width * height; index += 1) {
    filled[index] = (data[index * 4 + 3] ?? 0) > 0 ? 1 : 0
  }
  for (let pass = 0; pass < DILATE_PASSES; pass += 1) {
    const next = filled.slice()
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const index = y * width + x
        if (filled[index] === 1) continue
        let r = 0
        let g = 0
        let b = 0
        let count = 0
        for (const [dx, dy] of [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ] as const) {
          const nx = x + dx
          const ny = y + dy
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue
          const neighbour = ny * width + nx
          if (filled[neighbour] !== 1) continue
          r += data[neighbour * 4] ?? 0
          g += data[neighbour * 4 + 1] ?? 0
          b += data[neighbour * 4 + 2] ?? 0
          count += 1
        }
        if (count === 0) continue
        data[index * 4] = r / count
        data[index * 4 + 1] = g / count
        data[index * 4 + 2] = b / count
        next[index] = 1
      }
    }
    filled.set(next)
  }
  return data
}

const fromDataUrl = (url: string) => Buffer.from(url.slice(url.indexOf(',') + 1), 'base64')

interface BakedTree {
  readonly albedo: string
  readonly normal: string
  readonly height: number
  readonly radius: number
  readonly centreY: number
}

function pageHtml(model: string, manifest: Manifest) {
  const config = {
    modelUrl: `${ORIGIN}/model/${path.basename(model)}`,
    grid: manifest.impostor.grid,
    cell: manifest.impostor.cell,
  }
  return `<!doctype html><script type="importmap">{"imports":{"three":"${ORIGIN}/three/build/three.module.js","three/addons/":"${ORIGIN}/three/examples/jsm/"}}</script>
<script>window.__bakeConfig=${JSON.stringify(config)}</script><script type="module" src="${ORIGIN}/bake.js"></script>`
}

/** Serves the bake page, three.js and the model folder to the headless browser. */
function serve(model: string, manifest: Manifest): Promise<Server> {
  const folder = path.dirname(model)
  const server = createServer((request, response) => {
    const url = new URL(request.url ?? '/', ORIGIN)
    if (url.pathname === '/') {
      response.writeHead(200, { 'content-type': 'text/html' })
      response.end(pageHtml(model, manifest))
      return
    }
    const file = url.pathname.startsWith('/three/')
      ? path.join(THREE_ROOT, url.pathname.slice('/three/'.length))
      : url.pathname === '/bake.js'
        ? BAKE_PAGE
        : path.join(folder, path.basename(decodeURIComponent(url.pathname)))
    if (!existsSync(file) || !statSync(file).isFile()) {
      response.writeHead(404)
      response.end()
      return
    }
    response.writeHead(200, {
      'content-type': CONTENT_TYPES[path.extname(file)] ?? 'application/octet-stream',
    })
    createReadStream(file).pipe(response)
  })
  return new Promise((resolve) => {
    server.listen(BAKE_PORT, '127.0.0.1', () => {
      resolve(server)
    })
  })
}

/** Renders one tree in headless Chromium (software WebGL). */
async function bakeTree(model: string, manifest: Manifest): Promise<BakedTree> {
  const server = await serve(model, manifest)
  const browser = await chromium.launch({
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
  })
  try {
    const page = await browser.newPage()
    const failure = new Promise<never>((_, reject) => {
      page.on('pageerror', reject)
      page.on('crash', () => {
        reject(new Error(`The bake page crashed while rendering ${path.basename(model)}`))
      })
    })
    await page.goto(`${ORIGIN}/`)
    await Promise.race([
      page.waitForFunction(() => '__bakeResult' in window, undefined, { timeout: 0 }),
      failure,
    ])
    return (await page.evaluate(
      () => (window as unknown as { __bakeResult: unknown }).__bakeResult,
    )) as BakedTree
  } finally {
    await browser.close()
    server.close()
  }
}

const workFolder = (key: string) => path.join(PATHS.cache, 'work', 'trees', key)

/** Stores the raw bake so encoding can be repeated without rendering again. */
async function storeBake(key: string, baked: BakedTree) {
  const work = workFolder(key)
  mkdirSync(work, { recursive: true })
  for (const [name, source] of [
    ['albedo', baked.albedo],
    ['normal', baked.normal],
  ] as const) {
    const { data, info } = await sharp(fromDataUrl(source))
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true })
    await sharp(dilate(data, info.width, info.height), {
      raw: { width: info.width, height: info.height, channels: 4 },
    })
      .png()
      .toFile(path.join(work, `${name}.png`))
  }
  const dimensions = { height: baked.height, radius: baked.radius, centreY: baked.centreY }
  writeFileSync(path.join(work, 'dimensions.json'), JSON.stringify(dimensions))
}

async function encodeTree(key: string, manifest: Manifest) {
  const atlas = manifest.impostor.grid * manifest.impostor.cell
  const work = workFolder(key)
  for (const [tier, share] of Object.entries(TREE_TIERS)) {
    const out = path.join(PATHS.public, 'trees', key, tier)
    mkdirSync(out, { recursive: true })
    const albedo = path.join(work, `albedo-${tier}.png`)
    const normal = path.join(work, `normal-${tier}.png`)
    await sharp(path.join(work, 'albedo.png'))
      .resize(Math.round(atlas * share))
      .png()
      .toFile(albedo)
    await sharp(path.join(work, 'normal.png'))
      .resize(Math.round(atlas * share * NORMAL_SHARE))
      .removeAlpha()
      .png()
      .toFile(normal)
    colourKtx(albedo, path.join(out, 'albedo.ktx2'), true)
    normalKtx(normal, path.join(out, 'normal.ktx2'))
  }
}

const baked = (key: string) => existsSync(path.join(workFolder(key), 'dimensions.json'))
const round = (value: number) => Math.round(value * 1000) / 1000

/**
 * Bakes every tree of the manifest into impostor atlases and returns their dimensions. A tree
 * baked before is only re-encoded: rendering is the slow part and its result is cached.
 */
export async function buildTrees(manifest: Manifest) {
  const generated: Record<string, unknown> = {}
  for (const [key, ref] of Object.entries<TreeRef>(manifest.trees)) {
    if (!baked(key))
      await storeBake(key, await bakeTree(await prepareTree(ref.id, ref.node), manifest))
    const authors = await polyhavenAuthors(ref.id)
    {
      await encodeTree(key, manifest)
      const dimensions = JSON.parse(
        readFileSync(path.join(workFolder(key), 'dimensions.json'), 'utf8'),
      ) as Omit<BakedTree, 'albedo' | 'normal'>
      generated[key] = {
        height: round(dimensions.height),
        radius: round(dimensions.radius),
        centreY: round(dimensions.centreY),
        authors,
      }
      process.stdout.write(`tree ${key}\n`)
    }
  }
  return generated
}
