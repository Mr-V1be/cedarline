import { CalculatorIcon } from '@phosphor-icons/react/ssr'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { getServices } from '@/composition/services'
import type { Locale } from '@/i18n/locales'
import { currentKeyRate } from '@/modules/finance/application/key-rate-service'
import { Calculator } from '@/modules/finance/ui/calculator'
import { pageMetadata } from '@/modules/seo/ui/page-metadata'
import { ButtonLink } from '@/ui/components/button/button'
import { Container } from '@/ui/components/layout/container'
import { StateMessage } from '@/ui/components/state/state-message'
import { ClientMessages } from '@/i18n/client-messages'

import styles from './calculator.module.css'

/** The key rate and prices change; every request reads them (the key rate through its cache). */
export const dynamic = 'force-dynamic'

interface CalculatorPageProps {
  readonly params: Promise<{ locale: Locale }>
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>
}

/** `?amount=`: a house price in the tariff's rubles; the calculator shows it in the visitor's currency. */
const AMOUNT = /^\d{5,10}$/

export async function generateMetadata({ params }: CalculatorPageProps): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'calculator.meta' })
  return pageMetadata({
    locale,
    path: '/calculator',
    title: t('title'),
    description: t('description'),
  })
}

export default async function CalculatorPage({ params, searchParams }: CalculatorPageProps) {
  const [{ locale }, query] = await Promise.all([params, searchParams])
  const [services, t] = await Promise.all([getServices(locale), getTranslations('calculator')])
  const [terms, keyRate, projects] = await Promise.all([
    services.finance.terms.load(),
    currentKeyRate(services.finance.keyRate),
    services.projects.priceList(locale),
  ])
  const requested = typeof query.project === 'string' ? query.project : undefined
  const chosen = projects.find((project) => project.slug === requested) ?? projects[0]
  const amount =
    typeof query.amount === 'string' && AMOUNT.test(query.amount) ? Number(query.amount) : null

  return (
    <Container className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>{t('title')}</h1>
        <p className={styles.lead}>{t('lead')}</p>
      </header>
      {terms === null ? (
        <StateMessage
          glyph={CalculatorIcon}
          title={t('unavailable.title')}
          description={t('unavailable.description')}
          action={<ButtonLink href="/contacts">{t('unavailable.action')}</ButtonLink>}
        />
      ) : (
        <ClientMessages namespaces={['calculator']}>
          <Calculator
            terms={terms}
            keyRate={
              keyRate === null
                ? null
                : {
                    rate: keyRate.keyRate.rate,
                    effectiveFrom: keyRate.keyRate.effectiveFrom.toISOString(),
                    fetchedAt: keyRate.fetchedAt.toISOString(),
                    stale: keyRate.stale,
                  }
            }
            projects={projects.map((project) => ({
              slug: project.slug,
              title: project.title,
              price: project.fromPrice,
            }))}
            initial={{
              project: amount === null ? (chosen?.slug ?? '') : '',
              price: amount ?? chosen?.fromPrice ?? 0,
            }}
          />
        </ClientMessages>
      )}
    </Container>
  )
}
