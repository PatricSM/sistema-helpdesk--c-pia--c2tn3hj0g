import { Outlet } from 'react-router-dom'
import { MobileSidebarTrigger } from './MobileSidebar'

export function MobileLayout() {
  return (
    <div className="flex flex-col h-screen w-screen">
      <header className="flex h-14 items-center gap-3 border-b px-3">
        <MobileSidebarTrigger />
        <div id="app-header" className="flex-1 min-w-0" />
      </header>
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
