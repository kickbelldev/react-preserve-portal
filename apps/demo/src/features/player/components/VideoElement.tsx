import { VIDEO_POSTER } from '@/shared/constants/VIDEO_META'

import { usePlayerStore } from '../model/store'

/**
 * 전역 VideoElement - root에서 한 번만 렌더링
 * PortalHost의 children으로 사용되어 container에 렌더링됨
 */
export function VideoElement() {
  const setVideoRef = usePlayerStore((s) => s.setVideoRef)
  const src = usePlayerStore((s) => s.src)
  const syncTime = usePlayerStore((s) => s.syncTime)
  const syncPlayback = usePlayerStore((s) => s.syncPlayback)
  const failPlayback = usePlayerStore((s) => s.failPlayback)

  return (
    <video
      ref={setVideoRef}
      src={src ?? undefined}
      poster={VIDEO_POSTER}
      // The reel is a seamless loop.
      loop
      playsInline
      className="aspect-video w-full object-contain"
      onPlay={(e) => syncPlayback(e.currentTarget)}
      onPause={(e) => syncPlayback(e.currentTarget)}
      onEnded={(e) => syncPlayback(e.currentTarget)}
      onEmptied={(e) => {
        syncPlayback(e.currentTarget)
        syncTime(0, 0)
      }}
      onError={(e) => failPlayback(e.currentTarget)}
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
