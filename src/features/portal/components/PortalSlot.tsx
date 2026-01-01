import { useLayoutEffect, useRef } from 'react'

import { usePortal } from '../hooks/usePortal'
import { DEFAULT_PORTAL_ID } from '../model/store'

interface PortalSlotProps {
  portalId?: string
  mode: string
}

export function PortalSlot({
  portalId = DEFAULT_PORTAL_ID,
  mode,
}: PortalSlotProps) {
  const slotRef = useRef<HTMLDivElement>(null)
  const { registerTarget, unregisterTarget } = usePortal(portalId)

  useLayoutEffect(() => {
    if (slotRef.current) {
      registerTarget(mode, slotRef.current)
    }

    return () => unregisterTarget(mode)
  }, [mode, registerTarget, unregisterTarget])

  return <div ref={slotRef} className="contents" />
}
