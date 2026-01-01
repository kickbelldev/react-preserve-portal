import {
  createElement,
  useLayoutEffect,
  useRef,
  type HTMLAttributes,
} from 'react'

import { DEFAULT_PORTAL_ID } from '../model/store'
import { usePortal } from '../model/usePortal'

interface PortalSlotProps<
  T extends keyof HTMLElementTagNameMap = 'div',
> extends HTMLAttributes<HTMLElementTagNameMap[T]> {
  portalId?: string
  mode: string
  as?: T
}

export function PortalSlot<T extends keyof HTMLElementTagNameMap = 'div'>({
  portalId = DEFAULT_PORTAL_ID,
  mode,
  as: container = 'div' as T,
  ...props
}: PortalSlotProps<T>) {
  const slotRef = useRef<HTMLElementTagNameMap[T]>(null)
  const { registerTarget, unregisterTarget } = usePortal(portalId)

  useLayoutEffect(() => {
    if (slotRef.current) {
      registerTarget(mode, slotRef.current)
    }

    return () => unregisterTarget(mode)
  }, [mode, registerTarget, unregisterTarget])

  // eslint-disable-next-line react-hooks/refs
  return createElement(container, { ref: slotRef, ...props })
}
