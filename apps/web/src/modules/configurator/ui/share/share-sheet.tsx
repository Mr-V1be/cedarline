'use client'

import { FilePdfIcon, PaperPlaneTiltIcon, ShareNetworkIcon } from '@phosphor-icons/react/ssr'
import { useLocale, useTranslations } from 'next-intl'
import { useSyncExternalStore } from 'react'

import { Button, ButtonAnchor } from '@/ui/components/button/button'
import { CopyField } from '@/ui/components/copy-field/copy-field'
import { Sheet } from '@/ui/components/sheet/sheet'

import { proposalHref } from '../action-types'
import styles from './share-sheet.module.css'

interface ShareSheetProps {
  readonly open: boolean
  readonly onClose: () => void
  readonly saved: { readonly code: string; readonly url: string } | null
  readonly title: string
  readonly onLead: () => void
}

const canShare = () => typeof navigator !== 'undefined' && typeof navigator.share === 'function'

/** After saving: the link to send, the proposal to download and the way to a request. */
export function ShareSheet({ open, onClose, saved, title, onLead }: ShareSheetProps) {
  const t = useTranslations('configurator')
  const common = useTranslations('common')
  const locale = useLocale()
  const sharing = useSyncExternalStore(
    () => () => undefined,
    canShare,
    () => false,
  )

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={t('share.title')}
      closeLabel={common('actions.close')}
    >
      {saved === null ? null : (
        <div className={styles.body}>
          <p className={styles.lead}>{t('share.lead')}</p>
          <CopyField
            label={t('share.link')}
            value={saved.url}
            copyLabel={t('actions.copy')}
            copiedLabel={t('actions.copied')}
          />
          <div className={styles.actions}>
            {sharing ? (
              <Button
                variant="secondary"
                icon={ShareNetworkIcon}
                onClick={() => {
                  void navigator.share({ title, url: saved.url }).catch(() => undefined)
                }}
              >
                {t('actions.share')}
              </Button>
            ) : null}
            <ButtonAnchor
              variant="secondary"
              icon={FilePdfIcon}
              href={proposalHref(saved.code, locale)}
              download
            >
              {t('actions.proposal')}
            </ButtonAnchor>
            <Button icon={PaperPlaneTiltIcon} onClick={onLead}>
              {t('actions.lead')}
            </Button>
          </div>
        </div>
      )}
    </Sheet>
  )
}
