import { useEffect, useState } from 'react'

export function useScrolled() {
  const [scrolled, setScrolled] = useState(() => window.scrollY > 8)

  useEffect(() => {
    const actualizar = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', actualizar, { passive: true })
    actualizar()
    return () => window.removeEventListener('scroll', actualizar)
  }, [])

  return scrolled
}
