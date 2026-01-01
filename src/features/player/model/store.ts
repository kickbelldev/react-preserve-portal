import { create } from 'zustand'

interface PlayerState {
  videoRef: HTMLVideoElement | null
  src: string | null
  isPlaying: boolean
  currentTime: number
  duration: number
}

interface PlayerActions {
  setVideoRef: (ref: HTMLVideoElement | null) => void
  initVideo: (src: string) => void
  togglePlay: () => void
  seek: (time: number) => void
  syncTime: (current: number, duration: number) => void
  reset: () => void
}

const initialState: PlayerState = {
  videoRef: null,
  src: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
}

export const usePlayerStore = create<PlayerState & PlayerActions>(
  (set, get) =>
    ({
      ...initialState,

      setVideoRef: (ref) => set({ videoRef: ref }),

      initVideo: (src) =>
        set((state) => {
          if (state.src === src) return state

          return {
            src,
            isPlaying: false,
            currentTime: 0,
            duration: 0,
          }
        }),

      togglePlay: () => {
        const { videoRef, isPlaying } = get()
        if (!videoRef) return

        if (isPlaying) {
          videoRef.pause()
        } else {
          videoRef.play()
        }
        set({ isPlaying: !isPlaying })
      },

      seek: (time) => {
        const { videoRef } = get()
        if (!videoRef) return

        videoRef.currentTime = time
        set({ currentTime: time })
      },

      syncTime: (current, duration) =>
        set({
          currentTime: current,
          duration: Number.isNaN(duration) ? 0 : duration,
        }),

      reset: () => set(initialState),
    }) satisfies PlayerState & PlayerActions,
)
