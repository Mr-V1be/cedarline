import { Money } from '@cedarline/pricing'
import { getTranslations } from 'next-intl/server'

import { Link } from '@/i18n/navigation'
import type { ProjectOverview } from '@/modules/catalog/application/project-overview'
import { HouseStage } from '@/modules/house-3d/ui/house-stage'
import { createPriceFormatter } from '@/modules/pricing/application/price-formatter'
import type { DisplayCurrency } from '@/modules/pricing/domain/exchange-rate'
import { ButtonLink } from '@/ui/components/button/button'
import { Container } from '@/ui/components/layout/container'

import styles from './hero-section.module.css'

/** First screen: the brand thesis and the hero project as a live model with its real numbers. */
export async function HeroSection({
  hero,
  currency,
}: {
  readonly hero: ProjectOverview | null
  /** The visitor's currency. */
  readonly currency: DisplayCurrency
}) {
  const [t, common, viewer] = await Promise.all([
    getTranslations('home.hero'),
    getTranslations('common'),
    getTranslations('viewer'),
  ])
  return (
    <section className={styles.hero}>
      <Container className={styles.grid}>
        <div className={styles.copy}>
          <h1 className={styles.title}>{t('title')}</h1>
          <p className={styles.lead}>{t('lead')}</p>
          <div className={styles.actions}>
            <ButtonLink href="/projects">{common('actions.chooseProject')}</ButtonLink>
          </div>
        </div>
        {hero === null ? null : (
          <figure className={styles.visual}>
            <HouseStage
              input={hero.viewer}
              scene="evening"
              poster={
                hero.project.gallery.find((item) => item.view === 'evening')?.image ??
                hero.project.cover
              }
              priority
              sizes="(min-width: 1100px) 56vw, 100vw"
              labels={{
                model: viewer('label', { project: hero.project.title }),
                open: common('actions.open3d'),
                views: viewer('views.label'),
                unsupported: viewer('unsupported'),
                presets: {
                  corner: viewer('views.corner'),
                  front: viewer('views.front'),
                  aerial: viewer('views.aerial'),
                },
              }}
            />
            <figcaption className={styles.caption}>
              <Link href={`/projects/${hero.project.slug}`} className={styles.projectLink}>
                {t('drawing', { project: hero.project.title })}
              </Link>
              <dl className={styles.facts}>
                <div>
                  <dt>{t('area')}</dt>
                  <dd>{common('units.area', { value: hero.project.metrics.totalArea })}</dd>
                </div>
                <div>
                  <dt>{t('dimensions')}</dt>
                  <dd>
                    {common('units.dimensions', {
                      width: hero.project.metrics.width,
                      depth: hero.project.metrics.depth,
                    })}
                  </dd>
                </div>
                {hero.project.pricing === null ? null : (
                  <div>
                    <dt>{t('price')}</dt>
                    <dd>
                      {common('units.priceFrom', {
                        price: createPriceFormatter(currency).format(
                          Money.ofRubles(hero.project.pricing.fromPrice),
                          'from',
                        ),
                      })}
                    </dd>
                  </div>
                )}
              </dl>
            </figcaption>
          </figure>
        )}
      </Container>
    </section>
  )
}
