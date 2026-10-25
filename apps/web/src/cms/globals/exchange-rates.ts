import type { GlobalConfig } from 'payload'

import type { Locale } from '@/i18n/locales'
import {
  BASE_CURRENCY,
  CONVERTED_CURRENCIES,
  DISPLAY_CURRENCIES,
} from '@/modules/pricing/domain/currencies'
import { RATE_DECIMALS } from '@/modules/pricing/domain/exchange-rate'

import { anyone, requireCapability } from '../access/policies'
import { DAY_WITH_YEAR } from '../fields/common'
import { label } from '../fields/labels'
import { stampRateDates, validateRates } from '../hooks/exchange-rate-hooks'

/** «EN — USD»: which language shows which converted currency, straight from the registry. */
const convertedLanguages = (Object.entries(DISPLAY_CURRENCIES) as Array<[Locale, string]>)
  .filter(([, currency]) => currency !== BASE_CURRENCY)
  .map(([locale, currency]) => `${locale.toUpperCase()} — ${currency}`)
  .join(', ')

/**
 * Rates the site converts the ruble tariff with, for the languages that show another
 * currency. The single source of every converted price; saved configurations keep a copy of
 * the rates of the day they were saved.
 */
export const ExchangeRates: GlobalConfig = {
  slug: 'exchange-rates',
  label: label('Курсы валют', 'Exchange rates'),
  admin: {
    group: label('Цены и сроки', 'Prices and schedule'),
    description: label(
      `Тариф и сметы ведутся в рублях; по этим курсам цены пересчитываются для языков ${convertedLanguages}. Сохранённая конфигурация хранит курс дня сохранения`,
      `The tariff and estimates are kept in rubles; prices are converted at these rates for ${convertedLanguages}. A saved configuration keeps the rate of the day it was saved`,
    ),
  },
  access: { read: anyone, update: requireCapability('pricing.write') },
  hooks: { beforeChange: [stampRateDates, validateRates] },
  fields: [
    {
      name: 'rates',
      type: 'array',
      label: label('Курсы', 'Rates'),
      labels: { singular: label('Курс', 'Rate'), plural: label('Курсы', 'Rates') },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'currency',
              type: 'select',
              required: true,
              label: label('Валюта', 'Currency'),
              options: CONVERTED_CURRENCIES.map((code) => ({ value: code, label: code })),
              admin: { width: '25%' },
            },
            {
              name: 'rate',
              type: 'number',
              required: true,
              min: 10 ** -RATE_DECIMALS,
              label: label('Рублей за 1 единицу валюты, ₽', 'Rubles per unit of the currency, ₽'),
              admin: { step: 10 ** -RATE_DECIMALS, width: '40%' },
            },
            {
              name: 'setOn',
              type: 'date',
              label: label('Курс установлен', 'Rate set on'),
              admin: {
                readOnly: true,
                width: '35%',
                date: DAY_WITH_YEAR,
                description: label(
                  'Ставится сам, когда меняется курс',
                  'Set automatically when the rate changes',
                ),
              },
            },
          ],
        },
      ],
    },
  ],
}
