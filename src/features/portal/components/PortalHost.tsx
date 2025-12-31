import { isValidElement, useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

import { usePortalStore } from '../model/store'

interface PortalHostProps {
  children: ReactNode
}

export function PortalHost({ children }: PortalHostProps) {
  const container = usePortalStore((s) => s.container)
  const register = usePortalStore((s) => s.register)
  const unregister = usePortalStore((s) => s.unregister)

  useEffect(() => {
    if (isValidElement(children)) {
      register(children)
    }
    return () => {
      unregister()
    }
  }, [children, register, unregister])

  return createPortal(children, container)
}
