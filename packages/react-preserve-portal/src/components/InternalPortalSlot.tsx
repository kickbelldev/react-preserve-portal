import {
  createElement,
  useCallback,
  useLayoutEffect,
  useRef,
  type Ref,
} from 'react'

import type { SlotProps } from '../core/types'
import { DEFAULT_PORTAL_ID, getPortalStore } from '../model/store'
import { useCommittedEffect } from '../model/useCommittedEffect'

type InternalPortalSlotProps<T extends keyof HTMLElementTagNameMap> = Omit<
  SlotProps<string, T>,
  'ref'
> & { portalId?: string; userRef?: Ref<HTMLElementTagNameMap[T]> }

function assignRef<E>(ref: Ref<E> | undefined, value: E | null) {
  if (typeof ref === 'function') ref(value)
  else if (ref) (ref as { current: E | null }).current = value
}

export function InternalPortalSlot<
  T extends keyof HTMLElementTagNameMap = 'div',
>({
  portalId = DEFAULT_PORTAL_ID,
  slotKey,
  as: container = 'div' as T,
  children,
  dangerouslySetInnerHTML,
  userRef,
  ...props
}: InternalPortalSlotProps<T>) {
  const store = getPortalStore(portalId)
  useCommittedEffect(store.retain, [store])
  const cleanupRef = useRef<(() => void) | undefined>(undefined)
  const nodeRef = useRef<HTMLElement | null>(null)
  // Explicitly return void for compatibility with both React 18 and 19.
  const ref = useCallback(
    (target: HTMLElement | null) => {
      nodeRef.current = target
      cleanupRef.current?.()
      cleanupRef.current = target
        ? store.registerTarget(slotKey, target)
        : undefined
    },
    [store, slotKey],
  )

  // Forward the element to the caller's ref separately so an inline ref
  // function does not re-register the destination on every render.
  useLayoutEffect(() => {
    if (!userRef) return
    assignRef(userRef, nodeRef.current as HTMLElementTagNameMap[T] | null)
    return () => assignRef(userRef, null)
  }, [userRef, container])

  if (children !== undefined || dangerouslySetInnerHTML !== undefined) {
    throw new Error(
      'Portal.Slot must be empty. Render content in Host and placeholders beside Slot.',
    )
  }

  // createElement attaches the callback; it does not invoke it during render.
  // eslint-disable-next-line react-hooks/refs
  return createElement(container, { ...props, ref })
}
