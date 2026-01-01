import { useEffect } from 'react'

import { VideoPortal } from '@/portals/VideoPortal'

interface MainPortalProps {
  pathname: string
}

export function MainPortal({ pathname }: MainPortalProps) {
  const { setReturnPath, setSlotKey } = VideoPortal.usePortal()

  useEffect(() => {
    setReturnPath(pathname)
    setSlotKey('main')

    return () => setSlotKey('mini')
  }, [pathname, setSlotKey, setReturnPath])

  return <VideoPortal.Slot slotKey="main" className="contents" />
}
