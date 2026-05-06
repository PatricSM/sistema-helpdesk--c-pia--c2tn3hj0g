import { SidebarStateProvider } from '@/hooks/use-sidebar-state'
import { useScreenSize } from '@/hooks/use-screen-size'
import { DesktopLayout } from './DesktopLayout'
import { MobileLayout } from './MobileLayout'

export default function Layout() {
  const { isMobileView } = useScreenSize()
  return (
    <SidebarStateProvider>
      {isMobileView ? <MobileLayout /> : <DesktopLayout />}
    </SidebarStateProvider>
  )
}
