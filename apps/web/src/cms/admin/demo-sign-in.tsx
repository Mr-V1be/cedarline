import type { ServerProps } from 'payload'

import { startDemoSessionAction } from '@/app/(site)/[locale]/demo/actions'
import { isDemoStand } from '@/composition/demo'
import { DEMO_TOURS } from '@/modules/demo/domain/demo-tours'

import { ROLE_LABELS } from '../fields/role-labels'
import { DemoSignInForm } from './demo-sign-in-form'

const COPY = {
  ru: {
    title: 'Демо-доступ',
    lead: 'Войдите под любой ролью без пароля. Каждую ночь данные возвращаются к исходным.',
    pending: 'Входим…',
    limited: 'Слишком много входов подряд. Попробуйте через час.',
    unavailable: 'Демо-вход сейчас недоступен.',
  },
  en: {
    title: 'Demo access',
    lead: 'Sign in with any role, no password. Every night the data returns to its original state.',
    pending: 'Signing in…',
    limited: 'Too many sign-ins in a row. Try again in an hour.',
    unavailable: 'Demo sign-in is not available right now.',
  },
} as const

/**
 * Above the CMS sign-in form on a demo stand: one button per demo role, the same one-click
 * sign-in as on the site's demo page. Elsewhere it renders nothing.
 */
export function DemoSignIn({ i18n }: ServerProps) {
  if (!isDemoStand()) return null
  const language = i18n.language === 'en' ? 'en' : 'ru'
  const copy = COPY[language]
  return (
    <DemoSignInForm
      action={startDemoSessionAction}
      roles={DEMO_TOURS.map((tour) => ({
        role: tour.role,
        label: ROLE_LABELS[tour.role][language],
      }))}
      copy={copy}
    />
  )
}
