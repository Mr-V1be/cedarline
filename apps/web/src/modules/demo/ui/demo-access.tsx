import { ArrowRightIcon, MoonStarsIcon } from '@phosphor-icons/react/ssr'
import { getTranslations } from 'next-intl/server'

import { SubmitButton } from '@/ui/components/button/submit-button'
import { Icon } from '@/ui/components/icon/icon'
import { Container } from '@/ui/components/layout/container'
import { ScreenFrame } from '@/ui/components/screen-frame/screen-frame'
import { ThemedImage } from '@/ui/components/themed-image/themed-image'

import { DEMO_TOURS, type DemoStopKey } from '../domain/demo-tours'
import styles from './demo-access.module.css'
import { ROLE_ICONS, stopIconOf } from './demo-icons'
import { DemoSessionForm } from './demo-session-form'
import type { DemoSessionAction } from './demo-session-state'
import leadDark from './images/cms-lead-dark.webp'
import leadLight from './images/cms-lead-light.webp'

/**
 * The demo stand's front door to the CMS: a real screen of it, then one panel per role with
 * the sections worth opening. Every button signs in and lands on its section.
 */
export async function DemoAccess({ action }: { readonly action: DemoSessionAction }) {
  const t = await getTranslations('demo')
  const errors = { limited: t('errors.limited'), unavailable: t('errors.unavailable') }

  return (
    <Container className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.intro}>
          <h1 className={styles.title}>{t('title')}</h1>
          <p className={styles.lead}>{t('lead')}</p>
          <p className={styles.reset}>
            <Icon glyph={MoonStarsIcon} />
            <span>{t('reset')}</span>
          </p>
        </div>
        <ScreenFrame className={styles.screen}>
          <ThemedImage
            light={leadLight}
            dark={leadDark}
            alt={t('screen')}
            sizes="(min-width: 1024px) 56vw, 100vw"
            priority
          />
        </ScreenFrame>
      </header>
      <ul className={styles.roles}>
        {DEMO_TOURS.map((tour) => {
          const stops: readonly { readonly key: DemoStopKey }[] = tour.stops
          return (
            <li key={tour.role} className={styles.role}>
              <section aria-labelledby={`demo-${tour.role}`} className={styles.panel}>
                <span className={styles.mark}>
                  <Icon glyph={ROLE_ICONS[tour.role]} size="l" />
                </span>
                <h2 id={`demo-${tour.role}`} className={styles.roleTitle}>
                  {t(`roles.${tour.role}.title`)}
                </h2>
                <p className={styles.summary}>{t(`roles.${tour.role}.summary`)}</p>
                <DemoSessionForm action={action} role={tour.role} errors={errors}>
                  <h3 className={styles.lookAt}>{t('lookAt')}</h3>
                  <ul className={styles.stops}>
                    {stops.map((stop) => (
                      <li key={stop.key}>
                        <button type="submit" name="stop" value={stop.key} className={styles.stop}>
                          <Icon glyph={stopIconOf(stop.key)} className={styles.stopIcon} />
                          <span className={styles.stopText}>
                            <span className={styles.stopTitle}>{t(`stops.${stop.key}.title`)}</span>
                            <span className={styles.stopHint}>{t(`stops.${stop.key}.hint`)}</span>
                          </span>
                          <Icon glyph={ArrowRightIcon} className={styles.stopArrow} />
                        </button>
                      </li>
                    ))}
                  </ul>
                  <SubmitButton pendingLabel={t('pending')} stretch>
                    {t(`roles.${tour.role}.enter`)}
                  </SubmitButton>
                </DemoSessionForm>
              </section>
            </li>
          )
        })}
      </ul>
    </Container>
  )
}
