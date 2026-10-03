import { NextIntlClientProvider, type AbstractIntlMessages } from 'next-intl'
import { getMessages } from 'next-intl/server'
import type { ReactNode } from 'react'

/** Message paths a client tree reads, e.g. `configurator` or `home.technology`. */
type MessagePath = string

/** Every client tree needs the shared texts: brand, units, actions. */
const ALWAYS: readonly MessagePath[] = ['common']

function pickPath(
  source: AbstractIntlMessages,
  keys: readonly string[],
): AbstractIntlMessages | undefined {
  const [head, ...rest] = keys
  if (head === undefined) return undefined
  const value = source[head]
  if (value === undefined) return undefined
  if (rest.length === 0) return { [head]: value }
  if (typeof value === 'string') return undefined
  const inner = pickPath(value, rest)
  return inner === undefined ? undefined : { [head]: inner }
}

function merge(left: AbstractIntlMessages, right: AbstractIntlMessages): AbstractIntlMessages {
  const result: AbstractIntlMessages = { ...left }
  for (const [key, value] of Object.entries(right)) {
    const existing = result[key]
    result[key] =
      typeof existing === 'object' && typeof value === 'object' ? merge(existing, value) : value
  }
  return result
}

const pick = (messages: AbstractIntlMessages, paths: readonly MessagePath[]) =>
  paths.reduce<AbstractIntlMessages>(
    (picked, path) => merge(picked, pickPath(messages, path.split('.')) ?? {}),
    {},
  )

/**
 * Hands a client tree only the messages it reads. Without it every page would ship the whole
 * catalog of texts (policies, articles UI, configurator) in its payload.
 */
export async function ClientMessages({
  namespaces = [],
  children,
}: {
  readonly namespaces?: readonly MessagePath[]
  readonly children: ReactNode
}) {
  const messages = await getMessages()
  return (
    <NextIntlClientProvider messages={pick(messages, [...ALWAYS, ...namespaces])}>
      {children}
    </NextIntlClientProvider>
  )
}
