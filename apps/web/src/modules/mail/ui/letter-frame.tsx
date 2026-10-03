'use client'

import { useEffect, useRef } from 'react'

import styles from './letter.module.css'

/** Links in the letter open in a new tab; the letter itself runs no scripts. */
const BASE = '<base target="_blank">'

/**
 * The letter's HTML in a sandboxed frame: its styles stay inside and no script runs. The frame
 * takes the height of the letter, so the page scrolls as one.
 */
export function LetterFrame({ html, title }: { readonly html: string; readonly title: string }) {
  const frameRef = useRef<HTMLIFrameElement>(null)
  const document = html.includes('<head>') ? html.replace('<head>', `<head>${BASE}`) : BASE + html

  // The frame may finish loading before hydration, so the height is also fitted on mount.
  useEffect(() => {
    const frame = frameRef.current
    if (frame === null) return
    const fit = () => {
      const height = frame.contentDocument?.documentElement.scrollHeight
      if (height !== undefined && height > 0) frame.style.height = `${height}px`
    }
    fit()
    frame.addEventListener('load', fit)
    return () => {
      frame.removeEventListener('load', fit)
    }
  }, [document])

  return (
    <iframe
      ref={frameRef}
      className={styles.frame}
      title={title}
      srcDoc={document}
      sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
    />
  )
}
