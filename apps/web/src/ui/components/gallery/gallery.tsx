'use client'

import { CaretLeftIcon, CaretRightIcon } from '@phosphor-icons/react/ssr'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'

import { IconButton } from '../button/icon-button'
import styles from './gallery.module.css'

export interface GallerySlide {
  /** Also the anchor id: a link to #key opens this slide. */
  readonly key: string
  readonly label: string
  readonly content: ReactNode
  readonly thumbnail: ReactNode
}

interface GalleryProps {
  readonly slides: readonly GallerySlide[]
  readonly labels: { readonly region: string; readonly previous: string; readonly next: string }
}

/** Swipeable media viewer with thumbnails; controls sit below the media, never over it. */
export function Gallery({ slides, labels }: GalleryProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)

  const go = useCallback((index: number) => {
    const element = trackRef.current
    if (element === null) return
    const target = Math.max(0, Math.min(index, element.children.length - 1))
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    element.scrollTo({ left: target * element.clientWidth, behavior: reduce ? 'auto' : 'smooth' })
  }, [])

  useEffect(() => {
    const openFromHash = () => {
      const index = slides.findIndex((slide) => `#${slide.key}` === window.location.hash)
      if (index >= 0) go(index)
    }
    openFromHash()
    window.addEventListener('hashchange', openFromHash)
    return () => {
      window.removeEventListener('hashchange', openFromHash)
    }
  }, [go, slides])

  return (
    <section className={styles.gallery} aria-roledescription="carousel" aria-label={labels.region}>
      <div
        ref={trackRef}
        className={styles.track}
        // A focusable scroll region: arrow keys scroll it and snapping lands on the next slide.
        role="region"
        aria-label={labels.region}
        tabIndex={0}
        onScroll={(event) => {
          const element = event.currentTarget
          setActive(Math.round(element.scrollLeft / Math.max(1, element.clientWidth)))
        }}
      >
        {slides.map((slide, index) => (
          <div
            key={slide.key}
            id={slide.key}
            className={styles.slide}
            role="group"
            aria-roledescription="slide"
            aria-label={slide.label}
            aria-hidden={index !== active}
          >
            {slide.content}
          </div>
        ))}
      </div>
      {slides.length > 1 ? (
        <div className={styles.controls}>
          <ol className={styles.thumbnails}>
            {slides.map((slide, index) => (
              <li key={slide.key}>
                <button
                  type="button"
                  className={styles.thumbnail}
                  aria-label={slide.label}
                  aria-current={index === active}
                  onClick={() => {
                    go(index)
                  }}
                >
                  {slide.thumbnail}
                </button>
              </li>
            ))}
          </ol>
          <div className={styles.steps}>
            <IconButton
              glyph={CaretLeftIcon}
              label={labels.previous}
              disabled={active === 0}
              onClick={() => {
                go(active - 1)
              }}
            />
            <IconButton
              glyph={CaretRightIcon}
              label={labels.next}
              disabled={active === slides.length - 1}
              onClick={() => {
                go(active + 1)
              }}
            />
          </div>
        </div>
      ) : null}
    </section>
  )
}
