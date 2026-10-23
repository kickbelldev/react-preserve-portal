export const DEFAULT_PORTAL_ID = 'default'

export interface PortalInstance {
  targets: Map<string, HTMLElement>
  slotKey: string | null
  returnPath: string | null
}

function createPortalStore() {
  const initialState: PortalInstance = {
    targets: new Map(),
    slotKey: null,
    returnPath: null,
  }
  let state = initialState
  const listeners = new Set<() => void>()

  function update(next: PortalInstance) {
    state = next
    listeners.forEach((listener) => listener())
  }

  function unregisterTarget(slotKey: string, target?: HTMLElement) {
    if (!state.targets.has(slotKey)) return
    // An old Slot's cleanup must not remove a newer registration.
    if (target && state.targets.get(slotKey) !== target) return

    const targets = new Map(state.targets)
    targets.delete(slotKey)
    update({ ...state, targets })
  }

  return {
    getSnapshot: () => state,
    // Server rendering must not observe mutable client/request state.
    getServerSnapshot: () => initialState,
    subscribe(listener: () => void) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    registerTarget(slotKey: string, target: HTMLElement) {
      if (state.targets.get(slotKey) !== target) {
        const targets = new Map(state.targets)
        targets.set(slotKey, target)
        update({ ...state, targets })
      }
      return () => unregisterTarget(slotKey, target)
    },
    unregisterTarget,
    setSlotKey(slotKey: string | null) {
      if (state.slotKey !== slotKey) update({ ...state, slotKey })
    },
    setReturnPath(returnPath: string | null) {
      if (state.returnPath !== returnPath) update({ ...state, returnPath })
    },
    reset() {
      if (state.slotKey !== null || state.returnPath !== null) {
        // Mounted Slots stay registered so the content can be shown again.
        update({ ...state, slotKey: null, returnPath: null })
      }
    },
  }
}

// IDs retain their existing sharing semantics, with subscriptions per portal.
const portals = new Map<string, ReturnType<typeof createPortalStore>>()

export function getPortalStore(portalId: string) {
  let store = portals.get(portalId)
  if (!store) {
    store = createPortalStore()
    portals.set(portalId, store)
  }
  return store
}

export function getOrCreatePortal(portalId: string): PortalInstance {
  return getPortalStore(portalId).getSnapshot()
}

export function register(
  portalId: string,
  slotKey: string,
  target: HTMLElement,
) {
  return getPortalStore(portalId).registerTarget(slotKey, target)
}

export function unregister(portalId: string, slotKey: string) {
  portals.get(portalId)?.unregisterTarget(slotKey)
}

export function setSlotKey(portalId: string, slotKey: string | null) {
  getPortalStore(portalId).setSlotKey(slotKey)
}

export function setReturnPath(portalId: string, path: string | null) {
  getPortalStore(portalId).setReturnPath(path)
}

export function resetPortal(portalId: string) {
  portals.get(portalId)?.reset()
}
