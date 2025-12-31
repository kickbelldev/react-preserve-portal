import { useEffect, useRef } from 'react'

import { usePortalStore } from '../model/store'
import { getTarget } from '../model/target'

interface PortalSlotProps {
  mode: 'main' | 'mini'
}

export function PortalSlot({ mode }: PortalSlotProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const currentMode = usePortalStore((s) => s.mode)

  const isActive = currentMode === mode

  useEffect(() => {
    if (isActive && containerRef.current) {
      const target = getTarget()
      containerRef.current.appendChild(target)
    }
  }, [isActive])

  if (!isActive) return null

  return <div ref={containerRef} className="contents" />
}
