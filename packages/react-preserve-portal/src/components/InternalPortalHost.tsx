import { useLayoutEffect, useState, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'

import type { HostProps } from '../core/types'
import { DEFAULT_PORTAL_ID } from '../model/store'
import { usePortal } from '../model/usePortal'
import { useCommittedEffect } from '../model/useCommittedEffect'

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
  mountWhen = 'immediate',
}: InternalPortalHostProps<T>) {
  const [unmanagedNode] = useState(() => document.createElement(container))
  const [hasMounted, setHasMounted] = useState(mountWhen === 'immediate')
  const { slotKey, targets } = usePortal(portalId)
  const target = slotKey === null ? undefined : targets.get(slotKey)

  useLayoutEffect(() => {
    if (target && target.ownerDocument !== unmanagedNode.ownerDocument) {
      throw new Error(
        'Portal destinations must belong to the same document as Host.',
      )
    }
    if (target && unmanagedNode.contains(target)) {
      throw new Error(
        'A portal cannot move into its own container or descendants.',
      )
    }
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

  useLayoutEffect(() => {
    if (hasMounted) return
    if (mountWhen === 'immediate' || unmanagedNode.isConnected) {
      // One extra commit intentionally mounts content after its container attaches.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHasMounted(true)
      return
    }
    // Only observe while waiting for the first connection (including detached
    // React roots / manual targets attached later). No observer after mounting.
    const observer = new MutationObserver(() => {
      if (unmanagedNode.isConnected) {
        observer.disconnect()
        setHasMounted(true)
      }
    })
    observer.observe(unmanagedNode.ownerDocument, {
      childList: true,
      subtree: true,
    })
    return () => observer.disconnect()
  }, [hasMounted, mountWhen, unmanagedNode, target])

  // Layout-effect cleanup also runs when Suspense/Activity hides a Host.
  // Track final deletion across React 18 Suspense and React 19 Activity.
  useCommittedEffect(() => () => unmanagedNode.remove(), [unmanagedNode])

  return hasMounted
    ? createPortal(children !== undefined ? children : node, unmanagedNode)
    : null
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
