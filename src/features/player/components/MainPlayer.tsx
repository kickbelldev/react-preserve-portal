import { PortalSlot } from '@/features/portal'

export function MainPlayer() {
  return (
    <div className="aspect-video max-w-4xl overflow-hidden rounded-lg bg-black">
      <PortalSlot mode="main" />
    </div>
  )
}
