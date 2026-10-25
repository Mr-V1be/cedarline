'use client'

import { FilePdfIcon, PaperPlaneTiltIcon, PencilSimpleIcon } from '@phosphor-icons/react/ssr'
import { useFormatter, useLocale, useTranslations } from 'next-intl'
import { useState } from 'react'

import { HouseStage } from '@/modules/house-3d/ui/house-stage'
import type { LeadAction } from '@/modules/leads/ui/action-types'
import { LeadSheet } from '@/modules/leads/ui/lead-sheet'
import { createPriceFormatter } from '@/modules/pricing/application/price-formatter'
import { PricesProvider } from '@/modules/pricing/ui/prices'
import { Button, ButtonAnchor, ButtonLink } from '@/ui/components/button/button'

import { createVocabulary, type Translate } from '../../application/vocabulary'
import type { SavedView } from '../../application/open-saved'
import { proposalHref } from '../action-types'
import { EstimateDetails } from '../estimate/estimate-details'
import styles from './saved-configuration.module.css'

interface SavedConfigurationProps {
  readonly view: SavedView
  readonly renderUrl: string | null
  readonly submitLead: LeadAction
  readonly companyPhone: string
}

/** Render size stored with a configuration; the poster keeps its proportions. */
const RENDER = { width: 1600, height: 1000 } as const

/**
 * A saved configuration exactly as it was saved: the same house, the same estimate under the
 * same tariff revision, in the visitor's currency at the rates of the day of saving. If
 * today's prices differ, the page says so next to the saved figure.
 */
export function SavedConfiguration({
  view,
  renderUrl,
  submitLead,
  companyPhone,
}: SavedConfigurationProps) {
  const t = useTranslations('configurator')
  const viewer = useTranslations('viewer')
  const common = useTranslations('common')
  const registry = useTranslations('registry')
  const locale = useLocale()
  const format = useFormatter()
  const [leadOpen, setLeadOpen] = useState(false)
  const { saved, names } = view
  const { snapshot } = saved
  const { configuration } = snapshot
  const vocabulary = createVocabulary({
    t: t as unknown as Translate,
    registry: registry as unknown as Translate,
    names,
    designs: { [configuration.project]: snapshot.house.design },
  })
  const projectTitle = names.projects[configuration.project] ?? saved.projectSlug
  const prices = createPriceFormatter(view.prices)
  const savedAt = format.dateTime(new Date(snapshot.savedAt), { dateStyle: 'long' })
  const completeness =
    names.tariff.completeness[snapshot.estimate.completeness] ?? snapshot.estimate.completeness

  return (
    <PricesProvider value={view.prices}>
      <div className={styles.page}>
        <header className={styles.header}>
          <p className={styles.eyebrow}>{t('saved.eyebrow')}</p>
          <h1 className={styles.title}>{projectTitle}</h1>
          <p className={styles.meta}>
            {t('saved.savedAt', { date: savedAt, revision: snapshot.tariffRevision })}
          </p>
        </header>

        <div className={styles.layout}>
          <div className={styles.media}>
            <HouseStage
              input={snapshot.house}
              poster={
                renderUrl === null
                  ? null
                  : { url: renderUrl, ...RENDER, alt: t('stage.label', { project: projectTitle }) }
              }
              sizes="(min-width: 1024px) 60vw, 100vw"
              priority
              labels={{
                model: t('stage.label', { project: projectTitle }),
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
          </div>

          <aside className={styles.summary}>
            <dl className={styles.figures}>
              <div>
                <dt>{t('estimate.completeness', { name: completeness })}</dt>
                <dd className={styles.total}>{prices.format(snapshot.estimate.total, 'exact')}</dd>
              </div>
              <div>
                <dt>{t('summary.weeks')}</dt>
                <dd>{common('units.weeks', { count: snapshot.schedule.totalWeeks })}</dd>
              </div>
              <div>
                <dt>{t('estimate.area')}</dt>
                <dd>{common('units.area', { value: snapshot.metrics.totalArea })}</dd>
              </div>
            </dl>
            {view.current !== null ? (
              <p className={styles.notice}>
                {t('saved.changed', {
                  amount: createPriceFormatter(view.current.prices).format(
                    view.current.total,
                    'exact',
                  ),
                })}
              </p>
            ) : null}
            {view.repeatable ? null : <p className={styles.notice}>{t('saved.unavailable')}</p>}
            <div className={styles.actions}>
              <Button
                icon={PaperPlaneTiltIcon}
                stretch
                onClick={() => {
                  setLeadOpen(true)
                }}
              >
                {t('actions.lead')}
              </Button>
              <ButtonAnchor
                variant="secondary"
                icon={FilePdfIcon}
                stretch
                href={proposalHref(saved.code, locale)}
                download
              >
                {t('actions.proposal')}
              </ButtonAnchor>
              {view.repeatable ? (
                <ButtonLink
                  variant="quiet"
                  icon={PencilSimpleIcon}
                  stretch
                  href={`/configurator/${saved.projectSlug}?from=${saved.code}`}
                >
                  {t('actions.edit')}
                </ButtonLink>
              ) : null}
            </div>
          </aside>
        </div>

        <div className={styles.details}>
          <section aria-labelledby="saved-options">
            <h2 id="saved-options" className={styles.sectionTitle}>
              {t('saved.options')}
            </h2>
            <dl className={styles.rows}>
              {vocabulary.rows(configuration).map((row) => (
                <div key={row.group} className={styles.row}>
                  <dt>{row.label}</dt>
                  <dd>{row.value}</dd>
                </div>
              ))}
            </dl>
          </section>
          <section>
            <EstimateDetails
              estimate={snapshot.estimate}
              schedule={snapshot.schedule}
              names={names.tariff}
              headingLevel="h2"
            />
          </section>
        </div>

        <LeadSheet
          open={leadOpen}
          onClose={() => {
            setLeadOpen(false)
          }}
          code={saved.code}
          submit={submitLead}
          phone={companyPhone}
        />
      </div>
    </PricesProvider>
  )
}
