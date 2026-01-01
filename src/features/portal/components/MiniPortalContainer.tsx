import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { usePortal } from '../hooks/usePortal'
import { DEFAULT_PORTAL_ID } from '../model/store'

interface MiniPortalContainerProps {
  portalId?: string
  children: ReactNode
}

export function MiniPortalContainer({
  portalId = DEFAULT_PORTAL_ID,
  children,
}: MiniPortalContainerProps) {
  const { mode, returnPath, reset } = usePortal(portalId)
  const isActive = mode === 'mini'

  if (!isActive) return null

  return (
    <div className="fixed right-4 bottom-4 z-50 w-80 overflow-hidden rounded-lg bg-black shadow-2xl">
      {children}
      <button
        onClick={reset}
        className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
      >
        ✕
      </button>
      <Link
        to={returnPath ?? '/'}
        className="block w-full bg-white/90 p-2 text-center text-sm text-black hover:bg-white"
      >
        돌아가기
      </Link>
    </div>
  )
}
