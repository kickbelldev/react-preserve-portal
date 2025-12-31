import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'

import { getTarget } from '../model/target'

interface PortalHostProps {
  children: ReactNode
}

export function PortalHost({ children }: PortalHostProps) {
  return createPortal(children, getTarget())
}
