import { MiniPortal, MiniPortalContainer } from '@/features/portal'

import { VideoControls } from './VideoControls'

export function MiniPlayer() {
  return (
    <MiniPortalContainer>
      <MiniPortal />
      <VideoControls />
    </MiniPortalContainer>
  )
}
