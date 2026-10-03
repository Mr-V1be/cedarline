import Image, { type StaticImageData } from 'next/image'

import styles from './themed-image.module.css'

interface ThemedImageProps {
  readonly light: StaticImageData
  readonly dark: StaticImageData
  readonly alt: string
  readonly sizes: string
  readonly priority?: boolean
}

/**
 * A picture that exists in a light and a dark version, e.g. a screenshot of the product: the
 * one matching the site's theme is shown, following both the system setting and the toggle.
 */
export function ThemedImage({ light, dark, alt, sizes, priority = false }: ThemedImageProps) {
  const loading = priority ? 'eager' : 'lazy'
  const fetchPriority = priority ? 'high' : 'auto'
  return (
    <>
      <Image
        className={`${styles.image} ${styles.light}`}
        src={light}
        alt={alt}
        sizes={sizes}
        loading={loading}
        fetchPriority={fetchPriority}
      />
      <Image
        className={`${styles.image} ${styles.dark}`}
        src={dark}
        alt={alt}
        sizes={sizes}
        loading={loading}
        fetchPriority={fetchPriority}
      />
    </>
  )
}
