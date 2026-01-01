import { usePlayerStore } from '../model/store'

/**
 * 전역 VideoElement - root에서 한 번만 렌더링
 * PortalHost의 children으로 사용되어 container에 렌더링됨
 */
export function VideoElement() {
  const setVideoRef = usePlayerStore((s) => s.setVideoRef)
  const src = usePlayerStore((s) => s.src)
  const syncTime = usePlayerStore((s) => s.syncTime)

  return (
    <video
      ref={(ref) => setVideoRef(ref)}
      src={src ?? undefined}
      playsInline
      className="aspect-video w-full object-contain"
      onTimeUpdate={(e) => {
        const video = e.currentTarget
        syncTime(video.currentTime, video.duration)
      }}
      onLoadedMetadata={(e) => {
        const video = e.currentTarget
        syncTime(0, video.duration)
      }}
    />
  )
}
