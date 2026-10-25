import type { HTMLAttributes, ReactElement, ReactNode, Ref } from 'react'

/**
 * Define a portal once, outside React render. IDs share state within a module.
 */
export interface CreatePortalOptions<
  TId extends string,
  TSlots extends readonly string[],
> {
  id: TId
  slots: TSlots
}

/** Options for animating a Host's container between slots. */
export interface PortalAnimation {
  /** Milliseconds. Default 450 (half that to fade in from hidden). */
  duration?: number
  /** Any CSS easing. Default: a slight-overshoot cubic-bezier. */
  easing?: string
}

/**
 * Keep Host mounted to preserve its children. Use children or the legacy node prop.
 */
export type HostProps<T extends keyof HTMLElementTagNameMap = 'div'> = {
  as?: T
  /** Delay the first content mount until the container is connected. */
  mountWhen?: 'immediate' | 'connected'
  /**
   * Animate the container from its old box when `setSlotKey` moves it.
   * Uses transform/opacity only and respects reduced motion. Default false.
   */
  animate?: boolean | PortalAnimation
} & (
  | { children: ReactNode; node?: never }
  | { node: ReactNode; children?: never }
)

/**
 * A DOM destination for portal content.
 */
export interface SlotProps<
  TSlot extends string,
  T extends keyof HTMLElementTagNameMap = 'div',
> extends Omit<
  HTMLAttributes<HTMLElementTagNameMap[T]>,
  'children' | 'dangerouslySetInnerHTML'
> {
  slotKey: TSlot
  as?: T
  /** Receives the destination element, e.g. for measurement. */
  ref?: Ref<HTMLElementTagNameMap[T]>
  children?: never
  dangerouslySetInnerHTML?: never
}

/**
 * Portal state and stable actions. Treat targets as a read-only snapshot.
 */
export interface UsePortalReturn<TSlot extends string> {
  slotKey: TSlot | null
  setSlotKey: (key: TSlot | null) => void
  returnPath: string | null
  setReturnPath: (path: string | null) => void
  targets: ReadonlyMap<TSlot, HTMLElement>
  /** Hide content and clear returnPath without unregistering mounted Slots. */
  reset: () => void
  /** Register a manual destination; returns an ownership-safe cleanup function. */
  registerTarget: (slotKey: TSlot, target: HTMLElement) => () => void
  unregisterTarget: (slotKey: TSlot) => void
}

/**
 * Typed components and hook bound to one portal ID.
 */
export interface TypedPortal<TId extends string, TSlot extends string> {
  readonly id: TId
  readonly slots: readonly TSlot[]
  Host: <T extends keyof HTMLElementTagNameMap = 'div'>(
    props: HostProps<T>,
  ) => ReactElement | null
  Slot: <T extends keyof HTMLElementTagNameMap = 'div'>(
    props: SlotProps<TSlot, T>,
  ) => ReactElement | null
  usePortal: () => UsePortalReturn<TSlot>
  /** Release an unused ID. Returns false while components or targets own it. */
  dispose: () => boolean
}
