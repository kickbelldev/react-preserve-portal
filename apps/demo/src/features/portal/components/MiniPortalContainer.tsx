import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { usePlayerStore } from '@/features/player/model/store'

import { VideoPortal } from '@/portals/VideoPortal'

interface MiniPortalContainerProps {
  children: ReactNode
}

export function MiniPortalContainer({ children }: MiniPortalContainerProps) {
  const { slotKey, returnPath, reset } = VideoPortal.usePortal()
  const pause = usePlayerStore((state) => state.pause)
  const isActive = slotKey === 'mini'

  return (
    <div
      hidden={!isActive}
      className="fixed right-4 bottom-4 z-50 w-80 overflow-hidden rounded-lg bg-black shadow-2xl"
    >
      {children}
      <button
        aria-label="미니플레이어 닫기"
        onClick={() => {
          pause()
          reset()
        }}
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
