import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'
import { createPortal } from 'react-dom'

import type { HostProps } from '../core/types'
import { DEFAULT_PORTAL_ID, getPortalStore } from '../model/store'
import { usePortal } from '../model/usePortal'
import { animateMove, measureMoveStart, type MoveStart } from '../model/animate'
import { useCommittedEffect } from '../model/useCommittedEffect'
import { warnOnce } from '../model/warn'

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
  animate = false,
}: InternalPortalHostProps<T>) {
  const [unmanagedNode] = useState(() => document.createElement(container))
  const [hasMounted, setHasMounted] = useState(mountWhen === 'immediate')
  const { slotKey, targets } = usePortal(portalId)
  const target = slotKey === null ? undefined : targets.get(slotKey)
  const store = getPortalStore(portalId)

  // Passive, so Hosts hidden by Activity do not count as duplicates.
  useEffect(() => store.retainHost(), [store])

  // Measure only when animating: record where the container is on screen
  // just before a slot change, then animate from there after the move.
  const moveStart = useRef<MoveStart>(null)
  const running = useRef<Animation | null>(null)
  const animated = animate !== false
  useEffect(() => {
    if (!animated) return
    return store.onBeforeSlotChange(() => {
      moveStart.current = measureMoveStart(unmanagedNode)
    })
  }, [store, animated, unmanagedNode])

  useEffect(() => {
    if (
      process.env.NODE_ENV !== 'production' &&
      unmanagedNode.localName !== container
    ) {
      warnOnce(
        `Host "as" changed from "${unmanagedNode.localName}" to "${container}" ` +
          'after mount. The container tag is fixed; remount Host with a new key ' +
          'to change it.',
      )
    }
  }, [container, unmanagedNode])

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
    const start = moveStart.current
    moveStart.current = null
    if (animate === false) {
      running.current?.cancel()
      running.current = null
    }
    if (!target) {
      running.current?.cancel()
      running.current = null
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
        try {
          target.moveBefore(unmanagedNode, null)
        } catch {
          // moveBefore can still throw for states the checks above miss (it is
          // new and implementations differ); reinsertion preserves DOM and state.
          target.appendChild(unmanagedNode)
        }
      } else {
        target.appendChild(unmanagedNode)
      }
      if (animate !== false) {
        // Cancel first so the end box is measured without the old transform.
        running.current?.cancel()
        running.current = animateMove(unmanagedNode, start, animate)
      }
    }
  }, [target, unmanagedNode, animate])

  useLayoutEffect(() => {
    if (hasMounted) return
    if (mountWhen === 'immediate' || unmanagedNode.isConnected) {
      // One extra commit intentionally mounts content after its container attaches.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHasMounted(true)
      return
    }
    // Without a target the container cannot connect; this effect reruns when
    // one registers. Observe only for targets in a detached tree (detached
    // React roots / manual targets attached later). No observer after mounting.
    if (!target) return
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
  useCommittedEffect(
    () => () => {
      running.current?.cancel()
      running.current = null
      unmanagedNode.remove()
    },
    [unmanagedNode],
  )

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
