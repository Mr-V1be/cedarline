import { createTranslator } from 'next-intl'

import { loadMessages } from '@/i18n/messages'

import type { DescribeInput } from '../application/submit-lead'

const MM_PER_M = 1000

/** One line about the configuration for lists, subjects and the CRM title. */
export async function describeLead(input: DescribeInput): Promise<string> {
  const messages = await loadMessages(input.locale)
  const t = createTranslator({ locale: input.locale, messages, namespace: 'mail' })
  return t('summary', {
    project: input.projectTitle,
    width: input.width / MM_PER_M,
    depth: input.depth / MM_PER_M,
    completeness: input.completeness,
  })
}
