import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

import { DEFAULT_PORTAL_ID } from '../model/store'
import { usePortal } from '../model/usePortal'

interface PortalHostProps<T extends keyof HTMLElementTagNameMap = 'div'> {
  portalId?: string
  children: ReactNode
  as?: T
}

export function PortalHost<T extends keyof HTMLElementTagNameMap = 'div'>({
  portalId = DEFAULT_PORTAL_ID,
  children,
  as: container = 'div' as T,
}: PortalHostProps<T>) {
  const unmanagedNodeRef = useRef<HTMLElement>(
    document.createElement(container),
  )

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

  // eslint-disable-next-line react-hooks/refs
  return <>{createPortal(children, unmanagedNodeRef.current)}</>
}
