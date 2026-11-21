import type { Alternativa } from '../types/api'
import { estiloControl } from './FiltrosCultivos'

export function SelectorLocalidad({ alternativas, elegir }: { alternativas: Alternativa[]; elegir: (lugar: Alternativa) => void }) {
  if (!alternativas.length) return null
  return <label className="mb-5 flex flex-wrap items-center gap-2 text-sm font-semibold text-muted-foreground">
    ¿Buscabas otra localidad?
    <select className={estiloControl} value="" onChange={(event) => {
      if (event.target.value) elegir(alternativas[Number(event.target.value)])
    }}>
      <option value="">Elige una localidad</option>
      {alternativas.map((lugar, indice) => <option key={`${lugar.lat},${lugar.lon}`} value={indice}>{lugar.nombre}, {lugar.estado}</option>)}
    </select>
  </label>
}
