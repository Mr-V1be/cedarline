import config from '@payload-config'
import { DefaultTemplate } from '@payloadcms/next/templates'
import { getNextRequestI18n } from '@payloadcms/next/utilities'
import { NotFoundPage } from '@payloadcms/next/views'
import { getVisibleEntities } from '@payloadcms/ui/shared'
import { headers as requestHeaders } from 'next/headers'
import { createLocalReq, getPayload, type ImportMap } from 'payload'

import { isLocale, DEFAULT_LOCALE } from '@/i18n/locales'
import { ROLE_KEYS, rolesGrant } from '@/modules/access/domain/roles'

import { readCapabilityOf } from '../access/policies'
import type { Labels } from '../fields/labels'
import { ROLE_LABELS } from '../fields/role-labels'
import { AccessDenied } from './access-denied'
import { ADMIN_PATH_HEADER, adminEntityOf } from './admin-path'

type Params = Promise<{ segments: string[] }>
type SearchParams = Promise<Record<string, string | string[]>>

const COPY = {
  ru: {
    title: 'Нет доступа к разделу «{section}»',
    lead: 'Этот раздел есть, но вашей роли он закрыт.',
    roles: 'Раздел открыт ролям:',
    signedIn: 'Вы вошли как',
    back: 'На главную панели',
  },
  en: {
    title: 'No access to “{section}”',
    lead: 'This section exists, but your role may not open it.',
    roles: 'Open to the roles:',
    signedIn: 'You are signed in as',
    back: 'Back to the dashboard',
  },
} as const

const pick = (labels: unknown, language: string): string | null => {
  if (typeof labels === 'string') return labels
  if (typeof labels !== 'object' || labels === null) return null
  const value = (labels as Partial<Labels>)[isLocale(language) ? language : DEFAULT_LOCALE]
  return value ?? null
}

/**
 * The CMS's not-found page. A collection or global that exists but is closed to the signed-in
 * role gets an explicit «no access» page inside the admin frame; anything else is a real 404.
 */
export async function AdminNotFound({
  params,
  searchParams,
  importMap,
}: {
  readonly params: Params
  readonly searchParams: SearchParams
  readonly importMap: ImportMap
}) {
  const headers = await requestHeaders()
  const entity = adminEntityOf(headers.get(ADMIN_PATH_HEADER))
  const payload = await getPayload({ config, importMap })
  const definition =
    entity === null
      ? undefined
      : entity.kind === 'collection'
        ? payload.config.collections.find((candidate) => candidate.slug === entity.slug)
        : payload.config.globals.find((candidate) => candidate.slug === entity.slug)
  const { permissions, user } = await payload.auth({ headers })
  const readable =
    entity === null
      ? true
      : entity.kind === 'collection'
        ? permissions.collections?.[entity.slug]?.read
        : permissions.globals?.[entity.slug]?.read

  if (entity === null || definition === undefined || user === null || readable === true) {
    return NotFoundPage({ config, params, searchParams, importMap })
  }

  const i18n = await getNextRequestI18n({ config: payload.config })
  const language = i18n.language
  const req = await createLocalReq({ user }, payload)
  const visibleEntities = getVisibleEntities({ req })
  const labels =
    'labels' in definition ? definition.labels.plural : (definition as { label?: unknown }).label
  const capability = readCapabilityOf(definition.custom)
  const roles =
    capability === null
      ? []
      : ROLE_KEYS.filter((role) => rolesGrant([role], capability)).flatMap(
          (role) => pick(ROLE_LABELS[role], language) ?? [],
        )
  const section = pick(labels, language) ?? entity.slug
  const texts = COPY[isLocale(language) ? language : DEFAULT_LOCALE]
  const copy = { ...texts, title: texts.title.replace('{section}', section) }

  return (
    <DefaultTemplate
      i18n={i18n}
      payload={payload}
      permissions={permissions}
      params={await params}
      searchParams={await searchParams}
      user={user}
      req={req}
      visibleEntities={visibleEntities}
    >
      <AccessDenied
        section={section}
        roles={roles}
        signedInAs={user.email}
        dashboardHref={payload.config.routes.admin}
        copy={copy}
      />
    </DefaultTemplate>
  )
}
