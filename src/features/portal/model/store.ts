import type { ReactNode } from 'react'
import { create } from 'zustand'

type PortalMode = 'main' | 'mini'

interface PortalState {
  element: ReactNode | null
  container: HTMLDivElement
  mode: PortalMode | null
}
interface PortalActions {
  register: (element: ReactNode) => void
  unregister: () => void
  setMode: (mode: PortalMode) => void
}

const container = document.createElement('div')
container.style.width = '100%'
container.style.height = '100%'

export const usePortalStore = create<PortalState & PortalActions>((set) => ({
  element: null,
  container,
  mode: null,

  register: (element: ReactNode) => {
    set({ element, mode: 'main' })
  },

  unregister: () => {
    set({ element: null, mode: null })
  },

  setMode: (mode) => {
    set({ mode })
  },
}))
