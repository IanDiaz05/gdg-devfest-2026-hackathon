import { useId, useRef } from 'react'
import { Apple, Carrot, Container, Flame, Flower2, LayoutGrid, Leaf, RotateCcw, Salad, Tags, Trees } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Recomendacion } from '../types/api'
import { espacios, normalizar } from '../utils/consulta'
import { FilterChip } from './FilterChip'

const iconosEspacio = { '': LayoutGrid, maceta_chica: Flower2, maceta_grande: Container, patio: Trees }
const iconosCategoria: Record<string, LucideIcon> = {
  frutos: Apple,
  hierbas: Leaf,
  hortalizas: Salad,
  'hortalizas de hoja': Salad,
  'quelites y mexicanos': Flame,
  'raices y bulbos': Carrot,
}

type Opcion = { valor: string; etiqueta: string; Icono: LucideIcon; cantidad: number }

function GrupoFiltros({ titulo, icono: Icono, opciones, seleccionado, elegir }: {
  titulo: string
  icono: LucideIcon
  opciones: Opcion[]
  seleccionado: string
  elegir: (valor: string) => void
}) {
  const id = useId()
  return <fieldset className="min-w-0">
    <legend className="mb-1 flex items-center gap-2 text-xs font-bold tracking-wide text-primary/85 uppercase">
      <Icono size={16} strokeWidth={1.75} aria-hidden="true" /> {titulo}
    </legend>
    <div className="-mx-1 flex snap-x scroll-px-1 gap-2 overflow-x-auto p-1 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:flex-wrap lg:overflow-visible">
      {opciones.map(({ valor, etiqueta, Icono, cantidad }) => <FilterChip key={valor}
        name={id} label={etiqueta} icon={Icono} count={cantidad}
        selected={seleccionado === valor} onClick={() => elegir(valor)} />)}
    </div>
  </fieldset>
}

export function FiltrosRecomendaciones({ cultivos, categorias, espacio, categoria, setEspacio, setCategoria, total }: {
  cultivos: Recomendacion[]
  categorias: string[]
  espacio: string
  categoria: string
  setEspacio: (valor: string) => void
  setCategoria: (valor: string) => void
  total: number
}) {
  const panel = useRef<HTMLDivElement>(null)
  const porEspacio = new Map<string, number>()
  const porCategoria = new Map<string, number>()
  let todosLosEspacios = 0
  let todasLasCategorias = 0

  for (const cultivo of cultivos) {
    const tipo = cultivo.filtros_rapidos.espacio_tipo
    if (!categoria || cultivo.categoria === categoria) {
      todosLosEspacios += 1
      porEspacio.set(tipo, (porEspacio.get(tipo) ?? 0) + 1)
    }
    if (!espacio || tipo === espacio) {
      todasLasCategorias += 1
      porCategoria.set(cultivo.categoria, (porCategoria.get(cultivo.categoria) ?? 0) + 1)
    }
  }

  const opcionesEspacio = espacios.map(([valor, etiqueta]) => ({
    valor, etiqueta, Icono: iconosEspacio[valor], cantidad: valor ? porEspacio.get(valor) ?? 0 : todosLosEspacios,
  }))
  const opcionesCategoria = [
    { valor: '', etiqueta: 'Todas las categorías', Icono: Tags, cantidad: todasLasCategorias },
    ...categorias.map((valor) => ({
      valor, etiqueta: valor, Icono: iconosCategoria[normalizar(valor)] ?? Leaf, cantidad: porCategoria.get(valor) ?? 0,
    })),
  ]

  return <div ref={panel} className="mt-4 min-w-0 rounded-3xl border border-primary/10 bg-card/70 p-5 shadow-sm backdrop-blur lg:p-6">
    <div className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,5fr)] lg:gap-6">
      <GrupoFiltros titulo="Espacio" icono={Container} opciones={opcionesEspacio} seleccionado={espacio} elegir={setEspacio} />
      <GrupoFiltros titulo="Categoría" icono={Tags} opciones={opcionesCategoria} seleccionado={categoria} elegir={setCategoria} />
    </div>
    <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4 border-t border-primary/10 pt-2">
      <p role="status" aria-live="polite" className="py-2 text-sm font-medium text-muted-foreground">
        Mostrando {total} {total === 1 ? 'cultivo' : 'cultivos'}
      </p>
      {(espacio || categoria) && <button type="button" onClick={() => {
        setEspacio('')
        setCategoria('')
        panel.current?.querySelector('input')?.focus()
      }} className="inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-sm font-semibold text-primary hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 motion-safe:transition motion-safe:duration-200 motion-reduce:transition-none">
        <RotateCcw size={15} strokeWidth={1.75} aria-hidden="true" /> Limpiar filtros
      </button>}
    </div>
  </div>
}
