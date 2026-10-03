'use client'

import { useRouter } from '@/i18n/navigation'
import { SelectField, type SelectOption } from '@/ui/components/select/select-field'

interface TopicFilterProps {
  readonly label: string
  readonly value: string
  readonly options: readonly SelectOption[]
}

/** One topic of many: a select that changes the address, so the list is shareable. */
export function TopicFilter({ label, value, options }: TopicFilterProps) {
  const router = useRouter()
  return (
    <SelectField
      label={label}
      value={value}
      options={options}
      onChange={(event) => {
        const topic = event.target.value
        router.push(topic === '' ? '/articles' : `/articles?topic=${topic}`)
      }}
    />
  )
}
