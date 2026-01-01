import { create } from 'zustand'

interface PlayerStore {
  videoRef: HTMLVideoElement | null
  src: string | null
  isPlaying: boolean
}

interface PlayerActions {
  setVideoRef: (ref: HTMLVideoElement | null) => void
  initVideo: (src: string) => void
  setIsPlaying: (isPlaying: boolean) => void
  reset: () => void
}
const initialState: PlayerStore = {
  videoRef: null,
  src: null,
  isPlaying: false,
}

export const usePlayerStore = create<PlayerStore & PlayerActions>(
  (set) =>
    ({
      ...initialState,

      setVideoRef: (ref) => set({ videoRef: ref }),
      initVideo: (src) => set({ src }),
      setIsPlaying: (isPlaying) => set({ isPlaying }),
      reset: () => set(initialState),
    }) satisfies PlayerStore & PlayerActions,
)
