import { useCallback, useMemo } from 'react'

import { InternalPortalHost } from '../components/InternalPortalHost'
import { InternalPortalSlot } from '../components/InternalPortalSlot'
import {
  usePortalStore,
  register,
  unregister,
  setSlotKey as setSlotKeyAction,
  setReturnPath as setReturnPathAction,
  resetPortal as resetPortalAction,
} from '../model/store'

import type {
  CreatePortalOptions,
  HostProps,
  SlotProps,
  TypedPortal,
  UsePortalReturn,
} from './types'

export function createPortal<
  TId extends string,
  TSlots extends readonly string[],
>(
  options: CreatePortalOptions<TId, TSlots>,
): TypedPortal<TId, TSlots[number]> {
  type TSlot = TSlots[number]

  const { id, slots } = options

  function Host<T extends keyof HTMLElementTagNameMap = 'div'>(
    props: HostProps<T>,
  ) {
    return <InternalPortalHost portalId={id} {...props} />
  }

  function Slot<T extends keyof HTMLElementTagNameMap = 'div'>(
    props: SlotProps<TSlot, T>,
  ) {
    return <InternalPortalSlot portalId={id} {...props} />
  }

  const useTypedPortal = (): UsePortalReturn<TSlot> => {
    const portal = usePortalStore((portals) => portals.get(id))

    const slotKey = (portal?.slotKey ?? null) as TSlot | null
    const returnPath = portal?.returnPath ?? null
    const targets = useMemo(
      () => (portal?.targets ?? new Map()) as Map<TSlot, HTMLElement>,
      [portal?.targets],
    )

    const setSlotKey = useCallback(
      (newSlotKey: TSlot | null) => setSlotKeyAction(id, newSlotKey),
      [],
    )

    const setReturnPath = useCallback(
      (path: string | null) => setReturnPathAction(id, path),
      [],
    )

    const reset = useCallback(() => resetPortalAction(id), [])

    const registerTarget = useCallback(
      (targetSlotKey: TSlot, target: HTMLElement) =>
        register(id, targetSlotKey, target),
      [],
    )

    const unregisterTarget = useCallback(
      (targetSlotKey: TSlot) => unregister(id, targetSlotKey),
      [],
    )

    return {
      slotKey,
      returnPath,
      targets,
      setSlotKey,
      setReturnPath,
      reset,
      registerTarget,
      unregisterTarget,
    }
  }

  return {
    id,
    slots,
    Host,
    Slot,
    usePortal: useTypedPortal,
  } as const
}
