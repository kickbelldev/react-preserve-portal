import { useEffect } from 'react'

import { MainPortal, usePortalStore } from '@/features/portal'

import { usePlayerStore } from '../model/store'

interface MainPlayerProps {
  src: string
}

export function MainPlayer({ src }: MainPlayerProps) {
  const activate = usePortalStore((s) => s.activate)
  const setMode = usePortalStore((s) => s.setMode)
  const play = usePlayerStore((s) => s.play)
  const stop = usePlayerStore((s) => s.stop)

  useEffect(() => {
    activate(stop)
    play(src)

    return () => setMode('mini')
  }, [src, activate, play, stop, setMode])

  return (
    <div className="aspect-video max-w-4xl overflow-hidden rounded-lg bg-black">
      <MainPortal />
    </div>
  )
}
