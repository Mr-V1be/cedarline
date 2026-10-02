import { CubeIcon } from '@phosphor-icons/react/ssr'
import Image from 'next/image'

import type { ImageAsset } from '@/modules/catalog/domain/project'
import { ButtonLink } from '@/ui/components/button/button'
import { Container, Section } from '@/ui/components/layout/container'

import styles from './cta-band.module.css'

interface CtaBandProps {
  readonly title: string
  readonly lead: string
  readonly action: string
  readonly href: string
  readonly image: ImageAsset | null
}

/** Closing band: one action, the picture beside the text and never under it. */
export function CtaBand({ title, lead, action, href, image }: CtaBandProps) {
  return (
    <Section tone="pine">
      <Container className={styles.grid}>
        <div className={styles.copy}>
          <h2 className={styles.title}>{title}</h2>
          <p className={styles.lead}>{lead}</p>
          <ButtonLink href={href} variant="inverse" icon={CubeIcon}>
            {action}
          </ButtonLink>
        </div>
        {image === null ? null : (
          <div className={styles.media}>
            <Image
              className={styles.image}
              src={image.url}
              alt={image.alt}
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
            />
          </div>
        )}
      </Container>
    </Section>
  )
}
