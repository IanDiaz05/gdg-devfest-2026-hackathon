import { useState } from 'react'
import { ChevronRight, PiggyBank } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { EstadoSiembra, Recomendacion } from '../types/api'
import { espacios, meses } from '../utils/consulta'
import { useFiltroEspacio } from './FiltrosCultivos'
import { Chip } from './Chip'
import { Aviso, CultivoIcono, Estado, estados } from './Interfaz'

const grupos = Object.keys(estados) as EstadoSiembra[]

export function TarjetaCultivo({ cultivo, busqueda, destacada = false }: {
  cultivo: Recomendacion
  busqueda: string
  destacada?: boolean
}) {
  const ahorro = cultivo.finanzas_sniim
  const posibles = cultivo.meses_posibles.filter((mes) => !cultivo.meses_ideales.includes(mes))
  const nombrar = (lista: number[]) => [...lista].sort((a, b) => a - b).map((mes) => meses[mes - 1].slice(0, 3)).join(', ')

  return <Link
    to={{ pathname: `/cultivo/${encodeURIComponent(cultivo.id)}`, search: busqueda }}
    aria-label={`Ver ficha de ${cultivo.nombre}`}
    className={`group flex h-full gap-2 rounded-2xl border p-3 sm:gap-3 sm:p-4 motion-safe:transition-shadow focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${destacada ? 'border-primary bg-primary text-primary-foreground shadow-hero' : 'border-border bg-card hover:shadow-soft'}`}
  >
    <CultivoIcono icono={cultivo.icono} />
    <div className="min-w-0 flex-1">
      <p className={`text-xs font-semibold uppercase tracking-wider ${destacada ? 'text-primary-foreground/85' : 'text-muted-foreground'}`}>{cultivo.categoria}</p>
      <p className="mt-1 text-lg font-bold">{cultivo.nombre}</p>
      <div className="mt-2"><Estado estado={cultivo.estado} texto={cultivo.etiqueta_clima} /></div>
      <p className="mt-2 text-sm leading-6">{cultivo.razon_corta}</p>
      {ahorro?.destacar_ahorro && <p className="mt-2 rounded-lg bg-success-soft px-2.5 py-2 text-sm text-success">
        <strong className="flex items-center gap-1.5"><PiggyBank size={16} strokeWidth={1.75} aria-hidden="true" /> Ahorro SNIIM</strong>
        {ahorro.mensaje_ahorro}
      </p>}
      <div className="mt-2 text-xs leading-5">
        <p><strong>Meses ideales</strong> · {nombrar(cultivo.meses_ideales) || 'Ninguno'}</p>
        {posibles.length > 0 && <p><strong>Con cuidados</strong> · {nombrar(posibles)}</p>}
      </div>
    </div>
    <ChevronRight className="mt-3 size-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
  </Link>
}

export function CultivosRecomendados({ cultivos, busqueda }: { cultivos: Recomendacion[]; busqueda: string }) {
  const { espacio, setEspacio } = useFiltroEspacio()
  const [categoria, setCategoria] = useState('')
  const categorias = [...new Set(cultivos.map((cultivo) => cultivo.categoria))].sort((a, b) => a.localeCompare(b, 'es-MX'))
  const categoriaActiva = categorias.includes(categoria) ? categoria : ''
  const filtrados = cultivos.filter((cultivo) =>
    (!categoriaActiva || cultivo.categoria === categoriaActiva) &&
    (!espacio || cultivo.filtros_rapidos.espacio_tipo === espacio),
  )
  return <section className="mt-8" aria-labelledby="recomendaciones">
    <h2 id="recomendaciones" className="text-2xl font-bold">Qué sembrar</h2>
    <div className="surface mt-4 grid gap-4 p-3 sm:p-4 lg:grid-cols-2">
      <fieldset>
        <legend className="mb-2 text-sm font-semibold">Espacio</legend>
        <div className="flex flex-wrap gap-2">
          {espacios.map(([valor, etiqueta]) => <Chip key={valor} selected={espacio === valor} onClick={() => setEspacio(valor)}>{etiqueta}</Chip>)}
        </div>
      </fieldset>
      <fieldset>
        <legend className="mb-2 text-sm font-semibold">Categoría</legend>
        <div className="flex flex-wrap gap-2">
          <Chip selected={categoriaActiva === ''} onClick={() => setCategoria('')}>Todas las categorías</Chip>
          {categorias.map((valor) => <Chip key={valor} selected={categoriaActiva === valor} onClick={() => setCategoria(valor)}>{valor}</Chip>)}
        </div>
      </fieldset>
    </div>
    <p role="status" className="sr-only">{filtrados.length} cultivos coinciden con los filtros.</p>
    {filtrados.length === 0 && <Aviso>{cultivos.length ? 'No hay cultivos con estos filtros.' : 'Todavía no hay recomendaciones para esta zona.'}</Aviso>}
    {grupos.map((grupo) => {
      const lista = filtrados.filter((cultivo) => cultivo.estado === grupo)
      if (!lista.length) return null
      const { Icono, titulo, clase } = estados[grupo]
      return <section className="mt-6" key={grupo}>
        <h3 className={`mb-3 flex items-center gap-2 rounded-xl border p-3 font-bold ${clase}`}>
          <Icono size={20} strokeWidth={1.75} aria-hidden="true" /> {titulo}
        </h3>
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {lista.map((cultivo) => <li key={cultivo.id}><TarjetaCultivo cultivo={cultivo} busqueda={busqueda} /></li>)}
        </ul>
      </section>
    })}
  </section>
}
