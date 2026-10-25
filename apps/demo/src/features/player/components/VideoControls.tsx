import { PauseIcon, PlayIcon } from '@/shared/ui/icons'

import { usePlayerStore } from '../model/store'

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0:00'

  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function VideoControls({ compact = false }: { compact?: boolean }) {
  const isPlaying = usePlayerStore((s) => s.isPlaying)
  const currentTime = usePlayerStore((s) => s.currentTime)
  const duration = usePlayerStore((s) => s.duration)
  const togglePlay = usePlayerStore((s) => s.togglePlay)
  const seek = usePlayerStore((s) => s.seek)
  const isPlayPending = usePlayerStore((s) => s.isPlayPending)
  const playbackError = usePlayerStore((s) => s.playbackError)
  const active = isPlaying || isPlayPending
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className="space-y-2 bg-zinc-900/90 px-3 pt-2.5 pb-3">
      <input
        type="range"
        aria-label="재생 위치"
        min={0}
        max={duration || 0}
        step={0.1}
        value={currentTime}
        disabled={!duration}
        onChange={(e) => seek(Number(e.currentTarget.value))}
        style={{
          background: `linear-gradient(to right, #fafafa ${progress}%, rgb(255 255 255 / 0.15) ${progress}%)`,
        }}
        className="block h-1 w-full cursor-pointer appearance-none rounded-full disabled:cursor-default [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-white [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
      />
      <div className="flex items-center gap-3">
        <button
          onClick={togglePlay}
          aria-label={active ? '일시정지' : '재생'}
          aria-busy={isPlayPending}
          className={`grid shrink-0 place-items-center rounded-full bg-white text-zinc-950 transition hover:bg-zinc-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${compact ? 'h-8 w-8' : 'h-9 w-9'}`}
        >
          {active ? (
            <PauseIcon className="h-4 w-4" />
          ) : (
            <PlayIcon className="h-4 w-4 translate-x-px" />
          )}
        </button>
        <span className="font-mono text-xs text-zinc-300 tabular-nums">
          {formatTime(currentTime)}
          <span className="text-zinc-500"> / {formatTime(duration)}</span>
        </span>
        {playbackError && (
          <span role="status" className="text-xs text-rose-300">
            {playbackError}
          </span>
        )}
      </div>
    </div>
  )
}
