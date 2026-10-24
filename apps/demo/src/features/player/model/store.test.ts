import { beforeEach, describe, expect, it, vi } from 'vitest'

import { usePlayerStore } from './store'

function media() {
  const video = {
    paused: true,
    ended: false,
    currentTime: 0,
    play: vi.fn(async () => {
      video.paused = false
    }),
    pause: vi.fn(() => {
      video.paused = true
    }),
  }
  return video
}
function attach(video: ReturnType<typeof media>) {
  const element = video as unknown as HTMLVideoElement
  usePlayerStore.getState().setVideoRef(element)
  return element
}
function deferred() {
  let resolve!: () => void
  let reject!: (reason: Error) => void
  const promise = new Promise<void>((yes, no) => {
    resolve = yes
    reject = no
  })
  return { promise, resolve, reject }
}

beforeEach(() => usePlayerStore.getState().reset())

describe('playback lifecycle', () => {
  it('handles play rejection without optimistic playing state or an unhandled promise', async () => {
    const video = media()
    const pending = deferred()
    video.play.mockReturnValue(pending.promise)
    attach(video)
    const task = usePlayerStore.getState().togglePlay()
    expect(usePlayerStore.getState()).toMatchObject({
      isPlaying: false,
      isPlayPending: true,
    })
    pending.reject(new Error('NotAllowedError'))
    await expect(task).resolves.toBeUndefined()
    expect(usePlayerStore.getState()).toMatchObject({
      isPlaying: false,
      isPlayPending: false,
    })
    expect(usePlayerStore.getState().playbackError).toBeTruthy()
    await usePlayerStore.getState().togglePlay()
    expect(usePlayerStore.getState().isPlayPending).toBe(false)
  })

  it('tracks native play, pause and ended changes, and ignores an old element', () => {
    const video = media()
    const element = attach(video)
    video.paused = false
    usePlayerStore.getState().syncPlayback(element)
    expect(usePlayerStore.getState().isPlaying).toBe(true)
    video.paused = true
    usePlayerStore.getState().syncPlayback(element)
    expect(usePlayerStore.getState().isPlaying).toBe(false)
    video.paused = false
    video.ended = true
    usePlayerStore.getState().syncPlayback(element)
    expect(usePlayerStore.getState().isPlaying).toBe(false)
    attach(media())
    video.ended = false
    usePlayerStore.getState().syncPlayback(element)
    expect(usePlayerStore.getState().isPlaying).toBe(false)
  })

  it.each(['pause', 'source', 'unmount'] as const)(
    'ignores pending play results after %s',
    async (change) => {
      const video = media()
      const pending = deferred()
      video.play.mockReturnValue(pending.promise)
      attach(video)
      const task = usePlayerStore.getState().togglePlay()
      if (change === 'pause') usePlayerStore.getState().pause()
      if (change === 'source') usePlayerStore.getState().initVideo('next.mp4')
      if (change === 'unmount') usePlayerStore.getState().setVideoRef(null)
      pending.reject(new Error('interrupted old request'))
      await task
      expect(usePlayerStore.getState()).toMatchObject({
        isPlaying: false,
        isPlayPending: false,
        playbackError: null,
      })
    },
  )

  it('can cancel pending playback with a second click and retry', async () => {
    const video = media()
    const pending = deferred()
    video.play.mockReturnValueOnce(pending.promise)
    attach(video)
    const task = usePlayerStore.getState().togglePlay()
    await usePlayerStore.getState().togglePlay()
    expect(video.pause).toHaveBeenCalledOnce()
    pending.resolve()
    await task
    expect(usePlayerStore.getState().isPlaying).toBe(false)
    await usePlayerStore.getState().togglePlay()
    expect(usePlayerStore.getState()).toMatchObject({
      isPlaying: true,
      isPlayPending: false,
      playbackError: null,
    })
  })

  it('pauses before changing source and preserves the same source on return', async () => {
    const video = media()
    attach(video)
    usePlayerStore.getState().initVideo('first.mp4')
    await usePlayerStore.getState().togglePlay()
    usePlayerStore.getState().syncTime(12, 100)
    usePlayerStore.getState().initVideo('first.mp4')
    expect(usePlayerStore.getState()).toMatchObject({
      isPlaying: true,
      currentTime: 12,
    })
    usePlayerStore.getState().initVideo('second.mp4')
    expect(video.paused).toBe(true)
    expect(usePlayerStore.getState()).toMatchObject({
      isPlaying: false,
      currentTime: 0,
      duration: 0,
    })
  })

  it('clears pending playback on media errors and normalizes live durations', async () => {
    const video = media()
    const pending = deferred()
    video.play.mockReturnValue(pending.promise)
    const element = attach(video)
    const task = usePlayerStore.getState().togglePlay()
    usePlayerStore.getState().failPlayback(element)
    pending.resolve()
    await task
    expect(usePlayerStore.getState().playbackError).toContain('불러오지')
    expect(usePlayerStore.getState().isPlayPending).toBe(false)
    usePlayerStore.getState().syncTime(NaN, Infinity)
    expect(usePlayerStore.getState()).toMatchObject({
      currentTime: 0,
      duration: 0,
    })
  })
})
