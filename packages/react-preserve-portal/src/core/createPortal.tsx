import { InternalPortalHost } from '../components/InternalPortalHost'
import { InternalPortalSlot } from '../components/InternalPortalSlot'
import { usePortal } from '../model/usePortal'

import type {
  CreatePortalOptions,
  HostProps,
  SlotProps,
  TypedPortal,
  UsePortalReturn,
} from './types'

export function createPortal<
  const TId extends string,
  const TSlots extends readonly string[],
>(options: CreatePortalOptions<TId, TSlots>): TypedPortal<TId, TSlots[number]> {
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
    const result = usePortal(id)
    return result as UsePortalReturn<TSlot>
  }

  return {
    id,
    slots,
    Host,
    Slot,
    usePortal: useTypedPortal,
  } as const
}
