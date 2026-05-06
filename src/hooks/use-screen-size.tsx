import { useEffect, useState } from 'react'

const MOBILE_BREAKPOINT = 768

export function useScreenSize() {
  const [isMobileView, setIsMobileView] = useState(
    typeof window !== 'undefined' ? window.innerWidth < MOBILE_BREAKPOINT : false,
  )

  useEffect(() => {
    const onResize = () => setIsMobileView(window.innerWidth < MOBILE_BREAKPOINT)
    window.addEventListener('resize', onResize)
    onResize()
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return { isMobileView }
}
