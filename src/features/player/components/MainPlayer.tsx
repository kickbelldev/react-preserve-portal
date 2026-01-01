import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

import { MainPortal } from '@/features/portal'

import { usePlayerStore } from '../model/store'

interface MainPlayerProps {
  src: string
}

export function MainPlayer({ src }: MainPlayerProps) {
  const { pathname } = useLocation()

  const initVideo = usePlayerStore((s) => s.initVideo)

  useEffect(() => {
    initVideo(src)
  }, [initVideo, src])

  return (
    <div className="aspect-video max-w-4xl overflow-hidden rounded-lg bg-black">
      <MainPortal pathname={pathname} />
    </div>
  )
}
