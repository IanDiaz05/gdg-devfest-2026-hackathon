import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Recomendacion } from '../types/api'
import { meses, textoTemporada } from '../utils/consulta'

const CENTRO = 120
const RADIO_INTERNO = 60
const RADIO_EXTERNO = 102

/** Color de cada mes: verde = ideal, amarillo = con cuidados, beige = no conviene. */
const tonos = {
  ideal: { relleno: 'fill-rueda-ideal', fondo: 'bg-rueda-ideal', letra: 'fill-white', texto: 'ideal' },
  cuidados: { relleno: 'fill-rueda-cuidados', fondo: 'bg-rueda-cuidados', letra: 'fill-rueda-cuidados-texto', texto: 'con cuidados' },
  no: { relleno: 'fill-neutral-cell', fondo: 'bg-neutral-cell', letra: 'fill-muted-foreground', texto: 'no conviene' },
}

const notas = {
  ideal: '¡este mes es ideal!',
  cuidados: 'este mes se puede, con cuidados',
  no: 'este mes mejor no',
}

function punto(radio: number, angulo: number): [number, number] {
  return [CENTRO + radio * Math.sin(angulo), CENTRO - radio * Math.cos(angulo)]
}

function sector(mes: number) {
  const inicio = ((mes - 1) * Math.PI) / 6 + 0.025
  const fin = (mes * Math.PI) / 6 - 0.025
  const [x1, y1] = punto(RADIO_EXTERNO, inicio)
  const [x2, y2] = punto(RADIO_EXTERNO, fin)
  const [x3, y3] = punto(RADIO_INTERNO, fin)
  const [x4, y4] = punto(RADIO_INTERNO, inicio)
  return `M${x1} ${y1}A${RADIO_EXTERNO} ${RADIO_EXTERNO} 0 0 1 ${x2} ${y2}L${x3} ${y3}A${RADIO_INTERNO} ${RADIO_INTERNO} 0 0 0 ${x4} ${y4}Z`
}

export function estadoDelMes(cultivo: Recomendacion, mes: number): keyof typeof tonos {
  return cultivo.meses_ideales.includes(mes) ? 'ideal' : cultivo.meses_posibles.includes(mes) ? 'cuidados' : 'no'
}

/**
 * Rueda del año de un cultivo: 12 sectores (enero arriba, en sentido del reloj) coloreados según
 * `meses_ideales` y `meses_posibles` de la zona consultada. El mes consultado va marcado.
 */
export function RuedaAnual({ cultivos, elegido, elegir, mes, busqueda }: {
  cultivos: Recomendacion[]
  elegido: Recomendacion
  elegir: (id: string) => void
  mes: number
  busqueda: string
}) {
  const estadoActual = estadoDelMes(elegido, mes)
  const temporada = textoTemporada(elegido.meses_ideales)
  const resumen = meses.map((nombre, index) => `${nombre}: ${tonos[estadoDelMes(elegido, index + 1)].texto}`).join('; ')

  return <section className="sobre mb-5" aria-labelledby="rueda-titulo">
    <div className="etiqueta flex flex-col items-center gap-5 sm:flex-row sm:items-center">
      <svg viewBox="0 0 240 240" className="w-full max-w-60 shrink-0" role="img" aria-label={`Rueda del año de ${elegido.nombre}. ${resumen}.`}>
        {meses.map((nombre, index) => {
          const numero = index + 1
          const tono = tonos[estadoDelMes(elegido, numero)]
          const [x, y] = punto((RADIO_INTERNO + RADIO_EXTERNO) / 2, (index + 0.5) * Math.PI / 6)
          return <g key={nombre}>
            <path d={sector(numero)} className={`${tono.relleno} ${numero === mes ? 'stroke-terracotta' : ''}`} strokeWidth={numero === mes ? 3.5 : 0} />
            <text x={x} y={y + 4} textAnchor="middle" fontSize="12" fontWeight={numero === mes ? 700 : 500} className={tono.letra}>{nombre[0]}</text>
          </g>
        })}
        <text x={CENTRO} y={CENTRO + 4} textAnchor="middle" fontSize="34">{elegido.icono}</text>
        <text x={CENTRO} y={CENTRO + 30} textAnchor="middle" fontSize="12" className="fill-primary" fontWeight="600">{meses[mes - 1].toLocaleLowerCase('es-MX')}</text>
      </svg>

      <div className="min-w-0 flex-1 text-center sm:text-left">
        <p className="eyebrow">Rueda del año</p>
        <h2 id="rueda-titulo" className="mt-1 font-display text-3xl font-semibold text-primary">{elegido.nombre}</h2>
        <p className="mt-1">Mejor época: <strong>{temporada || 'ningún mes ideal en tu zona'}</strong></p>
        <p className="mt-1 font-mano text-2xl font-bold text-terracotta">{notas[estadoActual]}</p>
        <Link className="mt-2 inline-flex min-h-11 items-center gap-1 text-sm font-bold text-primary underline-offset-4 hover:underline"
          to={{ pathname: `/cultivo/${encodeURIComponent(elegido.id)}`, search: busqueda }}>
          Ver la ficha <ArrowRight size={16} strokeWidth={1.75} aria-hidden="true" />
        </Link>
        <ul className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-tinta-suave sm:justify-start" aria-hidden="true">
          {Object.values(tonos).map(({ fondo, texto }) => <li key={texto} className="inline-flex items-center gap-1.5">
            <span className={`size-2.5 rounded-full ${fondo}`} />{texto}
          </li>)}
          <li className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-full border-2 border-terracotta" />mes consultado</li>
        </ul>
      </div>
    </div>

    {/* En celular, una sola fila que se desliza de lado; en pantallas grandes, todos a la vista */}
    <div className="sin-barra -mx-3 mt-3 flex gap-2 overflow-x-auto px-3 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0" role="group" aria-label="Elegir cultivo para la rueda">
      {cultivos.map((cultivo) => <button key={cultivo.id} type="button" aria-pressed={cultivo.id === elegido.id} onClick={() => elegir(cultivo.id)}
        className={`min-h-9 shrink-0 rounded-full border-[1.5px] px-3 text-sm font-semibold whitespace-nowrap transition-colors ${cultivo.id === elegido.id
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-dashed border-kraft bg-papel-claro text-tinta hover:bg-card'}`}>
        <span aria-hidden="true">{cultivo.icono}</span> {cultivo.nombre}
      </button>)}
    </div>
  </section>
}
