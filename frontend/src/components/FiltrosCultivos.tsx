import { useSearchParams } from 'react-router-dom'
import { espacios } from '../utils/consulta'

export const estiloControl = 'min-h-11 rounded-xl border border-border bg-white px-3 text-sm font-medium text-foreground'

export function useFiltroEspacio() {
  const [params, setParams] = useSearchParams()
  const valor = params.get('espacio') ?? sessionStorage.getItem('quesiembro-espacio') ?? ''
  const espacio = espacios.some(([id]) => id === valor) ? valor : ''
  function setEspacio(nuevo: string) {
    sessionStorage.setItem('quesiembro-espacio', nuevo)
    setParams((actual) => {
      const siguiente = new URLSearchParams(actual)
      siguiente.set('espacio', nuevo)
      return siguiente
    }, { replace: true })
  }
  return { espacio, setEspacio }
}

export function FiltroEspacio({ valor, cambiar }: { valor: string; cambiar: (valor: string) => void }) {
  return <label className="grid gap-1 text-sm font-semibold">
    Espacio
    <select className={estiloControl} value={valor} onChange={(event) => cambiar(event.target.value)}>
      {espacios.map(([id, nombre]) => <option key={id} value={id}>{nombre}</option>)}
    </select>
  </label>
}
