import { useLayoutEffect, useRef, type HTMLAttributes } from 'react'

import { DEFAULT_PORTAL_ID } from './store'
import { usePortal } from './usePortal'

interface PortalSlotProps extends HTMLAttributes<HTMLDivElement> {
  portalId?: string
  mode: string
}

export function PortalSlot({
  portalId = DEFAULT_PORTAL_ID,
  mode,
  ...props
}: PortalSlotProps) {
  const slotRef = useRef<HTMLDivElement>(null)
  const { registerTarget, unregisterTarget } = usePortal(portalId)

  useLayoutEffect(() => {
    if (slotRef.current) {
      registerTarget(mode, slotRef.current)
    }

    return () => unregisterTarget(mode)
  }, [mode, registerTarget, unregisterTarget])

  return <div ref={slotRef} {...props} />
}
