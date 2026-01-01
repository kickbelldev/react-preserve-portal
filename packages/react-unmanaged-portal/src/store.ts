import { create } from 'zustand'

const DEFAULT_PORTAL_ID = 'default'

interface PortalInstance {
  targets: Map<string, HTMLElement>
  mode: string | null
  returnPath: string | null
}

interface PortalState {
  portals: Map<string, PortalInstance>
}

interface PortalActions {
  getOrCreatePortal: (portalId: string) => PortalInstance
  register: (portalId: string, mode: string, target: HTMLElement) => void
  unregister: (portalId: string, mode: string) => void
  setMode: (portalId: string, mode: string | null) => void
  setReturnPath: (portalId: string, path: string | null) => void
  resetPortal: (portalId: string) => void
}

const createEmptyInstance = (): PortalInstance => ({
  targets: new Map(),
  mode: null,
  returnPath: null,
})

export const usePortalStore = create<PortalState & PortalActions>(
  (set, get) => ({
    portals: new Map(),

    getOrCreatePortal: (portalId) => {
      const existing = get().portals.get(portalId)
      if (existing) return existing

      const newInstance = createEmptyInstance()
      set((state) => {
        const portals = new Map(state.portals)
        portals.set(portalId, newInstance)
        return { portals }
      })
      return newInstance
    },

    register: (portalId, mode, target) =>
      set((state) => {
        const portals = new Map(state.portals)
        const instance = portals.get(portalId) ?? createEmptyInstance()
        const targets = new Map(instance.targets)
        targets.set(mode, target)
        portals.set(portalId, { ...instance, targets })
        return { portals }
      }),

    unregister: (portalId, mode) =>
      set((state) => {
        const portals = new Map(state.portals)
        const instance = portals.get(portalId)
        if (!instance) return state

        const targets = new Map(instance.targets)
        targets.delete(mode)
        portals.set(portalId, { ...instance, targets })
        return { portals }
      }),

    setMode: (portalId, mode) =>
      set((state) => {
        const portals = new Map(state.portals)
        const instance = portals.get(portalId) ?? createEmptyInstance()
        portals.set(portalId, { ...instance, mode })
        return { portals }
      }),

    setReturnPath: (portalId, path) =>
      set((state) => {
        const portals = new Map(state.portals)
        const instance = portals.get(portalId) ?? createEmptyInstance()
        portals.set(portalId, { ...instance, returnPath: path })
        return { portals }
      }),

    resetPortal: (portalId) =>
      set((state) => {
        const portals = new Map(state.portals)
        portals.set(portalId, createEmptyInstance())
        return { portals }
      }),
  }),
)

export { DEFAULT_PORTAL_ID }
export type { PortalInstance }
