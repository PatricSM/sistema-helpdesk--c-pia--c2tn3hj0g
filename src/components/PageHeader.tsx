import { ReactNode, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

/**
 * Renderiza children dentro de #app-header (slot do AppHeader).
 * Equivale ao <Teleport to="#app-header"> do Frappe.
 */
export function PageHeader({ children }: { children: ReactNode }) {
  const [target, setTarget] = useState<HTMLElement | null>(null)

  useEffect(() => {
    setTarget(document.getElementById('app-header'))
  }, [])

  if (!target) return null
  return createPortal(<>{children}</>, target)
}
