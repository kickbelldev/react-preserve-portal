import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

import { DEFAULT_PORTAL_ID } from '../model/store'
import { usePortal } from '../model/usePortal'

interface InternalPortalHostProps<
  T extends keyof HTMLElementTagNameMap = 'div',
> {
  portalId?: string
  node: ReactNode
  as?: T
}

export function InternalPortalHost<
  T extends keyof HTMLElementTagNameMap = 'div',
>({
  portalId = DEFAULT_PORTAL_ID,
  node,
  as: container = 'div' as T,
}: InternalPortalHostProps<T>) {
  const unmanagedNodeRef = useRef<HTMLElement>(
    document.createElement(container),
  )

  const { slotKey, targets } = usePortal(portalId)
  const target = targets.get(slotKey ?? '')

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
  return <>{createPortal(node, unmanagedNodeRef.current)}</>
}
