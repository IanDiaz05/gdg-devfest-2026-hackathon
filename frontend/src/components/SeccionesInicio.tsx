import { CalendarDays, Clock3, CloudSun, Container, Leaf, MapPin, Sprout, UserRoundCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Recomendacion } from '../types/api'
import { espacios } from '../utils/consulta'

export const cultivosEjemplo = [
  { id: 'jitomate', nombre: 'Jitomate', icono: '🍅', detalle: 'Hortaliza de fruto' },
  { id: 'cilantro', nombre: 'Cilantro', icono: '🌿', detalle: 'Hierba aromática' },
  { id: 'albahaca', nombre: 'Albahaca', icono: '🌱', detalle: 'Hierba aromática' },
  { id: 'lechuga', nombre: 'Lechuga', icono: '🥬', detalle: 'Hortaliza de hoja' },
]

const pasos = [
  { Icono: MapPin, titulo: 'Elige tu zona', detalle: 'Escribe tu municipio o usa tu ubicación.' },
  { Icono: Container, titulo: 'Dinos tu espacio', detalle: 'Selecciona el tamaño de tu maceta o tu patio.' },
  { Icono: CalendarDays, titulo: 'Recibe tu calendario', detalle: 'Consulta qué sembrar y en qué meses hacerlo.' },
]

const beneficios = [
  { Icono: CloudSun, texto: 'Datos climáticos de tu localidad' },
  { Icono: UserRoundCheck, texto: 'Sin cuenta ni registro' },
  { Icono: Sprout, texto: 'Para macetas y patios' },
]

const dificultad = { facil: 'Fácil', media: 'Intermedia', dificil: 'Avanzada' }

export function SeccionesInicio({ cultivos, busqueda, ejemplo }: { cultivos?: Recomendacion[]; busqueda: string; ejemplo: boolean }) {
  const optimos = cultivos?.filter(({ estado }) => estado === 'optimo').slice(0, 4)
  const tarjetas = optimos?.length ? optimos.map((cultivo) => ({
    id: cultivo.id, nombre: cultivo.nombre, icono: cultivo.icono, detalle: cultivo.categoria,
    ficha: cultivo.filtros_rapidos,
  })) : cultivosEjemplo.map((cultivo) => ({ ...cultivo, ficha: undefined }))

  return <>
    <section className="w-full border-y border-border bg-card" aria-labelledby="como-funciona">
      <div className="app-frame py-10 sm:py-14">
        <h2 id="como-funciona" className="font-display text-3xl font-semibold tracking-tight text-primary sm:text-4xl">Cómo funciona</h2>
        <ol className="mt-5 grid gap-3 md:grid-cols-3 md:gap-5">
          {pasos.map(({ Icono, titulo, detalle }) => <li className="flex items-start gap-3 rounded-2xl bg-secondary/55 p-4 lg:gap-4 lg:p-5" key={titulo}>
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-card text-primary"><Icono size={22} strokeWidth={1.75} aria-hidden="true" /></span>
            <div><h3 className="font-bold text-primary">{titulo}</h3><p className="mt-1 text-sm leading-6 text-muted-foreground">{detalle}</p></div>
          </li>)}
        </ol>
      </div>
    </section>
    <section className="w-full bg-cream" aria-labelledby="cultivos-del-mes">
      <div className="app-frame py-10 sm:py-14">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="cultivos-del-mes" className="font-display text-3xl font-semibold tracking-tight text-primary sm:text-4xl">Qué sembrar este mes</h2>
            <p className="mt-2 max-w-prose text-sm leading-6 text-muted-foreground">
              {optimos?.length ? 'Cultivos con condiciones ideales para el mes consultado.' :
                cultivos ? 'La consulta no tiene cultivos en condiciones ideales. Estas fichas son ideas para explorar.' :
                'Explora el catálogo y elige tu zona para ver qué cultivos se adaptan al clima local.'}
            </p>
          </div>
          {cultivos ? <Link to={{ pathname: '/recomendaciones', search: busqueda }} className="app-button">Ver recomendaciones</Link> :
            <a href="#ubicacion" className="app-button">Consultar mi zona</a>}
        </div>
        <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {tarjetas.map(({ id, nombre, icono, detalle, ficha }) => <li key={id}
            className="surface grid content-start overflow-hidden shadow-soft motion-safe:transition motion-safe:duration-200 motion-safe:hover:-translate-y-1 hover:shadow-raised">
            <div aria-hidden="true" className="grid min-h-24 place-items-center bg-secondary/70 text-5xl">{icono}</div>
            <div className="px-4 pt-3 pb-2">
              <p className="text-sm text-muted-foreground">{detalle}</p>
              <h3 className="mt-0.5 font-display text-2xl font-semibold text-primary">{nombre}</h3>
              {ficha && <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                <li className="flex items-center gap-2"><Leaf size={15} aria-hidden="true" /> {dificultad[ficha.dificultad]}</li>
                <li className="flex items-center gap-2"><Clock3 size={15} aria-hidden="true" /> {ficha.dias_cosecha_aprox} días aprox. a cosecha</li>
                <li className="flex items-center gap-2"><Container size={15} aria-hidden="true" /> {espacios.find(([valor]) => valor === ficha.espacio_tipo)?.[1]}</li>
              </ul>}
              {ejemplo && id === 'cilantro' ?
                <a href="#ubicacion" className="inline-flex min-h-11 items-center text-sm font-bold text-primary underline-offset-4 hover:underline">Consultar mi zona</a> :
                <Link to={{ pathname: `/cultivo/${encodeURIComponent(id)}`, search: busqueda }} className="inline-flex min-h-11 items-center text-sm font-bold text-primary underline-offset-4 hover:underline" aria-label={`Ver ficha de ${nombre}`}>Ver ficha</Link>}
            </div>
          </li>)}
        </ul>
      </div>
    </section>
    <aside className="w-full border-t border-border bg-secondary" aria-label="Ventajas de QUESIEMBRO">
      <ul className="app-frame grid gap-3 py-5 sm:grid-cols-3 sm:gap-5 sm:py-7">
        {beneficios.map(({ Icono, texto }) => <li className="flex items-center gap-2.5 text-sm font-semibold text-primary" key={texto}>
          <Icono className="shrink-0" size={21} strokeWidth={1.75} aria-hidden="true" /> {texto}
        </li>)}
      </ul>
    </aside>
  </>
}
