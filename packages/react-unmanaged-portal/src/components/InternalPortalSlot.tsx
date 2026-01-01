import {
  createElement,
  useLayoutEffect,
  useRef,
  type HTMLAttributes,
} from 'react'

import { DEFAULT_PORTAL_ID } from '../model/store'
import { usePortal } from '../model/usePortal'

interface InternalPortalSlotProps<
  T extends keyof HTMLElementTagNameMap = 'div',
> extends HTMLAttributes<HTMLElementTagNameMap[T]> {
  portalId?: string
  slotKey: string
  as?: T
}

export function InternalPortalSlot<
  T extends keyof HTMLElementTagNameMap = 'div',
>({
  portalId = DEFAULT_PORTAL_ID,
  slotKey,
  as: container = 'div' as T,
  ...props
}: InternalPortalSlotProps<T>) {
  const slotRef = useRef<HTMLElementTagNameMap[T]>(null)
  const { registerTarget, unregisterTarget } = usePortal(portalId)

  useLayoutEffect(() => {
    if (slotRef.current) {
      registerTarget(slotKey, slotRef.current)
    }

    return () => unregisterTarget(slotKey)
  }, [slotKey, registerTarget, unregisterTarget])

  // eslint-disable-next-line react-hooks/refs
  return createElement(container, { ref: slotRef, ...props })
}
