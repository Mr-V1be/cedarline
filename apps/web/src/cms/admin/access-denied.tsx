'use client'

import { Button, Gutter, useStepNav } from '@payloadcms/ui'
import { useEffect } from 'react'

interface AccessDeniedProps {
  /** The section the visitor tried to open, in their language. */
  readonly section: string
  /** Roles that can open it, in their language; empty when no role is declared. */
  readonly roles: readonly string[]
  readonly signedInAs: string
  readonly dashboardHref: string
  readonly copy: {
    readonly title: string
    readonly lead: string
    readonly roles: string
    readonly signedIn: string
    readonly back: string
  }
}

/**
 * Shown instead of «not found» when the section exists but the signed-in role may not open it:
 * says so plainly, names the roles that can and leads back to the dashboard.
 */
export function AccessDenied({
  section,
  roles,
  signedInAs,
  dashboardHref,
  copy,
}: AccessDeniedProps) {
  const { setStepNav } = useStepNav()
  useEffect(() => {
    setStepNav([{ label: section }])
  }, [section, setStepNav])

  return (
    <Gutter className="access-denied">
      <h1 className="access-denied__title">{copy.title}</h1>
      <p className="access-denied__lead">{copy.lead}</p>
      {roles.length > 0 ? (
        <p className="access-denied__roles">
          {copy.roles} <strong>{roles.join(', ')}</strong>
        </p>
      ) : null}
      <p className="access-denied__user">
        {copy.signedIn} <strong>{signedInAs}</strong>
      </p>
      <Button el="link" to={dashboardHref} size="large">
        {copy.back}
      </Button>
    </Gutter>
  )
}
