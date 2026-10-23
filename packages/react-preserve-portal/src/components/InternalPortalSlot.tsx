import { createElement, useCallback, useRef } from 'react'

import type { SlotProps } from '../core/types'
import { DEFAULT_PORTAL_ID, getPortalStore } from '../model/store'

type InternalPortalSlotProps<T extends keyof HTMLElementTagNameMap> = SlotProps<
  string,
  T
> & { portalId?: string }

export function InternalPortalSlot<
  T extends keyof HTMLElementTagNameMap = 'div',
>({
  portalId = DEFAULT_PORTAL_ID,
  slotKey,
  as: container = 'div' as T,
  ...props
}: InternalPortalSlotProps<T>) {
  const store = getPortalStore(portalId)
  const cleanupRef = useRef<(() => void) | undefined>(undefined)
  // Explicitly return void for compatibility with both React 18 and 19.
  const ref = useCallback(
    (target: HTMLElement | null) => {
      cleanupRef.current?.()
      cleanupRef.current = target
        ? store.registerTarget(slotKey, target)
        : undefined
    },
    [store, slotKey],
  )

  // createElement attaches the callback; it does not invoke it during render.
  // eslint-disable-next-line react-hooks/refs
  return createElement(container, { ...props, ref })
}
