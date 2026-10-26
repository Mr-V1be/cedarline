'use client'

import { Money } from '@cedarline/pricing'
import type { UIFieldClientComponent } from 'payload'
import { TextInput, useFormFields } from '@payloadcms/ui'

import { createPriceFormatter } from '@/modules/pricing/application/price-formatter'
import { restoreDisplayCurrency } from '@/modules/pricing/domain/exchange-rate'

const text = (value: unknown) => (typeof value === 'string' ? value : null)
const number = (value: unknown) => (typeof value === 'number' ? value : null)

/**
 * The lead's total as the customer read it on the site: the stored ruble total converted at the
 * stored rate, through the same formatter the site uses — nothing is recomputed from today.
 */
export const CustomerPrice: UIFieldClientComponent = ({ field, path }) => {
  const total = useFormFields(([fields]) => number(fields.total?.value))
  const currency = useFormFields(([fields]) => text(fields['display.currency']?.value))
  const rate = useFormFields(([fields]) => number(fields['display.rate']?.value))
  const rateSetOn = useFormFields(([fields]) => text(fields['display.rateSetOn']?.value))
  const display = currency === null ? null : restoreDisplayCurrency({ currency, rate, rateSetOn })
  const value =
    display === null || total === null
      ? ''
      : createPriceFormatter(display).format(Money.ofRubles(total), 'exact')
  return <TextInput path={path} label={field.label} value={value} readOnly />
}
