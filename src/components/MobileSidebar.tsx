import { useEffect, useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Menu } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { useSidebarState } from '@/hooks/use-sidebar-state'

export function MobileSidebarTrigger() {
  const [open, setOpen] = useState(false)
  const { setExpanded } = useSidebarState()

  useEffect(() => {
    if (open) setExpanded(true)
  }, [open, setExpanded])

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setOpen(true)}>
        <Menu className="h-5 w-5" />
      </Button>
      <SheetContent side="left" className="p-0 w-[230px]">
        <SheetHeader className="sr-only">
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>
        <Sidebar />
      </SheetContent>
    </Sheet>
  )
}
