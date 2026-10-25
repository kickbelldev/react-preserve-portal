import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { usePlayerStore } from '@/features/player/model/store'

import { VideoPortal } from '@/portals/VideoPortal'
import { CloseIcon, ReturnIcon } from '@/shared/ui/icons'

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
      className="fixed right-4 bottom-4 z-50 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-2xl bg-black text-zinc-100 shadow-2xl ring-1 shadow-black/60 ring-white/15"
    >
      {children}
      <button
        aria-label="미니플레이어 닫기"
        onClick={() => {
          pause()
          reset()
        }}
        className="absolute top-2 right-2 grid h-7 w-7 place-items-center rounded-full bg-black/60 text-white backdrop-blur transition hover:bg-black/80 focus-visible:outline-2 focus-visible:outline-white"
      >
        <CloseIcon className="h-3.5 w-3.5" />
      </button>
      <Link
        to={returnPath ?? '/'}
        className="flex items-center justify-center gap-1.5 border-t border-white/10 bg-zinc-900 py-2 text-sm text-zinc-300 transition hover:bg-zinc-800 hover:text-white"
      >
        <ReturnIcon className="h-4 w-4" />
        돌아가기
      </Link>
    </div>
  )
}
