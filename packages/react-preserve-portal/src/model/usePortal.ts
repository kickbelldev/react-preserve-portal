import { useSyncExternalStore } from 'react'

import { DEFAULT_PORTAL_ID, getPortalStore } from './store'
import { useCommittedEffect } from './useCommittedEffect'

export function usePortal(portalId: string = DEFAULT_PORTAL_ID) {
  const store = getPortalStore(portalId)
  // Retain hidden owners too; retain/release never schedule React updates.
  useCommittedEffect(store.retain, [store])
  const state = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot,
  )

  return {
    ...state,
    setSlotKey: store.setSlotKey,
    setReturnPath: store.setReturnPath,
    reset: store.reset,
    registerTarget: store.registerTarget,
    unregisterTarget: store.unregisterTarget,
  }
}
