import { create } from 'zustand'

interface PlayerState {
  videoRef: HTMLVideoElement | null
  src: string | null
  isPlaying: boolean
  isPlayPending: boolean
  playbackError: string | null
  currentTime: number
  duration: number
}

interface PlayerActions {
  setVideoRef: (ref: HTMLVideoElement | null) => void
  initVideo: (src: string) => void
  togglePlay: () => Promise<void>
  pause: () => void
  syncPlayback: (video: HTMLVideoElement) => void
  failPlayback: (video: HTMLVideoElement) => void
  seek: (time: number) => void
  syncTime: (current: number, duration: number) => void
  reset: () => void
}

const initialState: PlayerState = {
  videoRef: null,
  src: null,
  isPlaying: false,
  isPlayPending: false,
  playbackError: null,
  currentTime: 0,
  duration: 0,
}

export const usePlayerStore = create<PlayerState & PlayerActions>(
  (set, get) => {
    // Ignore a pending play result after pause, source replacement or unmount.
    let request = 0
    return {
      ...initialState,

      setVideoRef: (videoRef) => {
        if (videoRef === get().videoRef) return
        request++
        set({
          videoRef,
          isPlaying: !!videoRef && !videoRef.paused && !videoRef.ended,
          isPlayPending: false,
          playbackError: null,
        })
      },

      initVideo: (src) => {
        if (get().src === src) return
        get().pause()
        set({
          src,
          isPlaying: false,
          isPlayPending: false,
          playbackError: null,
          currentTime: 0,
          duration: 0,
        })
      },

      togglePlay: async () => {
        const { videoRef } = get()
        if (!videoRef) return
        if (!videoRef.paused || get().isPlayPending) {
          get().pause()
          return
        }
        const currentRequest = ++request
        set({ isPlayPending: true, playbackError: null })
        try {
          await videoRef.play()
          if (request === currentRequest) {
            get().syncPlayback(videoRef)
            set({ isPlayPending: false })
          }
        } catch {
          if (request === currentRequest) {
            get().syncPlayback(videoRef)
            set({
              isPlayPending: false,
              playbackError: '재생할 수 없습니다. 다시 시도해 주세요.',
            })
          }
        }
      },

      pause: () => {
        request++
        const video = get().videoRef
        video?.pause()
        set({ isPlaying: false, isPlayPending: false, playbackError: null })
      },

      syncPlayback: (video) => {
        if (video !== get().videoRef) return
        const isPlaying = !video.paused && !video.ended
        set({ isPlaying, ...(!video.paused ? { playbackError: null } : {}) })
      },

      failPlayback: (video) => {
        if (video !== get().videoRef) return
        request++
        set({
          isPlaying: false,
          isPlayPending: false,
          playbackError:
            '영상을 불러오지 못했습니다. 다른 영상을 선택해 주세요.',
        })
      },

      seek: (time) => {
        const { videoRef } = get()
        if (!videoRef || !Number.isFinite(time)) return
        videoRef.currentTime = time
        set({ currentTime: time })
      },

      syncTime: (current, duration) =>
        set({
          currentTime: Number.isFinite(current) ? current : 0,
          duration: Number.isFinite(duration) ? duration : 0,
        }),

      reset: () => {
        get().pause()
        set(initialState)
      },
    }
  },
)
