import { Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'
import { aplicarTema, temaActual, temaElegido } from '../utils/tema'
import type { Tema } from '../utils/tema'

/** Cambia entre modo claro y oscuro. Mientras no se elija, sigue al sistema y a sus cambios. */
export function BotonTema({ className = '' }: { className?: string }) {
  const [tema, setTema] = useState<Tema>(temaActual)

  useEffect(() => {
    if (typeof matchMedia !== 'function') return
    const sistema = matchMedia('(prefers-color-scheme: dark)')
    const alCambiar = () => {
      if (temaElegido()) return
      const nuevo: Tema = sistema.matches ? 'oscuro' : 'claro'
      aplicarTema(nuevo)
      setTema(nuevo)
    }
    sistema.addEventListener('change', alCambiar)
    return () => sistema.removeEventListener('change', alCambiar)
  }, [])

  function cambiar() {
    const nuevo: Tema = tema === 'oscuro' ? 'claro' : 'oscuro'
    aplicarTema(nuevo, true)
    setTema(nuevo)
  }

  const oscuro = tema === 'oscuro'
  return <button type="button" onClick={cambiar} aria-pressed={oscuro} title={oscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
    aria-label="Modo oscuro"
    className={`grid size-11 place-items-center rounded-xl border border-border bg-card text-primary hover:bg-secondary ${className}`}>
    {oscuro ? <Sun size={19} strokeWidth={1.75} aria-hidden="true" /> : <Moon size={19} strokeWidth={1.75} aria-hidden="true" />}
  </button>
}
