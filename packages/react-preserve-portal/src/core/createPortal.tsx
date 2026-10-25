import { forwardRef, type Ref } from 'react'

import { InternalPortalHost } from '../components/InternalPortalHost'
import { InternalPortalSlot } from '../components/InternalPortalSlot'
import { usePortal } from '../model/usePortal'
import { declareSlots, disposePortal } from '../model/store'

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
  if (process.env.NODE_ENV !== 'production') declareSlots(id, slots)

  function Host<T extends keyof HTMLElementTagNameMap = 'div'>(
    props: HostProps<T>,
  ) {
    return <InternalPortalHost portalId={id} {...props} />
  }

  // forwardRef keeps `ref` working on React 18, where it is not a prop.
  const Slot = forwardRef(function Slot(
    props: Omit<SlotProps<TSlot>, 'ref'>,
    ref: Ref<HTMLDivElement>,
  ) {
    return <InternalPortalSlot portalId={id} {...props} userRef={ref} />
  }) as unknown as TypedPortal<TId, TSlot>['Slot']

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
    dispose: () => disposePortal(id),
  } as const
}
