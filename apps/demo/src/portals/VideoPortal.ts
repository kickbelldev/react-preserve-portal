import { createPortal } from '@charley-kim/react-preserve-portal'

export const VideoPortal = createPortal({
  id: 'video',
  slots: ['main', 'mini'],
} as const)
