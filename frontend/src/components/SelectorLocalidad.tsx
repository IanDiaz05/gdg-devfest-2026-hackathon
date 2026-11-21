import { useId } from 'react'
import type { Alternativa } from '../types/api'
import { estiloControl } from './FiltrosCultivos'

export function SelectorLocalidad({ alternativas, elegir }: { alternativas: Alternativa[]; elegir: (lugar: Alternativa) => void }) {
  const id = useId()
  if (!alternativas.length) return null

  return <div className="mb-5 grid gap-2 text-sm font-semibold text-muted-foreground sm:max-w-sm">
    <label htmlFor={id}>¿Buscabas otra localidad?</label>
    <select id={id} className={`${estiloControl} min-w-0 w-full`} value="" onChange={(event) => {
      if (event.target.value) elegir(alternativas[Number(event.target.value)])
    }}>
      <option value="">Elige una localidad</option>
      {alternativas.map((lugar, indice) => <option key={`${lugar.lat},${lugar.lon}`} value={indice}>{lugar.nombre}, {lugar.estado}</option>)}
    </select>
  </div>
}
