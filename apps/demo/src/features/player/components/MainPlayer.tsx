import { MainPortal } from '@/features/portal'

import { VideoControls } from './VideoControls'

export function MainPlayer({ hidden }: { hidden: boolean }) {
  return (
    <div
      hidden={hidden}
      className="overflow-hidden rounded-2xl bg-black shadow-2xl ring-1 shadow-black/40 ring-white/10"
    >
      <MainPortal />
      <VideoControls />
    </div>
  )
}
