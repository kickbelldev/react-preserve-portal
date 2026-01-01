import { createPortal } from '@charley-kim/react-unmanaged-portal'

export const VideoPortal = createPortal({
  id: 'video',
  slots: ['main', 'mini'],
} as const)
