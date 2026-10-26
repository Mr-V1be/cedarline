// Cuts the recorded takes into the product video: browse → configurator → PDF proposal →
// lead and letter → end card, with short crossfades. H.264, no sound, one file per format.
//
// usage: node scripts/video/assemble.mjs <landscape|portrait>
import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, rmSync } from 'node:fs'
import path from 'node:path'

import sharp from 'sharp'

import { BRAND_COLOURS, BRAND_NAME, MARK_GRID, markLines } from '../../src/ui/brand/brand.ts'

const FORMATS = {
  landscape: { width: 1920, height: 1080 },
  portrait: { width: 1080, height: 1920 },
}
const FPS = 30
const FADE = 0.4
const PROPOSAL_SECONDS = 4.5
const END_SECONDS = 2.6
const PAPER = BRAND_COLOURS.paper
const INK = BRAND_COLOURS.ink

const format = process.argv[2]
const size = FORMATS[format]
if (size === undefined) {
  console.error('usage: assemble.mjs <landscape|portrait>')
  process.exit(2)
}
const root = path.resolve(import.meta.dirname, '../../../..')
const takes = path.join(root, '.run/video', format)
const work = path.join(takes, 'cut')
const output = path.join(root, 'docs/case/video', `${BRAND_NAME.toLowerCase()}-${format}.mp4`)
rmSync(work, { recursive: true, force: true })
mkdirSync(work, { recursive: true })
mkdirSync(path.dirname(output), { recursive: true })

const ffmpeg = (...args) =>
  execFileSync('nice', ['-n', '10', 'ffmpeg', '-v', 'error', '-y', ...args])
const duration = (file) =>
  Number(
    execFileSync('ffprobe', [
      '-v',
      'error',
      '-show_entries',
      'format=duration',
      '-of',
      'csv=p=0',
      file,
    ])
      .toString()
      .trim(),
  )
const encode = [
  '-c:v',
  'libx264',
  '-preset',
  'medium',
  '-crf',
  '18',
  '-pix_fmt',
  'yuv420p',
  '-r',
  String(FPS),
]
const take = (name) => JSON.parse(readFileSync(path.join(takes, name, 'frames/take.json'), 'utf8'))

/** One take as a constant-frame-rate clip, frames held for as long as they were on screen. */
function takeClip(name) {
  const clip = path.join(work, `${name}.mp4`)
  ffmpeg(
    '-f',
    'concat',
    '-safe',
    '0',
    '-i',
    path.join(takes, name, 'frames/frames.ffconcat'),
    '-vf',
    `fps=${FPS},scale=${size.width}:${size.height}:flags=lanczos,setsar=1`,
    ...encode,
    clip,
  )
  return clip
}

function cut(source, name, from, to) {
  const clip = path.join(work, `${name}.mp4`)
  ffmpeg(
    '-ss',
    from.toFixed(3),
    ...(to === undefined ? [] : ['-to', to.toFixed(3)]),
    '-i',
    source,
    ...encode,
    clip,
  )
  return clip
}

/** A still as a clip with a slow push-in. */
function stillClip(image, name, seconds) {
  const clip = path.join(work, `${name}.mp4`)
  const frames = Math.round(seconds * FPS)
  ffmpeg(
    '-loop',
    '1',
    '-i',
    image,
    '-vf',
    `scale=${size.width * 2}:${size.height * 2},zoompan=z='1+0.04*on/${frames}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=${size.width}x${size.height}:fps=${FPS},setsar=1`,
    '-t',
    seconds.toFixed(3),
    ...encode,
    clip,
  )
  return clip
}

/** The proposal pages on drafting paper, as the customer receives them. */
async function proposalImage() {
  const pdf = path.join(takes, 'configure/proposal.pdf')
  const prefix = path.join(work, 'page')
  execFileSync('pdftoppm', ['-r', '200', '-png', '-f', '1', '-l', '2', pdf, prefix])
  const pages = [`${prefix}-1.png`, `${prefix}-2.png`]
  const landscape = size.width > size.height
  const pageHeight = landscape ? Math.round(size.height * 0.86) : Math.round(size.height * 0.44)
  const pageWidth = Math.round(pageHeight / Math.SQRT2)
  const gap = landscape ? 64 : 48
  const resized = await Promise.all(
    pages.map((file) => sharp(file).resize(pageWidth, pageHeight).png().toBuffer()),
  )
  const shadow = await sharp({
    create: {
      width: pageWidth + 60,
      height: pageHeight + 60,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      {
        input: Buffer.from(
          `<svg width="${pageWidth + 60}" height="${pageHeight + 60}"><rect x="30" y="38" width="${pageWidth}" height="${pageHeight}" fill="rgba(31,36,33,0.28)"/></svg>`,
        ),
      },
    ])
    .blur(16)
    .png()
    .toBuffer()
  const positions = landscape
    ? resized.map((_, index) => ({
        left: Math.round(size.width / 2 - pageWidth - gap / 2 + index * (pageWidth + gap)),
        top: Math.round((size.height - pageHeight) / 2),
      }))
    : resized.map((_, index) => ({
        left: Math.round((size.width - pageWidth) / 2),
        top: Math.round(size.height / 2 - pageHeight - gap / 2 + index * (pageHeight + gap)),
      }))
  const image = path.join(work, 'proposal.png')
  await sharp({
    create: { width: size.width, height: size.height, channels: 3, background: PAPER },
  })
    .composite([
      ...positions.map(({ left, top }) => ({ input: shadow, left: left - 30, top: top - 30 })),
      ...resized.map((input, index) => ({ input, ...positions[index] })),
    ])
    .png()
    .toFile(image)
  return image
}

/** End card: the mark and the name in the site's fonts on drafting paper. */
async function endCardImage() {
  const scale = Math.min(size.width, size.height) / 1080
  const mark = 150 * scale
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size.width}" height="${size.height}">
    <rect width="100%" height="100%" fill="${PAPER}"/>
    <g transform="translate(${size.width / 2 - mark / 2} ${size.height / 2 - mark - 40 * scale}) scale(${mark / MARK_GRID})">${markLines(BRAND_COLOURS.pine)}</g>
    <text x="50%" y="${size.height / 2 + 70 * scale}" text-anchor="middle" font-family="Literata" font-weight="500" font-size="${96 * scale}" fill="${INK}">${BRAND_NAME}</text>
    <text x="50%" y="${size.height / 2 + 140 * scale}" text-anchor="middle" font-family="Manrope" font-size="${34 * scale}" fill="${INK}" fill-opacity="0.72">Каркасные дома и бани собственного производства</text>
  </svg>`
  const image = path.join(work, 'end.png')
  await sharp(Buffer.from(svg)).png().toFile(image)
  return image
}

process.env.FONTCONFIG_FILE ??= path.join(root, 'apps/web/assets/fonts/fonts.conf')
const browse = take('browse')
const configure = take('configure')
const browseClip = takeClip('browse')
const configureClip = takeClip('configure')
const pdfAt = configure.markers.pdf + 0.6
const segments = [
  cut(browseClip, 'browse-cut', browse.markers.start),
  cut(configureClip, 'configure-a', configure.markers.start, pdfAt),
  stillClip(await proposalImage(), 'proposal', PROPOSAL_SECONDS),
  cut(configureClip, 'configure-b', pdfAt),
  stillClip(await endCardImage(), 'end', END_SECONDS),
]

// Crossfades: each transition starts FADE seconds before the previous part ends.
const lengths = segments.map(duration)
let offset = 0
const filters = []
let previous = '[0:v]'
segments.slice(1).forEach((_, index) => {
  offset += lengths[index] - FADE
  const label = `[v${index + 1}]`
  filters.push(
    `${previous}[${index + 1}:v]xfade=transition=fade:duration=${FADE}:offset=${offset.toFixed(3)}${label}`,
  )
  previous = label
})
ffmpeg(
  ...segments.flatMap((file) => ['-i', file]),
  '-filter_complex',
  filters.join(';'),
  '-map',
  previous,
  '-an',
  '-c:v',
  'libx264',
  '-preset',
  'slow',
  '-crf',
  '25',
  '-pix_fmt',
  'yuv420p',
  '-r',
  String(FPS),
  '-movflags',
  '+faststart',
  output,
)
console.log(
  `${path.relative(root, output)}: ${duration(output).toFixed(1)} s`,
  lengths.map((l) => l.toFixed(1)).join(' + '),
)
