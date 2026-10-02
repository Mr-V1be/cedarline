'use client'

import { useLocale } from 'next-intl'
import { useTransition } from 'react'

import { usePathname, useRouter } from '@/i18n/navigation'
import { LOCALE_DEFINITIONS, LOCALES, isLocale } from '@/i18n/locales'
import { SelectField } from '@/ui/components/select/select-field'

/** Switches the language and keeps the visitor on the same page with the same filters. */
export function LocaleSwitcher({
  label,
  className,
}: {
  readonly label: string
  readonly className?: string
}) {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const [pending, startTransition] = useTransition()

  return (
    <SelectField
      className={className}
      label={label}
      hideLabel
      value={locale}
      disabled={pending}
      options={LOCALES.map((code) => ({ value: code, label: LOCALE_DEFINITIONS[code].nativeName }))}
      onChange={(event) => {
        const next = event.target.value
        if (!isLocale(next)) return
        startTransition(() => {
          router.replace(`${pathname}${window.location.search}${window.location.hash}`, {
            locale: next,
            scroll: false,
          })
        })
      }}
    />
  )
}
