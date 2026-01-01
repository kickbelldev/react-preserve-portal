// Re-export from library
export {
  PortalHost,
  PortalSlot,
  usePortal,
  usePortalStore,
  DEFAULT_PORTAL_ID,
} from '@kayce/react-unmanaged-portal'
export type { PortalInstance } from '@kayce/react-unmanaged-portal'

// Demo-specific components
export { MainPortal } from './components/MainPortal'
export { MiniPortal } from './components/MiniPortal'
export { MiniPortalContainer } from './components/MiniPortalContainer'
