import { PortalSlot, usePortalStore } from '@/features/portal'

import { usePlayerStore } from '../model/store'

export function MiniPlayer() {
  const mode = usePortalStore((s) => s.mode)
  const unregister = usePortalStore((s) => s.unregister)
  const stopPlayer = usePlayerStore((s) => s.stop)

  if (mode !== 'mini') return null

  const handleClose = () => {
    stopPlayer()
    unregister()
  }

  return (
    <div className="fixed right-4 bottom-4 z-50 w-80 overflow-hidden rounded-lg bg-black shadow-2xl">
      <div className="aspect-video">
        <PortalSlot mode="mini" />
      </div>
      <button
        onClick={handleClose}
        className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
      >
        ✕
      </button>
    </div>
  )
}
