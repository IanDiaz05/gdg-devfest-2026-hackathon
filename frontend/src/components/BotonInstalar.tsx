import { Download } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { esIos, instalar, useInstalacion } from '../pwa/instalacion'

/**
 * Ícono de "Instalar QUESIEMBRO" en la barra de navegación. Si el navegador ofrece el diálogo de
 * instalación lo abre; si no (Safari en iPhone), muestra un globito con las instrucciones.
 */
export function BotonInstalar({ className = '' }: { className?: string }) {
  const { disponible } = useInstalacion()
  const [instrucciones, setInstrucciones] = useState(false)
  const contenedor = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!instrucciones) return
    const fuera = (evento: PointerEvent) => {
      if (!contenedor.current?.contains(evento.target as Node)) setInstrucciones(false)
    }
    const escape = (evento: KeyboardEvent) => { if (evento.key === 'Escape') setInstrucciones(false) }
    document.addEventListener('pointerdown', fuera)
    document.addEventListener('keydown', escape)
    return () => {
      document.removeEventListener('pointerdown', fuera)
      document.removeEventListener('keydown', escape)
    }
  }, [instrucciones])

  if (!disponible) return null

  return <div ref={contenedor} className="relative">
    <button type="button" aria-label="Instalar QUESIEMBRO" title="Instalar QUESIEMBRO"
      aria-expanded={esIos ? instrucciones : undefined} aria-controls={esIos ? 'instrucciones-instalar' : undefined}
      onClick={async () => { if (!(await instalar())) setInstrucciones((visible) => !visible) }}
      className={`grid size-11 place-items-center rounded-xl border border-border bg-card text-primary hover:bg-secondary ${className}`}>
      <Download size={19} strokeWidth={1.75} aria-hidden="true" />
    </button>
    {instrucciones && <p id="instrucciones-instalar" role="status"
      className="absolute top-full right-0 z-50 mt-2 w-60 rounded-xl border border-border bg-card p-3 text-sm leading-5 text-foreground shadow-raised">
      {esIos ? 'En Safari, toca Compartir y elige “Agregar a inicio”.' : 'Abre el menú del navegador y elige “Instalar aplicación”.'}
    </p>}
  </div>
}
