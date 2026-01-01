import { PortalHost } from './components/PortalHost'
import { PortalSlot } from './components/PortalSlot'

export const Portal = {
  Host: PortalHost,
  Slot: PortalSlot,
} as const

export { DEFAULT_PORTAL_ID } from './model/store'
export { usePortal } from './model/usePortal'
