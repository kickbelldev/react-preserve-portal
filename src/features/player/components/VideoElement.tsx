import { usePlayerStore } from '../model/store'

/**
 * 전역 VideoElement - root에서 한 번만 렌더링
 * PortalHost의 children으로 사용되어 container에 렌더링됨
 */
export function VideoElement() {
  const src = usePlayerStore((s) => s.src)

  if (!src) return null

  return (
    <video
      src={src}
      controls
      autoPlay
      className="h-full w-full object-contain"
    />
  )
}
