'use client'

import { Button, toast, useAuth, useDocumentInfo, useTranslation } from '@payloadcms/ui'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import type { Lead, User } from '@/cms/generated/payload-types'
import { rolesGrant } from '@/modules/access/domain/roles'
import { DELIVERY_RETRY } from '@/modules/leads/domain/delivery-policy'

type Row = NonNullable<Lead['deliveries']>[number]

const COPY = {
  ru: {
    title: 'Не доставлено',
    auto: `Сайт повторяет доставку сам: до ${DELIVERY_RETRY.attempts} попыток с растущими паузами.`,
    retry: 'Повторить сейчас',
    retrying: 'Повторяем…',
    delivered: 'Доставлено',
    failed: 'Снова не удалось',
    channels: { 'mail:client': 'Письмо клиенту', 'mail:manager': 'Письмо менеджеру' } as Record<
      string,
      string
    >,
  },
  en: {
    title: 'Not delivered',
    auto: `The site retries on its own: up to ${DELIVERY_RETRY.attempts} attempts with growing pauses.`,
    retry: 'Retry now',
    retrying: 'Retrying…',
    delivered: 'Delivered',
    failed: 'Failed again',
    channels: {
      'mail:client': 'Email to the customer',
      'mail:manager': 'Email to sales',
    } as Record<string, string>,
  },
} as const

/** The latest entry of each channel decides whether it still waits for delivery. */
function undelivered(rows: readonly Row[]): Row[] {
  const latest = new Map<string, Row>()
  for (const row of rows) latest.set(row.channel, row)
  return [...latest.values()].filter((row) => row.status === 'failed')
}

/**
 * Lead card panel: channels the lead has not reached yet, with a manual retry next to each.
 * Automatic retries run in the background; this is for when a manager does not want to wait.
 */
export function LeadDeliveries() {
  const { id } = useDocumentInfo()
  const { user } = useAuth<User>()
  const { i18n } = useTranslation()
  const router = useRouter()
  const copy = i18n.language === 'en' ? COPY.en : COPY.ru
  const [rows, setRows] = useState<readonly Row[]>([])
  const [busy, setBusy] = useState<string | null>(null)
  // Bumped after a retry so the log is read again.
  const [version, setVersion] = useState(0)
  const canRetry = rolesGrant(user?.roles ?? [], 'leads.write')

  useEffect(() => {
    if (id === undefined) return
    const controller = new AbortController()
    void fetch(`/api/leads/${String(id)}?depth=0`, {
      credentials: 'include',
      signal: controller.signal,
    })
      .then((response) =>
        response.ok ? (response.json() as Promise<Pick<Lead, 'deliveries'>>) : null,
      )
      .then((lead) => {
        if (lead !== null) setRows(lead.deliveries ?? [])
      })
      .catch(() => {
        // Aborted on unmount or offline: the full log below still shows the deliveries.
      })
    return () => {
      controller.abort()
    }
  }, [id, version])

  const failed = undelivered(rows)
  if (failed.length === 0) return null

  const retry = async (channel: string) => {
    setBusy(channel)
    try {
      const response = await fetch(`/api/leads/${String(id)}/deliveries/retry`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ channel }),
      })
      const body = (await response.json()) as { outcome?: { status: string } }
      if (body.outcome?.status === 'delivered') toast.success(copy.delivered)
      else toast.error(copy.failed)
      setVersion((value) => value + 1)
      router.refresh()
    } finally {
      setBusy(null)
    }
  }

  return (
    <section className="lead-deliveries" aria-label={copy.title}>
      <h3 className="lead-deliveries__title">{copy.title}</h3>
      <p className="lead-deliveries__note">{copy.auto}</p>
      <ul className="lead-deliveries__list">
        {failed.map((row) => (
          <li key={row.channel} className="lead-deliveries__item">
            <div>
              <strong>{copy.channels[row.channel] ?? row.channel}</strong>
              {row.error ? <p className="lead-deliveries__error">{row.error}</p> : null}
            </div>
            {canRetry ? (
              <Button
                buttonStyle="secondary"
                size="small"
                disabled={busy !== null}
                onClick={() => {
                  void retry(row.channel)
                }}
              >
                {busy === row.channel ? copy.retrying : copy.retry}
              </Button>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  )
}
