import { Link } from 'react-router-dom'

import { MiniPortal, usePortalStore } from '@/features/portal'

import { cn } from '@/shared/utils/cn'

export function MiniPlayer() {
  const isActive = usePortalStore((state) => state.mode === 'mini')
  const returnPath = usePortalStore((s) => s.returnPath)
  const reset = usePortalStore((s) => s.reset)

  return (
    <div
      className={cn(
        'fixed right-4 bottom-4 z-50 w-80 overflow-hidden rounded-lg bg-black shadow-2xl',
        isActive ? 'block' : 'hidden',
      )}
    >
      <MiniPortal />
      <button
        onClick={reset}
        className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
      >
        ✕
      </button>
      <Link to={returnPath ?? '/'} className="bg-white p-2 block w-full ">
        돌아가기
      </Link>
    </div>
  )
}
