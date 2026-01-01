import { useEffect } from 'react'

import { usePortal } from '../hooks/usePortal'
import { DEFAULT_PORTAL_ID } from '../model/store'

import { PortalSlot } from './PortalSlot'

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

  return <PortalSlot portalId={portalId} mode="main" />
}
