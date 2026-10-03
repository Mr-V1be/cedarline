import {
  ValidationError,
  type GlobalBeforeChangeHook,
  type GlobalConfig,
  type NumberField,
} from 'payload'

import type { Financing as FinancingDocument } from '@/cms/generated/payload-types'
import { FinanceError } from '@/modules/finance/domain/finance-error'
import { validateFinancingTerms } from '@/modules/finance/domain/financing-terms'
import { toFinancingTerms } from '@/modules/finance/infrastructure/financing-mapper'

import { anyone, requireCapability } from '../access/policies'
import { label, type Labels } from '../fields/labels'

const whole = (name: string, labels: Labels, min = 0, max?: number): NumberField => ({
  name,
  type: 'number',
  label: labels,
  required: true,
  min,
  ...(max === undefined ? {} : { max }),
  admin: { step: 1, width: '33%' },
})

const validateTerms: GlobalBeforeChangeHook = ({ data, req }) => {
  const submitted = data as Pick<FinancingDocument, 'mortgage' | 'installment'>
  try {
    validateFinancingTerms(toFinancingTerms(submitted))
  } catch (error) {
    if (!(error instanceof FinanceError)) throw error
    throw new ValidationError({
      global: 'financing',
      errors: [{ path: 'mortgage', message: error.message }],
      req,
    })
  }
  return submitted
}

/** Terms of the mortgage and instalment plans in the calculator; the key rate comes from the CBR. */
export const Financing: GlobalConfig = {
  slug: 'financing',
  label: label('Рассрочка и ипотека', 'Instalments and mortgage'),
  admin: { group: label('Цены и сроки', 'Prices and schedule') },
  access: { read: anyone, update: requireCapability('pricing.write') },
  hooks: { beforeChange: [validateTerms] },
  fields: [
    {
      name: 'mortgage',
      type: 'group',
      label: label('Ипотека банка-партнёра', 'Partner bank mortgage'),
      fields: [
        {
          name: 'margin',
          type: 'number',
          label: label('Надбавка к ключевой ставке, п. п.', 'Margin over the key rate, pp'),
          required: true,
          min: 0,
          admin: { step: 0.05 },
        },
        {
          type: 'row',
          fields: [
            whole('minDownPercent', label('Первый взнос от, %', 'Minimum down payment, %'), 0, 99),
            whole(
              'defaultDownPercent',
              label('Первый взнос по умолчанию, %', 'Default down payment, %'),
              0,
              99,
            ),
          ],
        },
        {
          type: 'row',
          fields: [
            whole('minYears', label('Срок от, лет', 'Shortest term, years'), 1),
            whole('maxYears', label('Срок до, лет', 'Longest term, years'), 1),
            whole('defaultYears', label('Срок по умолчанию, лет', 'Default term, years'), 1),
          ],
        },
      ],
    },
    {
      name: 'installment',
      type: 'group',
      label: label('Рассрочка от производителя', 'Factory instalment plan'),
      fields: [
        {
          type: 'row',
          fields: [
            whole('interestFreeMonths', label('Без переплаты, мес.', 'Interest-free, months')),
            whole('maxMonths', label('Срок до, мес.', 'Longest term, months'), 1),
            whole('defaultMonths', label('Срок по умолчанию, мес.', 'Default term, months'), 1),
          ],
        },
        {
          type: 'row',
          fields: [
            whole('minDownPercent', label('Первый взнос от, %', 'Minimum down payment, %'), 0, 99),
            whole(
              'defaultDownPercent',
              label('Первый взнос по умолчанию, %', 'Default down payment, %'),
              0,
              99,
            ),
            whole(
              'keyRateShare',
              label(
                'Ставка после льготного срока, % от ключевой',
                'Rate after the free period, % of the key rate',
              ),
              0,
              100,
            ),
          ],
        },
      ],
    },
  ],
}
