import { useCallback } from 'react'

import { DEFAULT_PORTAL_ID, usePortalStore } from '../model/store'

export function usePortal(portalId: string = DEFAULT_PORTAL_ID) {
  const portal = usePortalStore((s) => s.portals.get(portalId))
  const register = usePortalStore((s) => s.register)
  const unregister = usePortalStore((s) => s.unregister)
  const setModeAction = usePortalStore((s) => s.setMode)
  const setReturnPathAction = usePortalStore((s) => s.setReturnPath)
  const resetPortalAction = usePortalStore((s) => s.resetPortal)

  const mode = portal?.mode ?? null
  const returnPath = portal?.returnPath ?? null
  const targets = portal?.targets ?? new Map()

  const setMode = useCallback(
    (newMode: string | null) => setModeAction(portalId, newMode),
    [portalId, setModeAction],
  )

  const setReturnPath = useCallback(
    (path: string | null) => setReturnPathAction(portalId, path),
    [portalId, setReturnPathAction],
  )

  const reset = useCallback(
    () => resetPortalAction(portalId),
    [portalId, resetPortalAction],
  )

  const registerTarget = useCallback(
    (targetMode: string, target: HTMLElement) =>
      register(portalId, targetMode, target),
    [portalId, register],
  )

  const unregisterTarget = useCallback(
    (targetMode: string) => unregister(portalId, targetMode),
    [portalId, unregister],
  )

  return {
    mode,
    returnPath,
    targets,
    setMode,
    setReturnPath,
    reset,
    registerTarget,
    unregisterTarget,
  }
}
