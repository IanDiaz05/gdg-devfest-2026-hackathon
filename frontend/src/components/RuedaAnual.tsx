import { useId, useRef, useState } from 'react'
import { ArrowRight, CalendarDays } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Recomendacion } from '../types/api'
import { IconoCultivo } from './IconoCultivo'
import { meses, textoTemporada } from '../utils/consulta'

const centro = 160
const radioInterno = 90
const radioExterno = 150
const paso = Math.PI / 6

const tonos = {
  ideal: {
    relleno: 'fill-rueda-ideal', fondo: 'bg-rueda-ideal text-[#10271B]', letra: 'fill-[#10271B]',
    texto: 'Óptimo', simbolo: '✓', mensaje: 'Es un mes ideal para sembrar.',
  },
  cuidados: {
    relleno: 'fill-rueda-cuidados', fondo: 'bg-rueda-cuidados text-rueda-cuidados-texto', letra: 'fill-rueda-cuidados-texto',
    texto: 'Con cuidados', simbolo: '!', mensaje: 'Puedes sembrar este mes con cuidados.',
  },
  no: {
    relleno: 'fill-neutral-cell', fondo: 'bg-neutral-cell text-muted-foreground', letra: 'fill-muted-foreground',
    texto: 'No recomendado', simbolo: '–', mensaje: 'Este mes no se recomienda sembrar.',
  },
}

function punto(radio: number, angulo: number): [number, number] {
  return [centro + radio * Math.sin(angulo), centro - radio * Math.cos(angulo)]
}

const segmentos = meses.map((nombre, index) => {
  // Enero queda centrado arriba y el resto avanza en sentido horario.
  const angulo = index * paso
  const inicio = angulo - paso / 2 + 0.024
  const fin = angulo + paso / 2 - 0.024
  const [x1, y1] = punto(radioExterno, inicio)
  const [x2, y2] = punto(radioExterno, fin)
  const [x3, y3] = punto(radioInterno, fin)
  const [x4, y4] = punto(radioInterno, inicio)
  const [x, y] = punto((radioInterno + radioExterno) / 2, angulo)
  const ruta = `M${x1} ${y1}A${radioExterno} ${radioExterno} 0 0 1 ${x2} ${y2}L${x3} ${y3}A${radioInterno} ${radioInterno} 0 0 0 ${x4} ${y4}Z`
  return { nombre, numero: index + 1, x, y, ruta }
})

function estadoDelMes(cultivo: Recomendacion, mes: number): keyof typeof tonos {
  return cultivo.meses_ideales.includes(mes) ? 'ideal' : cultivo.meses_posibles.includes(mes) ? 'cuidados' : 'no'
}

export function RuedaAnual({ cultivos, elegido, elegir, mes, busqueda }: {
  cultivos: Recomendacion[]
  elegido: Recomendacion
  elegir: (id: string) => void
  mes: number
  busqueda: string
}) {
  const titulo = useId()
  const [seleccionado, setSeleccionado] = useState(mes)
  const [apuntado, setApuntado] = useState<number | null>(null)
  const [enFoco, setEnFoco] = useState<number | null>(null)
  const botones = useRef<(SVGGElement | null)[]>([])
  const mesVisible = apuntado ?? enFoco ?? seleccionado
  const estadoVisible = tonos[estadoDelMes(elegido, mesVisible)]
  const estadoSeleccionado = tonos[estadoDelMes(elegido, seleccionado)]
  const estadoConsultado = tonos[estadoDelMes(elegido, mes)]
  const temporada = textoTemporada(elegido.meses_ideales)
  const ideales = segmentos.filter(({ numero }) => estadoDelMes(elegido, numero) === 'ideal').length
  const cuidados = segmentos.filter(({ numero }) => estadoDelMes(elegido, numero) === 'cuidados').length

  return <section className="rounded-3xl border border-primary/10 bg-linear-to-br from-papel-claro to-cream p-4 shadow-sm sm:p-6 lg:flex lg:min-h-[max(34rem,calc(100svh-8rem))] lg:flex-col lg:justify-center lg:p-10" aria-labelledby={titulo}>
    <div className="grid items-center gap-6 lg:grid-cols-[minmax(320px,1fr)_minmax(0,1.2fr)] lg:gap-8">
      <div className="relative mx-auto aspect-square w-full max-w-[380px] lg:max-w-[560px]">
        <svg viewBox="0 0 320 320" className="block h-auto w-full" role="img"
          aria-label={`Rueda anual de ${elegido.nombre}. ${meses[mes - 1]} es el mes consultado y está marcado en terracota. Usa las flechas para recorrer los meses.`}>
          <circle cx={centro} cy={centro} r={85} className="fill-card stroke-border" />
          {segmentos.map(({ nombre, numero, x, y, ruta }) => {
            const tono = tonos[estadoDelMes(elegido, numero)]
            return <g key={nombre}>
              <path d={ruta} className={`${tono.relleno} motion-safe:transition-colors motion-safe:duration-300 motion-reduce:transition-none ${numero === mes ? 'stroke-terracotta' : numero === seleccionado ? 'stroke-primary' : ''}`}
                strokeWidth={numero === mes ? 3 : numero === seleccionado ? 2 : 0} />
              <text x={x} y={y - 2} textAnchor="middle" fontSize="13" fontWeight="700" className={tono.letra}>{nombre.slice(0, 3)}</text>
              <text x={x} y={y + 13} textAnchor="middle" fontSize="12" fontWeight="700" className={tono.letra}>{tono.simbolo}</text>
            </g>
          })}
          <g key={`${elegido.id}-${mesVisible}`} className="motion-safe:animate-fade-up motion-safe:[animation-duration:180ms] motion-reduce:animate-none">
            <IconoCultivo id={elegido.id} icono={elegido.icono} size={44} x={centro - 22} y={centro - 36} className="text-foreground" />
            <text x={centro} y={centro + 25} textAnchor="middle" fontSize="16" fontWeight="700" className="fill-primary">{meses[mesVisible - 1]}</text>
            <text x={centro} y={centro + 44} textAnchor="middle" fontSize="11" fontWeight="600" className="fill-muted-foreground">{estadoVisible.texto}</text>
          </g>
        </svg>
        <svg viewBox="0 0 320 320" className="pointer-events-none absolute inset-0 size-full" role="group" aria-label="Elegir mes">
          {segmentos.map(({ nombre, numero, ruta }, index) => (
            <g key={nombre} ref={(elemento) => { botones.current[index] = elemento }}
              role="button" aria-pressed={numero === seleccionado}
              aria-label={`${nombre}: ${tonos[estadoDelMes(elegido, numero)].texto.toLocaleLowerCase('es-MX')}`}
              tabIndex={numero === seleccionado ? 0 : -1}
              className="group cursor-pointer focus-visible:outline-none"
              onPointerEnter={(event) => { if (event.pointerType !== 'touch') setApuntado(numero) }}
              onPointerLeave={() => setApuntado(null)}
              onFocus={() => setEnFoco(numero)}
              onBlur={() => setEnFoco(null)}
              onClick={() => setSeleccionado(numero)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  setSeleccionado(numero)
                  return
                }
                const anterior = event.key === 'ArrowLeft' || event.key === 'ArrowUp'
                const siguiente = event.key === 'ArrowRight' || event.key === 'ArrowDown'
                if (!anterior && !siguiente) return
                event.preventDefault()
                const destino = (index + (anterior ? 11 : 1)) % 12
                setApuntado(null)
                setSeleccionado(destino + 1)
                botones.current[destino]?.focus()
              }}>
              <path d={ruta} className="pointer-events-auto fill-transparent stroke-transparent group-hover:stroke-foreground group-focus-visible:stroke-foreground" strokeWidth={3} />
            </g>
          ))}
        </svg>
      </div>

      <div className="min-w-0 space-y-4">
        <div aria-live="polite" aria-atomic="true">
          <p className="eyebrow">Rueda del año</p>
          <div key={elegido.id} className="motion-safe:animate-fade-up motion-safe:[animation-duration:200ms] motion-reduce:animate-none">
            <h2 id={titulo} className="mt-1 font-display text-4xl leading-tight font-semibold text-primary lg:text-5xl">{elegido.nombre}</h2>
            <p className="mt-3 text-sm text-muted-foreground sm:text-base"><strong className="text-foreground">Mejor época</strong> · {temporada || 'Ningún mes ideal en esta zona'}</p>
          </div>
          <div key={seleccionado} className="mt-4 rounded-2xl border border-primary/15 bg-card p-4 motion-safe:animate-fade-up motion-safe:[animation-duration:200ms] motion-reduce:animate-none">
            <p className="flex items-center gap-2 text-sm font-bold text-primary"><CalendarDays size={17} aria-hidden="true" /> {meses[seleccionado - 1]} · {estadoSeleccionado.texto}</p>
            <p className="mt-1 text-sm leading-6 text-foreground">{estadoSeleccionado.mensaje}</p>
            {seleccionado !== mes && <p className="mt-2 text-xs text-muted-foreground">Mes consultado · {meses[mes - 1]}: {estadoConsultado.texto.toLocaleLowerCase('es-MX')}</p>}
          </div>
        </div>
        <ul className="flex flex-wrap gap-2 text-sm font-semibold" aria-label="Resumen anual">
          <li className="rounded-full bg-success-soft px-3 py-1.5 text-success">{ideales} {ideales === 1 ? 'mes ideal' : 'meses ideales'}</li>
          <li className="rounded-full bg-warning-soft px-3 py-1.5 text-warning">{cuidados} {cuidados === 1 ? 'mes' : 'meses'} con cuidados</li>
        </ul>
        <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground" aria-label="Leyenda de la rueda">
          {Object.values(tonos).map(({ fondo, texto, simbolo }) => <li key={texto} className="inline-flex items-center gap-1.5">
            <span className={`grid size-5 shrink-0 place-items-center rounded-full text-xs font-bold ${fondo}`} aria-hidden="true">{simbolo}</span>{texto}
          </li>)}
          <li className="inline-flex items-center gap-1.5"><span className="size-5 shrink-0 rounded-full border-2 border-terracotta" aria-hidden="true" /> Mes consultado</li>
        </ul>
        <Link className="inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-4 text-sm font-bold text-primary-foreground hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 motion-safe:transition-colors motion-reduce:transition-none"
          to={{ pathname: `/cultivo/${encodeURIComponent(elegido.id)}`, search: busqueda }}>
          Ver la ficha <ArrowRight size={17} strokeWidth={1.75} aria-hidden="true" />
        </Link>
      </div>
    </div>

    <div className="mt-6 border-t border-primary/10 pt-4">
      <p className="mb-2 text-sm font-bold text-primary">Elige un cultivo</p>
      <div className="sin-barra -mx-1 flex snap-x scroll-px-1 gap-2 overflow-x-auto p-1 pb-2 lg:flex-wrap lg:overflow-visible" role="group" aria-label="Elegir cultivo para la rueda">
        {cultivos.map((cultivo) => <button key={cultivo.id} type="button" aria-pressed={cultivo.id === elegido.id}
          onClick={() => { setApuntado(null); setEnFoco(null); elegir(cultivo.id) }}
          className={`min-h-11 shrink-0 snap-start rounded-full border px-4 text-sm font-semibold whitespace-nowrap focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 motion-safe:transition-colors motion-safe:duration-200 motion-reduce:transition-none ${cultivo.id === elegido.id
            ? 'border-primary bg-primary text-primary-foreground'
            : 'border-border bg-card text-foreground hover:bg-secondary'}`}>
          <IconoCultivo id={cultivo.id} icono={cultivo.icono} size={22} className="-my-1 inline-block align-middle" /> {cultivo.nombre}
        </button>)}
      </div>
    </div>
  </section>
}
