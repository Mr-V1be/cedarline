import {
  ClockIcon,
  CubeIcon,
  EnvelopeSimpleIcon,
  MapPinIcon,
  PhoneIcon,
  TreeEvergreenIcon,
} from '@phosphor-icons/react/ssr'
import { getTranslations } from 'next-intl/server'
import type { ReactNode } from 'react'

import { ButtonLink } from '@/ui/components/button/button'
import { Icon, type IconGlyph } from '@/ui/components/icon/icon'
import { Container, Section } from '@/ui/components/layout/container'
import { MapView, type MapLabels, type MapSetup } from '@/ui/components/map/map-view'

import type { SiteContent } from '../domain/site'
import styles from './contacts-view.module.css'

/** How close the contacts map starts: the factory with the nearest town around it. */
const FACTORY_ZOOM = 12
const OSM_ZOOM = 14

interface ContactsViewProps {
  readonly site: SiteContent
  readonly map: { readonly setup: MapSetup; readonly labels: MapLabels }
}

function Channel({
  glyph,
  label,
  children,
}: {
  readonly glyph: IconGlyph
  readonly label: string
  readonly children: ReactNode
}) {
  return (
    <div className={styles.channel}>
      <dt className={styles.channelLabel}>
        <Icon glyph={glyph} />
        {label}
      </dt>
      <dd className={styles.channelValue}>{children}</dd>
    </div>
  )
}

const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, '')}`

/** Contacts: ways to reach the company, the factory on the map and the legal details. */
export async function ContactsView({ site, map }: ContactsViewProps) {
  const t = await getTranslations('contacts')
  const location = site.location
  return (
    <>
      <Container className={styles.page}>
        <header className={styles.header}>
          <h1 className={styles.title}>{t('title')}</h1>
          <p className={styles.lead}>{t('lead')}</p>
        </header>
        <div className={styles.grid}>
          <dl className={styles.channels}>
            <Channel glyph={PhoneIcon} label={t('channels.phone')}>
              <a className={styles.big} href={telHref(site.phone)}>
                {site.phone}
              </a>
            </Channel>
            <Channel glyph={EnvelopeSimpleIcon} label={t('channels.email')}>
              <a className={styles.big} href={`mailto:${site.email}`}>
                {site.email}
              </a>
            </Channel>
            <Channel glyph={MapPinIcon} label={t('channels.address')}>
              {site.address}
            </Channel>
            <Channel glyph={ClockIcon} label={t('channels.hours')}>
              {site.hours}
            </Channel>
            <Channel glyph={TreeEvergreenIcon} label={t('channels.region')}>
              {site.region}
            </Channel>
          </dl>
          {location === null ? null : (
            <div className={styles.mapColumn}>
              <MapView
                className={styles.map}
                points={[{ id: 'factory', position: location }]}
                setup={map.setup}
                labels={{ ...map.labels, title: t('map') }}
                maxZoom={FACTORY_ZOOM}
              />
              <a
                className={styles.osm}
                href={`https://www.openstreetmap.org/?mlat=${location[1]}&mlon=${location[0]}#map=${OSM_ZOOM}/${location[1]}/${location[0]}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t('openMap')}
              </a>
            </div>
          )}
        </div>
        <section className={styles.legal} aria-labelledby="legal-title">
          <h2 id="legal-title" className={styles.legalTitle}>
            {t('legal.title')}
          </h2>
          <p>{site.legal.name}</p>
          <p className={styles.numeric}>{t('legal.taxId', { value: site.legal.taxId })}</p>
          <p className={styles.numeric}>
            {t('legal.registrationNumber', { value: site.legal.registrationNumber })}
          </p>
        </section>
      </Container>
      <Section tone="sunken" aria-labelledby="contacts-cta">
        <Container className={styles.cta}>
          <div>
            <h2 id="contacts-cta" className={styles.ctaTitle}>
              {t('cta.title')}
            </h2>
            <p className={styles.ctaLead}>{t('cta.lead')}</p>
          </div>
          <ButtonLink href="/configurator" icon={CubeIcon}>
            {t('cta.action')}
          </ButtonLink>
        </Container>
      </Section>
    </>
  )
}
