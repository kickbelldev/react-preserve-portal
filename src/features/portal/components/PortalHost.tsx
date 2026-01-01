import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

import { usePortal } from '../hooks/usePortal'
import { DEFAULT_PORTAL_ID } from '../model/store'

interface PortalHostProps {
  portalId?: string
  children: ReactNode
}

export function PortalHost({
  portalId = DEFAULT_PORTAL_ID,
  children,
}: PortalHostProps) {
  const unmanagedNodeRef = useRef<HTMLDivElement>(document.createElement('div'))

  const { mode, targets } = usePortal(portalId)
  const target = targets.get(mode ?? '')

  useEffect(() => {
    const unmanagedNode = unmanagedNodeRef.current

    if (unmanagedNode && target && !target.contains(unmanagedNode)) {
      target.appendChild(unmanagedNode)
    }

    return () => {
      if (unmanagedNode?.parentElement) {
        unmanagedNode.parentElement.removeChild(unmanagedNode)
      }
    }
  }, [target])

  // eslint-disable-next-line react-hooks/rules-of-hooks
  return <>{createPortal(children, unmanagedNodeRef.current)}</>
}
