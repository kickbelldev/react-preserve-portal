import { useEffect } from 'react'

import {
  DEFAULT_PORTAL_ID,
  PortalSlot,
  usePortal,
} from '@kayce/react-unmanaged-portal'

interface MainPortalProps {
  portalId?: string
  pathname: string
}

export function MainPortal({
  portalId = DEFAULT_PORTAL_ID,
  pathname,
}: MainPortalProps) {
  const { setReturnPath, setMode } = usePortal(portalId)

  useEffect(() => {
    setReturnPath(pathname)
    setMode('main')

    return () => setMode('mini')
  }, [pathname, setMode, setReturnPath])

  return <PortalSlot portalId={portalId} mode="main" className="contents" />
}
