import { create } from 'zustand'

interface PlayerStore {
  src: string | null

  play: (src: string) => void
  stop: () => void
}

export const usePlayerStore = create<PlayerStore>((set) => ({
  src: null,

  play: (src) => {
    set({ src })
  },

  stop: () => {
    set({ src: null })
  },
}))
