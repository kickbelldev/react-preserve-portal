import type { HTMLAttributes, ReactNode } from 'react'

/**
 * createPortal 옵션
 */
export interface CreatePortalOptions<
  TId extends string,
  TSlots extends readonly string[],
> {
  id: TId
  slots: TSlots
}

/**
 * Host 컴포넌트 props
 */
export interface HostProps<T extends keyof HTMLElementTagNameMap = 'div'> {
  node: ReactNode
  as?: T
}

/**
 * Slot 컴포넌트 props
 */
export interface SlotProps<
  TSlot extends string,
  T extends keyof HTMLElementTagNameMap = 'div',
> extends HTMLAttributes<HTMLElementTagNameMap[T]> {
  slotKey: TSlot
  as?: T
}

/**
 * usePortal 훅 반환 타입
 */
export interface UsePortalReturn<TSlot extends string> {
  slotKey: TSlot | null
  setSlotKey: (key: TSlot | null) => void
  returnPath: string | null
  setReturnPath: (path: string | null) => void
  targets: Map<TSlot, HTMLElement>
  reset: () => void
  registerTarget: (slotKey: TSlot, target: HTMLElement) => void
  unregisterTarget: (slotKey: TSlot) => void
}

/**
 * createPortal 반환 타입
 */
export interface TypedPortal<TId extends string, TSlot extends string> {
  readonly id: TId
  readonly slots: readonly TSlot[]
  Host: <T extends keyof HTMLElementTagNameMap = 'div'>(
    props: HostProps<T>,
  ) => ReactNode
  Slot: <T extends keyof HTMLElementTagNameMap = 'div'>(
    props: SlotProps<TSlot, T>,
  ) => ReactNode
  usePortal: () => UsePortalReturn<TSlot>
}
