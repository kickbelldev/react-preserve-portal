export const DEFAULT_PORTAL_ID = 'default'

export interface PortalInstance {
  targets: ReadonlyMap<string, HTMLElement>
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
  const registrations = new Map<string, symbol>()
  let owners = 0
  let disposed = false

  function assertLive() {
    if (disposed)
      throw new Error(
        'This portal store was disposed. Read fresh actions from usePortal().',
      )
  }

  function update(next: PortalInstance) {
    state = next
    listeners.forEach((listener) => listener())
  }

  function unregisterTarget(slotKey: string, token?: symbol) {
    if (disposed) return
    if (!state.targets.has(slotKey)) return
    // Registrations have identities even when they point to the same element.
    if (token && registrations.get(slotKey) !== token) return
    registrations.delete(slotKey)

    const targets = new Map(state.targets)
    targets.delete(slotKey)
    update({ ...state, targets })
  }

  return {
    retain() {
      assertLive()
      owners++
      return () => {
        owners--
      }
    },
    dispose() {
      if (owners || listeners.size || state.targets.size) return false
      disposed = true
      state = initialState
      registrations.clear()
      return true
    },
    getSnapshot: () => state,
    // Server rendering must not observe mutable client/request state.
    getServerSnapshot: () => initialState,
    subscribe(listener: () => void) {
      assertLive()
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    registerTarget(slotKey: string, target: HTMLElement) {
      assertLive()
      const token = Symbol(slotKey)
      registrations.set(slotKey, token)
      if (state.targets.get(slotKey) !== target) {
        const targets = new Map(state.targets)
        targets.set(slotKey, target)
        update({ ...state, targets })
      }
      return () => unregisterTarget(slotKey, token)
    },
    unregisterTarget,
    setSlotKey(slotKey: string | null) {
      assertLive()
      if (state.slotKey !== slotKey) update({ ...state, slotKey })
    },
    setReturnPath(returnPath: string | null) {
      assertLive()
      if (state.returnPath !== returnPath) update({ ...state, returnPath })
    },
    reset() {
      assertLive()
      if (state.slotKey !== null || state.returnPath !== null) {
        // Mounted Slots stay registered so the content can be shown again.
        update({ ...state, slotKey: null, returnPath: null })
      }
    },
  }
}

// IDs retain their existing sharing semantics, with subscriptions per portal.
const portals = new Map<string, ReturnType<typeof createPortalStore>>()

export function disposePortal(portalId: string): boolean {
  const store = portals.get(portalId)
  if (!store) return true
  if (!store.dispose()) return false
  portals.delete(portalId)
  return true
}

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
