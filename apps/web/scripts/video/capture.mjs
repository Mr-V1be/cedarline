// Screen capture for the product video: what the page shows (CDP screencast), frame by frame,
// with the time each frame appeared, plus named markers for cutting the takes later.
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'

/**
 * Starts recording `page` into `directory` (JPEG frames). Frames arrive only when the page
 * repaints; the concat list written on `stop()` holds each frame until the next one, so the
 * clip plays in real time.
 */
export async function startCapture(page, directory, { width, height, quality = 90 }) {
  mkdirSync(directory, { recursive: true })
  const cdp = await page.context().newCDPSession(page)
  const frames = []
  const markers = {}
  let writing = Promise.resolve()
  cdp.on('Page.screencastFrame', ({ data, metadata, sessionId }) => {
    const file = `f${String(frames.length).padStart(6, '0')}.jpg`
    frames.push({ file, time: metadata.timestamp })
    writing = writing.then(() =>
      writeFileSync(path.join(directory, file), Buffer.from(data, 'base64')),
    )
    cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {})
  })
  await cdp.send('Page.startScreencast', {
    format: 'jpeg',
    quality,
    maxWidth: width,
    maxHeight: height,
  })
  return {
    /** Remembers the current moment under a name (seconds on the frames' clock). */
    mark(name) {
      markers[name] = Date.now() / 1000
    },
    async stop() {
      const end = Date.now() / 1000
      await cdp.send('Page.stopScreencast').catch(() => {})
      await writing
      const lines = ['ffconcat version 1.0']
      frames.forEach((frame, index) => {
        const next = frames[index + 1]?.time ?? end
        lines.push(
          `file ${frame.file}`,
          `duration ${Math.max(next - frame.time, 0.001).toFixed(4)}`,
        )
      })
      // The concat demuxer needs the last file once more for its duration to count.
      if (frames.length > 0) lines.push(`file ${frames.at(-1).file}`)
      writeFileSync(path.join(directory, 'frames.ffconcat'), `${lines.join('\n')}\n`)
      const start = frames[0]?.time ?? end
      const relative = Object.fromEntries(
        Object.entries(markers).map(([name, time]) => [name, Math.max(time - start, 0)]),
      )
      writeFileSync(
        path.join(directory, 'take.json'),
        JSON.stringify(
          { frames: frames.length, duration: end - start, markers: relative },
          null,
          2,
        ),
      )
      return { frames: frames.length, duration: end - start, markers: relative }
    },
  }
}
