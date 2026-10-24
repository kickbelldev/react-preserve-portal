import { MainPortal } from '@/features/portal'

import { VideoControls } from './VideoControls'

export function MainPlayer({ hidden }: { hidden: boolean }) {
  return (
    <div
      hidden={hidden}
      className="mt-4 max-w-4xl overflow-hidden rounded-lg bg-black"
    >
      <MainPortal />
      <VideoControls />
    </div>
  )
}
