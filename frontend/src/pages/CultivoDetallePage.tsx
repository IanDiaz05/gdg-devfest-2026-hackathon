import { useState } from 'react'
import { ArrowLeft, Clock3, Droplets, Share2, Sprout, Sun } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { ErrorConsulta } from '../components/ErrorConsulta'
import { GraficaTemperatura } from '../components/GraficaTemperatura'
import { Aviso, CargaPantalla, CultivoIcono, Estado, estados } from '../components/Interfaz'
import { useCultivoDetalle } from '../hooks/useCultivoDetalle'
import { useRecomendaciones } from '../hooks/useRecomendaciones'
import { formatoNumero } from '../utils/consulta'

const luz = { pleno_sol: 'Pleno sol', media_sombra: 'Media sombra', sombra: 'Sombra' }
const panel = 'surface p-5 shadow-soft'
const porcentaje = (valor: number) => `${valor > 0 ? '+' : ''}${formatoNumero.format(valor)}%`

function ListaFicha({ titulo, items, alerta = false }: { titulo: string; items: string[]; alerta?: boolean }) {
  if (!items.length) return null
  return <section className={alerta ? 'rounded-2xl border border-warning-border bg-warning-soft p-5 text-warning' : panel}>
    <h2 className="text-xl font-bold">{titulo}</h2>
    <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6">
      {items.map((texto, index) => <li key={index}>{texto}</li>)}
    </ul>
  </section>
}

export function CultivoDetallePage() {
  const { id = '' } = useParams()
  const { consulta: diagnostico, busqueda } = useRecomendaciones()
  const consulta = useCultivoDetalle(id)
  const [mensaje, setMensaje] = useState('')
  const [enlaceManual, setEnlaceManual] = useState('')
  const volver = <Link className="inline-flex min-h-11 items-center gap-1 text-sm font-bold text-primary" to={{ pathname: '/zona', search: busqueda }}>
    <ArrowLeft size={18} strokeWidth={1.75} aria-hidden="true" /> Volver
  </Link>

  if (consulta.isPending) return <CargaPantalla mensaje="Cargando la ficha del cultivo…" />
  if (consulta.isError) return <>{volver}<ErrorConsulta ficha error={consulta.error} busqueda={busqueda} reintentar={() => void consulta.refetch()} /></>

  const ficha = consulta.data
  const tecnica = ficha.ficha_tecnica
  const zona = diagnostico.data
  const recomendacion = zona?.cultivos.find((cultivo) => cultivo.id === id)
  const precios = ficha.contexto_economico_sniim
  const tarjetas = [
    { titulo: 'Luz', valor: luz[tecnica.luz], Icono: Sun },
    { titulo: 'Maceta', valor: `${tecnica.maceta_min_litros} L · ${tecnica.profundidad_min_cm} cm de profundidad mín.`, Icono: Sprout },
    { titulo: 'Riego', valor: tecnica.riego, Icono: Droplets },
    { titulo: 'Cosecha', valor: `${tecnica.dias_a_cosecha.join('–')} días`, Icono: Clock3 },
  ]

  async function compartir() {
    const url = new URL(window.location.href)
    url.pathname = `/cultivo/${encodeURIComponent(id)}`
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

  return <article className="mx-auto max-w-md space-y-5 pb-6 md:max-w-3xl">
    <header className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
      {volver}
      <p className="max-w-[28vw] truncate text-center text-sm font-bold" title={ficha.nombre}>{ficha.nombre}</p>
      <button className="flex min-h-11 items-center gap-1.5 justify-self-end text-sm font-bold text-primary" type="button" onClick={() => void compartir()}><Share2 size={17} strokeWidth={1.75} aria-hidden="true" /> Compartir</button>
    </header>
    {mensaje && <Aviso>{mensaje}</Aviso>}
    {enlaceManual && <label className="grid gap-2 text-sm font-semibold">Copia el enlace de la ficha
      <input className="min-h-11 rounded-xl border border-border bg-white px-3" readOnly value={enlaceManual} onFocus={(event) => event.currentTarget.select()} />
    </label>}

    <div className="flex items-start gap-3">
      <CultivoIcono icono={ficha.icono} />
      <div>
        <p className="eyebrow">{ficha.categoria} · Maceta de {tecnica.maceta_min_litros} L mín.</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight">{ficha.nombre}</h1>
        <p className="mt-1 italic text-scientific">{ficha.nombre_cientifico}</p>
        <p className="mt-3 leading-7">{ficha.resumen}</p>
      </div>
    </div>

    {zona && recomendacion && <section className={`rounded-2xl border p-4 ${estados[recomendacion.estado].clase}`}>
      <h2 className="mb-2 text-sm font-bold">{zona.ubicacion.nombre} · {zona.clima_zona.mes_nombre}</h2>
      <Estado estado={recomendacion.estado} />
      <p className="mt-2 text-sm leading-6">{recomendacion.razon_corta}</p>
    </section>}

    <dl className="grid grid-cols-2 gap-3">
      {tarjetas.map(({ titulo, valor, Icono }) => (
        <div className={panel} key={titulo}>
          <Icono size={20} strokeWidth={1.75} className="text-primary" aria-hidden="true" />
          <dt className="mt-2 text-sm text-muted-foreground">{titulo}</dt>
          <dd className="mt-1 text-sm font-bold leading-6">{valor}</dd>
        </div>
      ))}
    </dl>

    <section className={panel}>
      <h2 className="text-xl font-bold">Sustrato recomendado</h2>
      <p className="mt-2 leading-7">{tecnica.sustrato_recomendado}</p>
    </section>
    <GraficaTemperatura ideal={tecnica.temp_ideal_c} limite={tecnica.temp_limite_c} media={zona?.clima_zona.temp_media_c} />
    <ListaFicha titulo="Ojo al sembrar" items={ficha.ojo} alerta />

    {ficha.tutorial.length > 0 && <section className={panel}>
      <h2 className="text-xl font-bold">Tutorial paso a paso</h2>
      <ol className="mt-4 space-y-3">
        {ficha.tutorial.map((paso, index) => <li className="grid grid-cols-[2rem_1fr] items-start gap-3 text-sm leading-6" key={index}>
          <span className="grid size-8 place-items-center rounded-full bg-primary font-bold text-white" aria-hidden="true">{index + 1}</span>
          {paso}
        </li>)}
      </ol>
    </section>}

    {ficha.companeros_cultivo.length > 0 && <section className={panel}>
      <h2 className="text-xl font-bold">Compañeros de cultivo</h2>
      <ul className="mt-3 space-y-3">
        {ficha.companeros_cultivo.map(({ id: companero, nombre, beneficio, evidencia }) => <li className="text-sm leading-6" key={companero}>
          <strong>{nombre}</strong>{' '}
          <span className={`rounded-full px-2 py-1 text-xs font-semibold ${evidencia === 'comprobada' ? 'bg-emerald-100 text-emerald-900' : 'bg-stone-100 text-stone-800'}`}>Evidencia {evidencia}</span>
          <p>{beneficio}</p>
        </li>)}
      </ul>
    </section>}
    <ListaFicha titulo="Curiosidades" items={ficha.curiosidades} />

    {precios && <section className={panel}>
      <h2 className="text-xl font-bold">Precios de temporada · SNIIM</h2>
      <p className="mt-2 text-sm text-muted-foreground">{precios.producto_sniim} · {precios.mercado_referencia}</p>
      <dl className="my-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl bg-amber-50 p-3"><dt>Mes más caro</dt><dd className="font-bold">{precios.mes_mas_caro.nombre} · {porcentaje(precios.mes_mas_caro.variacion_pct)}</dd></div>
        <div className="rounded-xl bg-emerald-50 p-3"><dt>Mes más barato</dt><dd className="font-bold">{precios.mes_mas_barato.nombre} · {porcentaje(precios.mes_mas_barato.variacion_pct)}</dd></div>
      </dl>
      <p className="text-sm leading-6">{precios.tip_ahorro}</p>
      {precios.estados_productores.length > 0 && <div className="mt-4">
        <h3 className="text-sm font-bold">Estados productores</h3>
        <ul className="mt-2 flex flex-wrap gap-2">
          {precios.estados_productores.map(({ estado, participacion_pct }) => <li key={estado} className="rounded-full bg-stone-100 px-3 py-1 text-xs">{estado} · {formatoNumero.format(participacion_pct)}%</li>)}
        </ul>
      </div>}
    </section>}
    <ListaFicha titulo="Fuentes" items={ficha.fuentes} />
  </article>
}
