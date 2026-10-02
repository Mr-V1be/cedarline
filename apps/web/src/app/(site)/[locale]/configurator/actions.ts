'use server'

import { headers } from 'next/headers'

import { getServices } from '@/composition/services'
import { DEFAULT_LOCALE, isLocale, type Locale } from '@/i18n/locales'
import { saveConfiguration } from '@/modules/configurator/application/save-configuration'
import type { SaveActionResult } from '@/modules/configurator/ui/action-types'
import { submitLead } from '@/modules/leads/application/submit-lead'
import type { LeadActionResult } from '@/modules/leads/ui/action-types'
import { clientAddress } from '@/modules/protection/infrastructure/client-address'

/** Captures above this size are not renders of our canvas; they are dropped, not stored. */
const MAX_RENDER_BYTES = 3 * 1024 * 1024

const localeOf = (form: FormData): Locale => {
  const value = form.get('locale')
  return typeof value === 'string' && isLocale(value) ? value : DEFAULT_LOCALE
}

const text = (form: FormData, name: string) => {
  const value = form.get(name)
  return typeof value === 'string' ? value : ''
}

/** Saves the configuration behind a short link; the server recomputes every figure. */
export async function saveConfigurationAction(form: FormData): Promise<SaveActionResult> {
  const locale = localeOf(form)
  const services = await getServices(locale)
  if (!(await services.rateLimiter.consume('saveConfiguration', clientAddress(await headers())))) {
    return { ok: false, reason: 'limited' }
  }
  let configuration: unknown
  try {
    configuration = JSON.parse(text(form, 'configuration'))
  } catch {
    return { ok: false, reason: 'invalid' }
  }
  const upload = form.get('render')
  const render =
    upload instanceof Blob && upload.size > 0 && upload.size <= MAX_RENDER_BYTES
      ? Buffer.from(await upload.arrayBuffer())
      : null
  try {
    const result = await saveConfiguration(services.saving, { configuration, locale, render })
    return result.ok
      ? { ok: true, code: result.code, url: services.linkTo(result.code, locale) }
      : result
  } catch (error) {
    services.logger.error({ err: error }, 'Saving a configuration failed')
    return { ok: false, reason: 'failed' }
  }
}

/** Takes a lead for a saved configuration: CMS, CRM and emails behind the lead sink port. */
export async function submitLeadAction(form: FormData): Promise<LeadActionResult> {
  const locale = localeOf(form)
  const services = await getServices(locale)
  const trap = text(form, 'website')
  // A filled honeypot is answered by the use case without touching the rate limit.
  if (
    trap === '' &&
    !(await services.rateLimiter.consume('submitLead', clientAddress(await headers())))
  ) {
    return { ok: false, reason: 'limited' }
  }
  try {
    const result = await submitLead(services.leads, {
      form: {
        name: text(form, 'name'),
        phone: text(form, 'phone'),
        email: text(form, 'email'),
        comment: text(form, 'comment'),
        consent: text(form, 'consent'),
      },
      code: text(form, 'code'),
      locale,
      trap,
    })
    if (result.ok) return result
    return result.reason === 'invalid'
      ? { ok: false, reason: 'invalid', errors: result.errors }
      : { ok: false, reason: 'unknown-configuration' }
  } catch (error) {
    services.logger.error({ err: error }, 'Submitting a lead failed')
    return { ok: false, reason: 'failed' }
  }
}
