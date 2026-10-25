import { warnOnce } from './warn'

export const DEFAULT_PORTAL_ID = 'default'

export interface PortalInstance {
  targets: ReadonlyMap<string, HTMLElement>
  slotKey: string | null
  returnPath: string | null
}

interface Registration {
  token: symbol
  target: HTMLElement
}

// Slots declared by createPortal, recorded in development to validate keys.
const declaredSlots = new Map<string, readonly string[]>()

export function declareSlots(portalId: string, slots: readonly string[]) {
  const previous = declaredSlots.get(portalId)
  if (previous && previous.join('\0') !== slots.join('\0')) {
    warnOnce(
      `createPortal was called twice for id "${portalId}" with different slots ` +
        `([${previous.join(', ')}] and [${slots.join(', ')}]). Factories with the ` +
        'same id share state; use a distinct id for an independent portal.',
    )
  }
  declaredSlots.set(portalId, slots)
}

function checkSlotKey(portalId: string, slotKey: string, action: string) {
  const slots = declaredSlots.get(portalId)
  if (slots && !slots.includes(slotKey)) {
    warnOnce(
      `${action} used slot "${slotKey}", which portal "${portalId}" does not ` +
        `declare. Declared slots: ${slots.join(', ') || '(none)'}.`,
    )
  }
}

function createPortalStore(portalId: string) {
  const initialState: PortalInstance = {
    targets: new Map(),
    slotKey: null,
    returnPath: null,
  }
  let state = initialState
  const listeners = new Set<() => void>()
  // Called synchronously before slotKey changes, while the old layout exists.
  const beforeSlotChange = new Set<() => void>()
  // Each key keeps a stack so removing the newest Slot reveals the previous one.
  const registrations = new Map<string, Registration[]>()
  let owners = 0
  let hosts = 0
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

  // Publish the newest registration for a key, or remove the key when none remain.
  function publish(slotKey: string) {
    const stack = registrations.get(slotKey)
    const target = stack?.[stack.length - 1]?.target
    if (state.targets.get(slotKey) === target) return
    const targets = new Map(state.targets)
    if (target) targets.set(slotKey, target)
    else targets.delete(slotKey)
    update({ ...state, targets })
  }

  function unregisterTarget(slotKey: string, token?: symbol) {
    if (disposed) return
    const stack = registrations.get(slotKey)
    if (!stack) return
    if (token) {
      // Registrations have identities even when they point to the same element.
      const index = stack.findIndex(
        (registration) => registration.token === token,
      )
      if (index === -1) return
      stack.splice(index, 1)
    } else {
      stack.length = 0
    }
    if (!stack.length) registrations.delete(slotKey)
    publish(slotKey)
  }

  return {
    retain() {
      assertLive()
      owners++
      return () => {
        owners--
      }
    },
    /** Count mounted Hosts; more than one appends several containers to a slot. */
    retainHost() {
      hosts++
      if (process.env.NODE_ENV !== 'production' && hosts > 1) {
        warnOnce(
          `${hosts} Hosts are mounted for portal "${portalId}". Each Host moves its ` +
            'own container into the active slot. Render one Host per portal id.',
        )
      }
      return () => {
        hosts--
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
      if (process.env.NODE_ENV !== 'production')
        checkSlotKey(portalId, slotKey, 'Slot or registerTarget')
      const token = Symbol(slotKey)
      const stack = registrations.get(slotKey) ?? []
      stack.push({ token, target })
      registrations.set(slotKey, stack)
      publish(slotKey)
      return () => unregisterTarget(slotKey, token)
    },
    unregisterTarget,
    setSlotKey(slotKey: string | null) {
      assertLive()
      if (process.env.NODE_ENV !== 'production' && slotKey !== null)
        checkSlotKey(portalId, slotKey, 'setSlotKey')
      if (state.slotKey === slotKey) return
      beforeSlotChange.forEach((listener) => listener())
      update({ ...state, slotKey })
    },
    onBeforeSlotChange(listener: () => void) {
      beforeSlotChange.add(listener)
      return () => {
        beforeSlotChange.delete(listener)
      }
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
    store = createPortalStore(portalId)
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
