import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

import { DEFAULT_PORTAL_ID } from './store'
import { usePortal } from './usePortal'

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

  return <>{createPortal(children, unmanagedNodeRef.current)}</>
}
