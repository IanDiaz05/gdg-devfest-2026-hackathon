import { useId } from 'react'
import { useSearchParams } from 'react-router-dom'
import { espacios, guardarEspacio, leerEspacio } from '../utils/consulta'

export const estiloControl = 'min-h-11 rounded-xl border border-border bg-card px-3 text-sm font-medium text-foreground'

export function useFiltroEspacio() {
  const [params, setParams] = useSearchParams()
  const espacio = leerEspacio(params.get('espacio'))
  function setEspacio(nuevo: string) {
    guardarEspacio(nuevo)
    setParams((actual) => {
      const siguiente = new URLSearchParams(actual)
      siguiente.set('espacio', nuevo)
      return siguiente
    }, { replace: true })
  }
  return { espacio, setEspacio }
}

export function FiltroEspacio({ valor, cambiar }: { valor: string; cambiar: (valor: string) => void }) {
  const id = useId()
  return <div className="grid gap-1 text-sm font-semibold">
    <label htmlFor={id}>Espacio</label>
    <select id={id} className={estiloControl} value={valor} onChange={(event) => cambiar(event.target.value)}>
      {espacios.map(([id, nombre]) => <option key={id} value={id}>{nombre}</option>)}
    </select>
  </div>
}
