import { usePortalStore } from '@/features/portal'

import { usePlayerStore } from '../model/store'

/**
 * 전역 VideoElement - root에서 한 번만 렌더링
 * portal의 detached element에 video를 createPortal로 렌더링
 */
export function VideoElement() {
  const container = usePortalStore((s) => s.container)
  const src = usePlayerStore((s) => s.src)

  if (!container || !src) return null

  return (
    <video
      src={src}
      controls
      autoPlay
      className="h-full w-full object-contain"
    />
  )
}
