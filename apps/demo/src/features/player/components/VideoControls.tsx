import { usePlayerStore } from '../model/store'

function formatTime(seconds: number): string {
  if (!seconds || Number.isNaN(seconds)) return '0:00'

  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function VideoControls() {
  const isPlaying = usePlayerStore((s) => s.isPlaying)
  const currentTime = usePlayerStore((s) => s.currentTime)
  const duration = usePlayerStore((s) => s.duration)
  const togglePlay = usePlayerStore((s) => s.togglePlay)

  return (
    <div className="flex items-center gap-2 bg-black/80 px-3 py-2">
      <button
        onClick={togglePlay}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30"
      >
        {isPlaying ? '⏸' : '▶'}
      </button>
      <span className="text-xs text-white/80">
        {formatTime(currentTime)} / {formatTime(duration)}
      </span>
    </div>
  )
}
