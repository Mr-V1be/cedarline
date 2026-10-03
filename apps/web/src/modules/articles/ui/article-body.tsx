import type { DefaultTypedEditorState } from '@payloadcms/richtext-lexical'
import { RichText, type JSXConvertersFunction } from '@payloadcms/richtext-lexical/react'
import Image from 'next/image'

import type { ImageAsset } from '@/modules/catalog/domain/project'

import styles from './articles.module.css'

const isEditorState = (value: unknown): value is DefaultTypedEditorState =>
  typeof value === 'object' && value !== null && 'root' in value

/** Upload nodes carry an image asset: the repository has already mapped the media document. */
const isImageAsset = (value: unknown): value is ImageAsset =>
  typeof value === 'object' &&
  value !== null &&
  'url' in value &&
  typeof value.url === 'string' &&
  'width' in value &&
  typeof value.width === 'number' &&
  'height' in value &&
  typeof value.height === 'number'

/** Images in the text are served through the image optimiser at the column's width. */
const converters: JSXConvertersFunction = ({ defaultConverters }) => ({
  ...defaultConverters,
  upload: ({ node }) => {
    const image: unknown = node.value
    if (!isImageAsset(image)) return null
    return (
      <figure className={styles.figure}>
        <Image
          src={image.url}
          alt={image.alt}
          width={image.width}
          height={image.height}
          sizes="(min-width: 1024px) 720px, 100vw"
        />
        {image.alt === '' ? null : <figcaption>{image.alt}</figcaption>}
      </figure>
    )
  },
})

/** The article text with the site's typography. */
export function ArticleBody({ body }: { readonly body: unknown }) {
  if (!isEditorState(body)) return null
  return <RichText data={body} converters={converters} className={styles.prose} />
}
