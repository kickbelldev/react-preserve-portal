import { create } from 'zustand'

type PortalMode = 'main' | 'mini'

interface PortalState {
  mode: PortalMode | null
  onClose: (() => void) | null
}

interface PortalActions {
  activate: (onClose?: () => void) => void
  deactivate: () => void
  setMode: (mode: PortalMode) => void
}

export const usePortalStore = create<PortalState & PortalActions>((set, get) => ({
  mode: null,
  onClose: null,

  activate: (onClose) => {
    get().onClose?.()
    set({ mode: 'main', onClose: onClose ?? null })
  },

  deactivate: () => {
    get().onClose?.()
    set({ mode: null, onClose: null })
  },

  setMode: (mode) => {
    set({ mode })
  },
}))
