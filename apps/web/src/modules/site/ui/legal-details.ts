import type { getTranslations } from 'next-intl/server'

import type { LegalDetails } from '../domain/site'

type CommonTranslator = Awaited<ReturnType<typeof getTranslations<'common'>>>

/** The operator's details in one line, labelled as demo ones when they are made up. */
export function legalDetailsLine(t: CommonTranslator, legal: LegalDetails): string {
  const values = {
    name: legal.name,
    taxId: legal.taxId,
    registrationNumber: legal.registrationNumber,
  }
  return legal.demo ? t('legal.demoDetails', values) : t('legal.details', values)
}
