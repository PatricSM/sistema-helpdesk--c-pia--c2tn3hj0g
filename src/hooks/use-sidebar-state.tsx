import { createContext, useContext, useState, ReactNode } from 'react'

interface SidebarState {
  isExpanded: boolean
  toggle: () => void
  setExpanded: (v: boolean) => void
  width: string
}

const SidebarStateContext = createContext<SidebarState | undefined>(undefined)

export function SidebarStateProvider({ children }: { children: ReactNode }) {
  const [isExpanded, setExpanded] = useState(true)
  const width = isExpanded ? '212px' : '48px'
  return (
    <SidebarStateContext.Provider
      value={{ isExpanded, toggle: () => setExpanded((v) => !v), setExpanded, width }}
    >
      {children}
    </SidebarStateContext.Provider>
  )
}

export function useSidebarState() {
  const ctx = useContext(SidebarStateContext)
  if (!ctx) throw new Error('useSidebarState must be used within SidebarStateProvider')
  return ctx
}
