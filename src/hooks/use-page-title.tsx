import { createContext, useContext, useState, ReactNode } from 'react'

interface PageTitleState {
  title: ReactNode
  setTitle: (t: ReactNode) => void
}

const PageTitleContext = createContext<PageTitleState | undefined>(undefined)

export function PageTitleProvider({ children }: { children: ReactNode }) {
  const [title, setTitle] = useState<ReactNode>(null)
  return (
    <PageTitleContext.Provider value={{ title, setTitle }}>{children}</PageTitleContext.Provider>
  )
}

export function usePageTitle(t?: ReactNode) {
  const ctx = useContext(PageTitleContext)
  if (!ctx) throw new Error('usePageTitle must be used within PageTitleProvider')
  // Optional setter via argument
  if (t !== undefined) ctx.setTitle(t)
  return ctx
}
