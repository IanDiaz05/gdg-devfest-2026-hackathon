import { EstadoDatos } from '../components/EstadoDatos'
import { useState } from 'react'
import type { ReactNode } from 'react'
import { ArrowLeft, BookOpen, Clock3, Droplets, Lightbulb, Share2, Sprout, Sun } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { ErrorConsulta } from '../components/ErrorConsulta'
import { Aviso, CargaPantalla, CultivoIcono } from '../components/Interfaz'
import { useCultivoDetalle } from '../hooks/useCultivoDetalle'
import { useRecomendaciones } from '../hooks/useRecomendaciones'
import type { EstadoSiembra, FichaCultivo } from '../types/api'
import { formatoNumero } from '../utils/consulta'

const luz = { pleno_sol: 'Pleno sol', media_sombra: 'Media sombra', sombra: 'Sombra' }
const luzPorNivel = { 1: 'Sombra', 2: 'Luz indirecta', 3: 'Sol parcial', 4: 'Pleno sol' }
const grados = (valor: number) => `${formatoNumero.format(valor)} °C`

/** Sello y nota a mano del sobre, según cómo le va al cultivo en la zona consultada. */
const sellos: Record<EstadoSiembra, { sello: string; nota: string; color: string; franja: string }> = {
  optimo: { sello: 'Siembra ahora', nota: '¡Es buen mes!', color: 'border-success text-success', franja: 'border-success/50 bg-success-soft text-success' },
  con_cuidados: { sello: 'Con cuidados', nota: 'Se puede, con cuidados', color: 'border-warning text-warning', franja: 'border-warning/50 bg-warning-soft text-warning' },
  no_ahora: { sello: 'Todavía no', nota: 'Mejor espera', color: 'border-danger text-danger', franja: 'border-danger/40 bg-danger-soft text-danger' },
}

function Seccion({ titulo, children, className = '' }: { titulo: string; children: ReactNode; className?: string }) {
  return <section className={`etiqueta ${className}`}>
    <h2 className="titulo-sobre">{titulo}</h2>
    {children}
  </section>
}

/** Barra de temperatura: rango que aguanta (amarillo), ideal (verde) y la media de la zona. */
function Temperatura({ ficha, media }: { ficha: FichaCultivo; media?: number }) {
  const { temp_ideal_c: ideal, temp_limite_c: limite, tolera_helada } = ficha.ficha_tecnica
  const min = Math.min(0, limite[0], media ?? Infinity)
  const max = Math.max(40, limite[1], media ?? -Infinity)
  const x = (valor: number) => `${((valor - min) / (max - min)) * 100}%`
  const ancho = ([a, b]: [number, number]) => `${((b - a) / (max - min)) * 100}%`
  return <Seccion titulo="Temperatura">
    <div className="relative mt-4 h-3 rounded-full bg-earth-soft" role="img"
      aria-label={`Ideal de ${grados(ideal[0])} a ${grados(ideal[1])}; aguanta de ${grados(limite[0])} a ${grados(limite[1])}${media !== undefined ? `; la media de tu zona es ${grados(media)}` : ''}`}>
      <span className="absolute inset-y-0 rounded-full bg-sun/60" style={{ left: x(limite[0]), width: ancho(limite) }} />
      <span className="absolute inset-y-0 rounded-full bg-success" style={{ left: x(ideal[0]), width: ancho(ideal) }} />
      {media !== undefined && <span className="absolute -inset-y-1.5 w-0.5 rounded bg-tinta" style={{ left: x(media) }} />}
    </div>
    <p className="mt-2 text-sm"><strong className="text-success">Ideal {grados(ideal[0])} a {grados(ideal[1])}</strong> · aguanta de {grados(limite[0])} a {grados(limite[1])}</p>
    {media !== undefined && <p className="text-sm text-tinta-suave">La raya oscura es la media de tu zona este mes: {grados(media)}.</p>}
    {!tolera_helada && <p className="mt-1 text-sm text-tinta-suave">No tolera heladas.</p>}
  </Seccion>
}

const coloresSustrato = ['bg-[#5A4232] oscuro:bg-[#8A6A52]', 'bg-[#8C6A4A] oscuro:bg-[#B08A66]', 'bg-[#C9B79C]', 'bg-[#A8C3A0]']

/** Si el sustrato viene como "50% tierra negra, 40% composta, 10% tepojal", lo dibuja como barra. */
function Sustrato({ texto }: { texto: string }) {
  const partes = [...texto.matchAll(/(\d+)\s*%\s*([^,.;]+)/g)].map(([, pct, nombre]) => ({ pct: Number(pct), nombre: nombre.trim() }))
  const suma = partes.reduce((total, parte) => total + parte.pct, 0)
  return <Seccion titulo="Sustrato">
    {partes.length > 1 && suma >= 95 && suma <= 105 && <>
      <div className="mt-4 flex h-3 overflow-hidden rounded-full" aria-hidden="true">
        {partes.map((parte, index) => <span key={parte.nombre} className={coloresSustrato[index % coloresSustrato.length]} style={{ width: `${parte.pct}%` }} />)}
      </div>
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
        {partes.map((parte, index) => <li key={parte.nombre} className="inline-flex items-center gap-1.5">
          <span className={`size-2.5 rounded-full ${coloresSustrato[index % coloresSustrato.length]}`} aria-hidden="true" />{parte.pct}% {parte.nombre}
        </li>)}
      </ul>
    </>}
    <p className="mt-2 text-sm leading-6 text-tinta-suave">{texto}</p>
  </Seccion>
}

export function CultivoDetallePage() {
  const { id = '' } = useParams()
  const { consulta: diagnostico, busqueda } = useRecomendaciones()
  const consulta = useCultivoDetalle(id)
  const [mensaje, setMensaje] = useState('')
  const [enlaceManual, setEnlaceManual] = useState('')
  const volver = <Link className="-ml-3 inline-flex min-h-11 items-center gap-1 rounded-full px-3 text-sm font-bold text-primary hover:bg-secondary hover:text-primary-hover active:scale-95 motion-safe:transition" to={{ pathname: '/zona', search: busqueda }}>
    <ArrowLeft size={18} strokeWidth={1.75} aria-hidden="true" /> Volver
  </Link>

  if (consulta.isPending) return <CargaPantalla mensaje="Cargando la ficha del cultivo…" />
  if (consulta.isError) return <>{volver}<ErrorConsulta ficha error={consulta.error} busqueda={busqueda} reintentar={() => void consulta.refetch()} /></>

  const ficha = consulta.data
  const tecnica = ficha.ficha_tecnica
  const zona = diagnostico.data
  const recomendacion = zona?.cultivos.find((cultivo) => cultivo.id === id)
  const estado = recomendacion ? sellos[recomendacion.estado] : undefined
  const luzCultivo = 'luz_nivel' in tecnica ? luzPorNivel[tecnica.luz_nivel] : luz[tecnica.luz]
  const profundidad = 'profundidad_maceta_cm' in tecnica ? tecnica.profundidad_maceta_cm : tecnica.profundidad_min_cm
  const tarjetas = [
    { titulo: 'Luz', valor: luzCultivo, Icono: Sun, fondo: 'bg-sun-soft' },
    { titulo: 'Maceta', valor: `${tecnica.maceta_min_litros} L · ${profundidad} cm`, Icono: Sprout, fondo: 'bg-earth-soft' },
    { titulo: 'Riego', valor: 'riego_frecuencia_dias' in tecnica ? `Cada ${tecnica.riego_frecuencia_dias} días` : 'Ver nota', Icono: Droplets, fondo: 'bg-frost-soft' },
    { titulo: 'Cosecha', valor: `${tecnica.dias_a_cosecha.join('–')} días`, Icono: Clock3, fondo: 'bg-secondary' },
  ]
  const datos = [
    ficha.restricciones && (ficha.restricciones.pet_safe ? 'Segura para mascotas' : 'No apta para mascotas'),
    ficha.impacto_ambiental?.atrae_polinizadores && 'Atrae polinizadores',
    ficha.es_nativa_region && 'Nativa de México',
    ficha.impacto_ambiental && `Consumo de agua ${ficha.impacto_ambiental.consumo_hidrico}`,
    ficha.restricciones && `Dificultad ${ficha.restricciones.dificultad === 'facil' ? 'fácil' : ficha.restricciones.dificultad === 'dificil' ? 'difícil' : 'media'}`,
  ].filter(Boolean) as string[]

  async function compartir() {
    const url = new URL(window.location.href)
    url.pathname = `${import.meta.env.BASE_URL}cultivo/${encodeURIComponent(id)}`
    // Comparte la ficha sin incluir las coordenadas de la consulta.
    url.search = ''
    const enlace = url.toString()
    setMensaje('')
    setEnlaceManual('')
    if (navigator.share) {
      try {
        await navigator.share({ title: ficha.nombre, url: enlace })
        return
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return
      }
    }
    try {
      await navigator.clipboard.writeText(enlace)
      setMensaje('Enlace copiado.')
    } catch {
      setEnlaceManual(enlace)
    }
  }

  return <article className="w-full space-y-5 pb-3">
    <EstadoDatos datos={consulta.data} actualizado={consulta.dataUpdatedAt} contexto="Ficha" />
    {diagnostico.data && <EstadoDatos datos={diagnostico.data} actualizado={diagnostico.dataUpdatedAt} contexto="Zona" />}
    <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2">
      {volver}
      <button className="-mr-3 flex min-h-11 items-center gap-1.5 justify-self-end rounded-full px-3 text-sm font-bold text-primary hover:bg-secondary hover:text-primary-hover active:scale-95 motion-safe:transition" type="button" onClick={() => void compartir()}><Share2 size={17} strokeWidth={1.75} aria-hidden="true" /> Compartir</button>
    </header>
    {mensaje && <Aviso>{mensaje}</Aviso>}
    {enlaceManual && <label className="grid gap-2 text-sm font-semibold">Copia el enlace de la ficha
      <input className="min-h-11 rounded-xl border border-border bg-card px-3" readOnly value={enlaceManual} onFocus={(event) => event.currentTarget.select()} />
    </label>}

    <div className="sobre space-y-3">
      {/* Frente del sobre */}
      <div className="etiqueta relative flex flex-col gap-4 sm:flex-row sm:items-start sm:p-6">
        <CultivoIcono id={ficha.id} icono={ficha.icono} />
        <div className="min-w-0 sm:pr-40">
          <p className="eyebrow">{ficha.categoria} · Maceta de {tecnica.maceta_min_litros} L mín.</p>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight text-primary">{ficha.nombre}</h1>
          <p className="mt-1 text-tinta-suave italic">{ficha.nombre_cientifico}</p>
          <p className="mt-3 leading-7">{ficha.resumen}</p>
        </div>
        {zona && estado && <p className={`sello self-start rotate-6 sm:absolute sm:top-5 sm:right-5 ${estado.color}`}>
          {estado.sello}<span className="mt-0.5 block text-[0.65rem] font-semibold tracking-normal normal-case">{zona.ubicacion.nombre} · {zona.clima_zona.mes_nombre.toLocaleLowerCase('es-MX')}</span>
        </p>}
      </div>

      {zona && recomendacion && estado && <section className={`flex flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl border-[1.5px] border-dashed px-4 py-2.5 ${estado.franja}`}>
        <h2 className="font-mano text-2xl leading-none font-bold">{estado.nota}</h2>
        <p className="text-sm leading-6">{recomendacion.razon_corta}</p>
      </section>}

      {/* Datos rápidos */}
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tarjetas.map(({ titulo, valor, Icono, fondo }) => (
          <div className="etiqueta flex min-w-0 items-center gap-3 p-3 sm:p-4" key={titulo}>
            <span className={`grid size-10 shrink-0 place-items-center rounded-full ${fondo}`}>
              <Icono size={20} strokeWidth={1.75} className="text-primary" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <dt className="text-xs font-bold tracking-wider text-terracotta uppercase">{titulo}</dt>
              <dd className="font-bold leading-6">{valor}</dd>
            </div>
          </div>
        ))}
      </dl>
      <p className="px-1 text-sm leading-6 text-tinta-suave">
        <strong className="text-tinta">Riego:</strong> {tecnica.riego}{datos.length > 0 && <> · {datos.join(' · ')}</>}
      </p>

      <div className="grid gap-3 md:grid-cols-2">
        <Temperatura ficha={ficha} media={zona?.clima_zona.temp_media_c} />
        <Sustrato texto={tecnica.sustrato_recomendado} />
      </div>

      {(ficha.guia_rapida?.error_comun || ficha.ojo.length > 0) && <div className="grid gap-3 md:grid-cols-2">
        {ficha.guia_rapida?.error_comun && <Seccion titulo="Error común">
          <p className="mt-2 leading-7">{ficha.guia_rapida.error_comun}</p>
        </Seccion>}
        {ficha.ojo.length > 0 && <section className="relative -rotate-1 rounded-md bg-nota px-5 pt-6 pb-4 text-nota-tinta shadow-soft">
          <span className="absolute -top-2 left-1/2 h-4 w-16 -translate-x-1/2 rotate-3 bg-earth-soft/95" aria-hidden="true" />
          <h2 className="font-mano text-3xl leading-none font-bold">¡Ojo!</h2>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 leading-6">
            {ficha.ojo.map((texto, index) => <li key={index}>{texto}</li>)}
          </ul>
        </section>}
      </div>}

      {ficha.tutorial.length > 0 && <Seccion titulo="Paso a paso">
        <ol className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {ficha.tutorial.map((paso, index) => <li className="rounded-xl border border-kraft/30 bg-card p-3 text-sm leading-6" key={index}>
            <span className="block font-mano text-3xl leading-none font-bold text-primary" aria-hidden="true">{index + 1}</span>
            {paso}
          </li>)}
        </ol>
      </Seccion>}

      {(ficha.companeros_cultivo.length > 0 || ficha.curiosidades.length > 0) && <div className="grid gap-3 md:grid-cols-2">
        {ficha.companeros_cultivo.length > 0 && <Seccion titulo="Compañeros de cultivo">
          <ul className="mt-2 space-y-3">
            {ficha.companeros_cultivo.map(({ id: companero, nombre, beneficio, evidencia }) => <li className="text-sm leading-6" key={companero}>
              <strong className="text-base">{nombre}</strong>{' '}
              <span className={`sello ml-1 border-[1.5px] px-1.5 py-0 text-[0.65rem] ${evidencia === 'comprobada' ? 'border-success text-success' : 'border-tinta-suave text-tinta-suave'}`}>{evidencia === 'comprobada' ? 'Comprobado' : 'Popular'}</span>
              <p>{beneficio}</p>
            </li>)}
          </ul>
        </Seccion>}
        {ficha.curiosidades.length > 0 && <Seccion titulo="¿Sabías que…?">
          <ul className="mt-2 space-y-2 font-display leading-7">
            {ficha.curiosidades.map((texto, index) => <li key={index} className="flex gap-2">
              <Lightbulb size={18} strokeWidth={1.75} className="mt-1 shrink-0 text-terracotta" aria-hidden="true" />{texto}
            </li>)}
          </ul>
        </Seccion>}
      </div>}

      {/* Reverso del sobre: letra chica */}
      {ficha.fuentes.length > 0 && <footer className="flex gap-2 border-t-[1.5px] border-dashed border-kraft px-1 pt-3 text-xs leading-5 text-tinta-suave">
        <BookOpen size={16} strokeWidth={1.75} className="mt-0.5 shrink-0" aria-hidden="true" />
        <p><span className="font-bold">Fuentes:</span>{' '}
          {ficha.fuentes.map((fuente, index) => {
            const url = fuente.match(/https?:\/\/\S+/)?.[0]
            return <span key={index}>{index > 0 && ' · '}{url
              ? <a className="underline underline-offset-2" href={url} target="_blank" rel="noreferrer">{fuente.replace(url, '').replace(/:\s*$/, '') || url}</a>
              : fuente}</span>
          })}
        </p>
      </footer>}
    </div>
  </article>
}
