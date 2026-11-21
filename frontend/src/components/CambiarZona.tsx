import { ArrowRight } from 'lucide-react'
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { BuscadorCiudad } from './BuscadorCiudad'

/**
 * Cambia la ciudad sin salir de la página: reemplaza `q` (o `lat`/`lon`) en la URL y conserva el
 * resto (mes, espacio). La página vuelve a pedir sus datos a la API con la nueva ciudad; no se toca
 * nada del backend ni de la base de datos.
 */
export function CambiarZona({ id, actual }: { id: string; actual?: string }) {
  const [params, setParams] = useSearchParams()
  const [ciudad, setCiudad] = useState('')

  function cambiar(q: string) {
    const texto = q.trim()
    if (!texto) return
    const nuevos = new URLSearchParams(params)
    nuevos.delete('lat')
    nuevos.delete('lon')
    nuevos.set('q', texto)
    setParams(nuevos)
    setCiudad('')
  }

  return <form role="search" aria-label="Cambiar zona" className="grid gap-1"
    onSubmit={(evento) => { evento.preventDefault(); cambiar(ciudad) }}>
    <label htmlFor={id} className="text-sm font-semibold">
      {actual ? <>Zona: <span className="text-primary">{actual}</span></> : 'Elige tu zona'}
    </label>
    <div className="flex items-start gap-2">
      <div className="min-w-0 flex-1 [&>div]:mt-0">
        <BuscadorCiudad id={id} valor={ciudad} onCambio={setCiudad} onElegir={cambiar}
          placeholder={actual ? 'Cambiar a otra ciudad…' : 'Ciudad o municipio'} />
      </div>
      <button type="submit" disabled={!ciudad.trim()} aria-label="Cambiar zona"
        className="grid min-h-12 shrink-0 place-items-center rounded-xl bg-primary px-4 text-primary-foreground hover:bg-primary-hover disabled:opacity-50 motion-safe:transition-colors">
        <ArrowRight size={18} strokeWidth={1.75} aria-hidden="true" />
      </button>
    </div>
  </form>
}
