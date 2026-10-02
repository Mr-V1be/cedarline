'use client'

import type { Configuration } from '@kedrovnik/configurator'
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  FilePdfIcon,
  PaperPlaneTiltIcon,
  ShareNetworkIcon,
} from '@phosphor-icons/react/ssr'
import { useLocale, useTranslations } from 'next-intl'
import { useEffect, useRef, useState } from 'react'

import type { ImageAsset } from '@/modules/catalog/domain/project'
import type { SceneCapture } from '@/modules/house-3d/domain/capture'
import type { LeadAction } from '@/modules/leads/ui/action-types'
import { LeadSheet } from '@/modules/leads/ui/lead-sheet'
import { Button, ButtonLink } from '@/ui/components/button/button'
import { IconButton } from '@/ui/components/button/icon-button'
import { SelectField } from '@/ui/components/select/select-field'

import type { ConfiguratorView } from '../application/open-configurator'
import { proposalHref, type SaveAction } from './action-types'
import styles from './configurator.module.css'
import { useWebglSupport } from '@/modules/house-3d/ui/webgl-support'

import { ConfiguratorStage } from './configurator-stage'
import { ShareSheet } from './share/share-sheet'
import { StepExtras } from './steps/step-extras'
import { StepSection } from './steps/step-section'
import type { StepKey } from './steps/steps'
import { SummaryBar } from './summary-bar'
import { useConfigurator } from './use-configurator'
import { useVocabulary } from './use-vocabulary'

interface ConfiguratorProps {
  readonly view: ConfiguratorView
  readonly save: SaveAction
  readonly submitLead: LeadAction
  readonly companyPhone: string
}

/** The still that goes into the saved configuration and its proposal. */
const CAPTURE = { width: 1600, height: 1000, preset: 'corner' } as const
/** Share of a step section that must be on screen before the camera follows it (desktop). */
const FOLLOW_THRESHOLD = 0.55

interface SavedRef {
  readonly code: string
  readonly url: string
  readonly configuration: Configuration
}

type SaveProblem = 'failed' | 'limited' | null

const coverOf = (view: ConfiguratorView, slug: string): ImageAsset | null =>
  view.members.find((member) => member.slug === slug)?.cover ?? null

/**
 * The configurator page: the live house on one side, the steps on the other, the running
 * total always in sight. Phones and tablets walk through the steps one by one under a pinned
 * model; desktops see every step and the camera follows the one being read.
 */
export function Configurator({ view, save, submitLead, companyPhone }: ConfiguratorProps) {
  const t = useTranslations('configurator')
  const locale = useLocale()
  const controller = useConfigurator(view)
  const { configuration, state, steps, step } = controller
  const vocabulary = useVocabulary(view)
  const supported = useWebglSupport()
  const captureRef = useRef<SceneCapture | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [saved, setSaved] = useState<SavedRef | null>(null)
  const [saving, setSaving] = useState(false)
  const [problem, setProblem] = useState<SaveProblem>(null)
  const [sheet, setSheet] = useState<'share' | 'lead' | null>(null)

  const projectTitle = view.names.projects[configuration.project] ?? configuration.project
  const completeness =
    view.names.tariff.completeness[configuration.completeness] ?? configuration.completeness
  const stepIndex = steps.findIndex((candidate) => candidate.key === step.key)
  const nextStep = steps[stepIndex + 1]
  const previousStep = steps[stepIndex - 1]

  // Desktop: the camera follows the step being read.
  const { goTo } = controller
  useEffect(() => {
    const panel = panelRef.current
    if (panel === null || !window.matchMedia('(min-width: 1024px)').matches) return
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((entry) => entry.isIntersecting)
        const key = (visible?.target as HTMLElement | undefined)?.dataset.step
        if (key !== undefined) goTo(key as StepKey)
      },
      { threshold: FOLLOW_THRESHOLD },
    )
    panel.querySelectorAll('[data-step]').forEach((section) => {
      observer.observe(section)
    })
    return () => {
      observer.disconnect()
    }
  }, [goTo, steps])

  const ensureSaved = async (): Promise<SavedRef | null> => {
    if (saved !== null && JSON.stringify(saved.configuration) === JSON.stringify(configuration)) {
      return saved
    }
    setSaving(true)
    setProblem(null)
    try {
      const render = (await captureRef.current?.(CAPTURE)) ?? null
      const form = new FormData()
      form.set('configuration', JSON.stringify(configuration))
      form.set('locale', locale)
      if (render !== null) form.set('render', render, 'render.jpg')
      const result = await save(form)
      if (!result.ok) {
        setProblem(result.reason === 'limited' ? 'limited' : 'failed')
        return null
      }
      const reference = { code: result.code, url: result.url, configuration }
      setSaved(reference)
      return reference
    } catch {
      setProblem('failed')
      return null
    } finally {
      setSaving(false)
    }
  }

  const share = async () => {
    if ((await ensureSaved()) !== null) setSheet('share')
  }
  const proposal = async () => {
    const reference = await ensureSaved()
    if (reference !== null) window.location.assign(proposalHref(reference.code, locale))
  }
  const lead = async () => {
    if ((await ensureSaved()) !== null) setSheet('lead')
  }

  const saveActions = (compact: boolean) => (
    <>
      <Button
        variant={compact ? 'quiet' : 'secondary'}
        icon={ShareNetworkIcon}
        disabled={saving}
        onClick={() => {
          void share()
        }}
      >
        {saving ? t('actions.saving') : compact ? t('actions.share') : t('actions.save')}
      </Button>
      <Button
        variant="quiet"
        icon={FilePdfIcon}
        disabled={saving}
        onClick={() => {
          void proposal()
        }}
      >
        {t('actions.proposal')}
      </Button>
    </>
  )
  const leadButton = (
    <Button
      icon={PaperPlaneTiltIcon}
      disabled={saving}
      onClick={() => {
        void lead()
      }}
    >
      {t('actions.lead')}
    </Button>
  )

  return (
    <div className={styles.configurator}>
      <div className={styles.stage}>
        <ConfiguratorStage
          input={{ ...state.house, standards: view.model.house.standards }}
          camera={controller.camera}
          poster={coverOf(view, configuration.project)}
          label={t('stage.label', { project: projectTitle })}
          loadingLabel={t('stage.loading')}
          captureRef={captureRef}
        />
      </div>

      <div ref={panelRef} className={styles.panel}>
        <header className={styles.header}>
          <ButtonLink
            variant="quiet"
            icon={ArrowLeftIcon}
            href={`/projects/${configuration.project}`}
            className={styles.back}
          >
            {t('header.back')}
          </ButtonLink>
          <h1 className={styles.title}>
            <span className={styles.eyebrow}>{t('picker.title')}</span>
            {projectTitle}
          </h1>
          <div className={styles.stepNav}>
            <IconButton
              glyph={ArrowLeftIcon}
              label={t('steps.previous')}
              disabled={previousStep === undefined}
              onClick={() => {
                if (previousStep !== undefined) controller.goTo(previousStep.key)
              }}
            />
            <SelectField
              className={styles.stepSelect}
              label={t('steps.label')}
              hideLabel
              value={step.key}
              options={steps.map((candidate, index) => ({
                value: candidate.key,
                label: `${t('steps.progress', { current: index + 1, total: steps.length })} · ${t(`steps.${candidate.key}`)}`,
              }))}
              onChange={(event) => {
                controller.goTo(event.target.value as StepKey)
              }}
            />
          </div>
          {view.restoredWithChanges ? <p className={styles.notice}>{t('saved.restored')}</p> : null}
          {supported ? null : <p className={styles.notice}>{t('stage.unsupported')}</p>}
        </header>

        <div className={styles.steps}>
          {steps.map((candidate, index) => (
            <StepSection
              key={candidate.key}
              step={candidate}
              index={index}
              state={state}
              configuration={configuration}
              vocabulary={vocabulary}
              projectTitles={view.names.projects}
              active={candidate.key === step.key}
              onChoose={controller.choose}
              {...(candidate.key === 'insulation'
                ? {
                    aside: (
                      <StepExtras.Wall
                        layers={view.wallLayers}
                        insulation={configuration.insulation}
                      />
                    ),
                  }
                : {})}
            >
              {candidate.key === 'summary' ? (
                <StepExtras.Summary
                  state={state}
                  vocabulary={vocabulary}
                  names={view.names}
                  actions={
                    <>
                      {saveActions(false)}
                      {leadButton}
                    </>
                  }
                  problem={problem}
                />
              ) : null}
            </StepSection>
          ))}
        </div>

        <div className={styles.summary}>
          <SummaryBar
            quote={state.quote}
            completeness={completeness}
            primary={
              <>
                <span className={styles.desktopOnly}>{leadButton}</span>
                <span className={styles.phoneOnly}>
                  {nextStep === undefined ? (
                    leadButton
                  ) : (
                    <Button
                      icon={ArrowRightIcon}
                      iconPosition="end"
                      onClick={() => {
                        controller.goTo(nextStep.key)
                        window.scrollTo({ top: 0 })
                      }}
                    >
                      {t(`steps.${nextStep.key}`)}
                    </Button>
                  )}
                </span>
              </>
            }
            secondary={saveActions(true)}
          />
        </div>
      </div>

      <ShareSheet
        open={sheet === 'share'}
        onClose={() => {
          setSheet(null)
        }}
        saved={saved}
        title={projectTitle}
        onLead={() => {
          setSheet('lead')
        }}
      />
      <LeadSheet
        open={sheet === 'lead'}
        onClose={() => {
          setSheet(null)
        }}
        code={saved?.code ?? null}
        submit={submitLead}
        phone={companyPhone}
      />
    </div>
  )
}
