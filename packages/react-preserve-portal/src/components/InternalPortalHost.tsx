import { useLayoutEffect, useState, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'

import type { HostProps } from '../core/types'
import { DEFAULT_PORTAL_ID } from '../model/store'
import { usePortal } from '../model/usePortal'

type InternalPortalHostProps<T extends keyof HTMLElementTagNameMap> =
  HostProps<T> & { portalId?: string }

const subscribe = () => () => {}
const getClientSnapshot = () => true
const getServerSnapshot = () => false

function ClientPortalHost<T extends keyof HTMLElementTagNameMap = 'div'>({
  portalId = DEFAULT_PORTAL_ID,
  node,
  children,
  as: container = 'div' as T,
}: InternalPortalHostProps<T>) {
  const [unmanagedNode] = useState(() => document.createElement(container))
  const { slotKey, targets } = usePortal(portalId)
  const target = slotKey === null ? undefined : targets.get(slotKey)

  useLayoutEffect(() => {
    if (!target) {
      unmanagedNode.remove()
    } else if (unmanagedNode.parentNode !== target) {
      // moveBefore preserves browser-managed state for connected DOM moves.
      // Older browsers still preserve the node and React state via appendChild.
      if (
        'moveBefore' in target &&
        typeof target.moveBefore === 'function' &&
        target.isConnected &&
        unmanagedNode.isConnected &&
        target.ownerDocument === unmanagedNode.ownerDocument
      ) {
        target.moveBefore(unmanagedNode, null)
      } else {
        target.appendChild(unmanagedNode)
      }
    }
  }, [target, unmanagedNode])

  useLayoutEffect(() => () => unmanagedNode.remove(), [unmanagedNode])

  return createPortal(children !== undefined ? children : node, unmanagedNode)
}

export function InternalPortalHost<
  T extends keyof HTMLElementTagNameMap = 'div',
>(props: InternalPortalHostProps<T>) {
  // Omit portal content on the server and on the initial hydration render.
  const isClient = useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot,
  )
  return isClient ? <ClientPortalHost {...props} /> : null
}
