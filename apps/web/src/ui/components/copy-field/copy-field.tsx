'use client'

import { CheckIcon, CopyIcon } from '@phosphor-icons/react/ssr'
import { useEffect, useId, useState } from 'react'

import { Button } from '../button/button'
import styles from './copy-field.module.css'

interface CopyFieldProps {
  readonly label: string
  readonly value: string
  readonly copyLabel: string
  readonly copiedLabel: string
}

const RESET_AFTER_MS = 2400

/** A read-only value (a link, a code) with a copy button that confirms what it did. */
export function CopyField({ label, value, copyLabel, copiedLabel }: CopyFieldProps) {
  const id = useId()
  const [copied, setCopied] = useState(false)
  useEffect(() => {
    if (!copied) return
    const timer = window.setTimeout(() => {
      setCopied(false)
    }, RESET_AFTER_MS)
    return () => {
      window.clearTimeout(timer)
    }
  }, [copied])

  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <div className={styles.row}>
        <input
          id={id}
          className={styles.value}
          readOnly
          value={value}
          onFocus={(event) => {
            event.target.select()
          }}
        />
        <Button
          variant="secondary"
          icon={copied ? CheckIcon : CopyIcon}
          onClick={() => {
            void navigator.clipboard.writeText(value).then(() => {
              setCopied(true)
            })
          }}
        >
          {copied ? copiedLabel : copyLabel}
        </Button>
      </div>
      <p className="visually-hidden" aria-live="polite">
        {copied ? copiedLabel : ''}
      </p>
    </div>
  )
}
