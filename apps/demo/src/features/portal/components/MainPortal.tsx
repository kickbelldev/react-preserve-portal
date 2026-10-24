import { VideoPortal } from '@/portals/VideoPortal'

export function MainPortal() {
  return <VideoPortal.Slot slotKey="main" className="contents" />
}
