import { useEffect, useRef } from 'react'

import { usePortalStore } from '../model/store'

interface PortalSlotProps {
  mode: 'main' | 'mini'
}

export function PortalSlot({ mode }: PortalSlotProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const container = usePortalStore((s) => s.container)
  const currentMode = usePortalStore((s) => s.mode)

  const isActive = currentMode === mode

  useEffect(() => {
    if (isActive && container && containerRef.current) {
      containerRef.current.appendChild(container)
    }
  }, [isActive, container])

  if (!isActive) return null

  return <div ref={containerRef} className="contents" />
}
