'use client'

import { CheckCircleIcon, EnvelopeOpenIcon, PaperPlaneTiltIcon } from '@phosphor-icons/react/ssr'
import { useLocale, useTranslations } from 'next-intl'
import { useRef, useState, type SubmitEvent } from 'react'

import { Link } from '@/i18n/navigation'
import { Button, ButtonLink } from '@/ui/components/button/button'
import { CheckboxField } from '@/ui/components/checkbox/checkbox-field'
import { Icon } from '@/ui/components/icon/icon'
import { Sheet } from '@/ui/components/sheet/sheet'
import { TextField } from '@/ui/components/text-field/text-field'

import { LEAD_LIMITS, validateLeadForm, type LeadField, type LeadFieldError } from '../domain/lead'
import type { LeadAction } from './action-types'
import styles from './lead-sheet.module.css'

interface LeadSheetProps {
  readonly open: boolean
  readonly onClose: () => void
  /** Share code of the saved configuration the lead is about. */
  readonly code: string | null
  readonly submit: LeadAction
  /** Company phone for the case when the form is refused. */
  readonly phone: string
}

type Values = Record<'name' | 'phone' | 'email' | 'comment', string> & { consent: boolean }
type Errors = Partial<Record<LeadField, LeadFieldError>>
type Outcome =
  | { readonly kind: 'idle' }
  | { readonly kind: 'sending' }
  | {
      readonly kind: 'sent'
      readonly reference: string
      readonly email: string
      readonly letter: string | null
    }
  | { readonly kind: 'refused'; readonly reason: 'limited' | 'unknown-configuration' | 'failed' }

const EMPTY: Values = { name: '', phone: '', email: '', comment: '', consent: false }
const FIELD_ORDER: readonly LeadField[] = ['name', 'phone', 'email', 'comment', 'consent']

/**
 * The lead form in a sheet: checked as the customer types, checked again by the server, never
 * losing what was typed. A hidden field catches bots; the server limits the request rate.
 */
export function LeadSheet({ open, onClose, code, submit, phone }: LeadSheetProps) {
  const t = useTranslations('lead')
  const common = useTranslations('common')
  const locale = useLocale()
  const formRef = useRef<HTMLFormElement>(null)
  const [values, setValues] = useState<Values>(EMPTY)
  const [touched, setTouched] = useState<ReadonlySet<LeadField>>(() => new Set())
  const [serverErrors, setServerErrors] = useState<Errors>({})
  const [outcome, setOutcome] = useState<Outcome>({ kind: 'idle' })

  const check = validateLeadForm(values)
  const localErrors: Errors = check.ok ? {} : check.errors
  const errorOf = (field: LeadField) => {
    const error = touched.has(field) ? localErrors[field] : serverErrors[field]
    return error === undefined ? undefined : t(`errors.${field}.${error}` as never)
  }
  const update = (field: keyof Values, value: string | boolean) => {
    setValues((current) => ({ ...current, [field]: value }))
    setServerErrors((current) => ({ ...current, [field]: undefined }))
  }
  const touch = (field: LeadField) => {
    setTouched((current) => new Set(current).add(field))
  }

  const onSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    setTouched(new Set(FIELD_ORDER))
    if (!check.ok || code === null) {
      const first = FIELD_ORDER.find((field) => localErrors[field] !== undefined)
      if (first !== undefined)
        formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus()
      return
    }
    const form = new FormData(event.currentTarget)
    form.set('code', code)
    form.set('locale', locale)
    setOutcome({ kind: 'sending' })
    try {
      const result = await submit(form)
      if (result.ok) {
        setOutcome({
          kind: 'sent',
          reference: result.reference,
          email: values.email,
          letter: result.letter,
        })
      } else if (result.reason === 'invalid') {
        setServerErrors(result.errors)
        setTouched(new Set())
        setOutcome({ kind: 'idle' })
      } else {
        setOutcome({ kind: 'refused', reason: result.reason })
      }
    } catch {
      setOutcome({ kind: 'refused', reason: 'failed' })
    }
  }

  const errorCount = FIELD_ORDER.filter((field) => errorOf(field) !== undefined).length
  const sending = outcome.kind === 'sending'

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={t('title')}
      closeLabel={common('actions.close')}
      {...(outcome.kind === 'sent'
        ? {}
        : {
            // The answer to a submission sits next to the button that sent it, always in view.
            footer: (
              <div className={styles.footer}>
                <p className={styles.alert} role="alert">
                  {errorCount > 0 ? t('errors.summary', { count: errorCount }) : null}
                  {outcome.kind === 'refused'
                    ? outcome.reason === 'limited'
                      ? t('limited', { phone })
                      : outcome.reason === 'unknown-configuration'
                        ? t('unknown')
                        : t('failure')
                    : null}
                </p>
                <Button
                  type="submit"
                  form="lead-form"
                  icon={PaperPlaneTiltIcon}
                  stretch
                  disabled={sending}
                >
                  {sending ? t('sending') : t('submit')}
                </Button>
              </div>
            ),
          })}
    >
      {outcome.kind === 'sent' ? (
        <div className={styles.success} role="status">
          <Icon glyph={CheckCircleIcon} size="l" className={styles.successIcon} />
          <h3 className={styles.successTitle}>
            {t('success.title', { reference: outcome.reference })}
          </h3>
          {outcome.letter === null ? (
            <p>{t('success.text', { email: outcome.email })}</p>
          ) : (
            <>
              <p>{t('success.mailbox')}</p>
              <ButtonLink
                href={outcome.letter}
                target="_blank"
                variant="secondary"
                icon={EnvelopeOpenIcon}
              >
                {t('success.openLetter')}
              </ButtonLink>
            </>
          )}
        </div>
      ) : (
        <form
          id="lead-form"
          ref={formRef}
          className={styles.form}
          noValidate
          onSubmit={(event) => {
            void onSubmit(event)
          }}
        >
          <p className={styles.lead}>{t('lead')}</p>
          <TextField
            label={t('fields.name')}
            name="name"
            autoComplete="name"
            required
            maxLength={LEAD_LIMITS.name}
            value={values.name}
            error={errorOf('name')}
            onChange={(event) => {
              update('name', event.target.value)
            }}
            onBlur={() => {
              touch('name')
            }}
          />
          <TextField
            label={t('fields.phone')}
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            required
            hint={t('fields.phoneHint')}
            value={values.phone}
            error={errorOf('phone')}
            onChange={(event) => {
              update('phone', event.target.value)
            }}
            onBlur={() => {
              touch('phone')
            }}
          />
          <TextField
            label={t('fields.email')}
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            maxLength={LEAD_LIMITS.email}
            value={values.email}
            error={errorOf('email')}
            onChange={(event) => {
              update('email', event.target.value)
            }}
            onBlur={() => {
              touch('email')
            }}
          />
          <TextField
            multiline
            label={t('fields.comment')}
            name="comment"
            rows={3}
            maxLength={LEAD_LIMITS.comment}
            hint={t('fields.commentHint')}
            value={values.comment}
            error={errorOf('comment')}
            onChange={(event) => {
              update('comment', event.target.value)
            }}
            onBlur={() => {
              touch('comment')
            }}
          />
          <CheckboxField
            label={t.rich('fields.consent', {
              // A new tab keeps the sheet and everything typed in it.
              policy: (chunks) => (
                <Link href="/privacy" target="_blank" className={styles.policyLink}>
                  {chunks}
                </Link>
              ),
            })}
            name="consent"
            value="true"
            checked={values.consent}
            error={errorOf('consent')}
            onChange={(event) => {
              update('consent', event.target.checked)
              touch('consent')
            }}
          />
          <div className={styles.trap} aria-hidden>
            <label>
              {t('fields.trap')}
              <input name="website" type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
            </label>
          </div>
        </form>
      )}
    </Sheet>
  )
}
