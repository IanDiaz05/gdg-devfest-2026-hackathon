import { formatoNumero } from '../utils/consulta'

type Rango = [number, number]
const grados = (valor: number) => `${formatoNumero.format(valor)} °C`

export function GraficaTemperatura({ ideal, limite, media }: { ideal: Rango; limite: Rango; media?: number }) {
  const min = Math.min(ideal[0], limite[0], media ?? Infinity)
  const max = Math.max(ideal[1], limite[1], media ?? -Infinity)
  const posicion = (valor: number) => ((valor - min + 2) / (max - min + 4)) * 100
  const bandas = [
    { rango: limite, color: 'bg-amber-200', relleno: 'fill-amber-200', etiqueta: 'Rango límite' },
    { rango: ideal, color: 'bg-primary', relleno: 'fill-primary', etiqueta: 'Rango ideal' },
  ]

  return <section className="surface p-5 shadow-soft" aria-labelledby="temperaturas">
    <h2 id="temperaturas" className="text-xl font-bold">Temperatura del cultivo</h2>
    <figure className="mt-4">
      <svg className="h-11 w-full" aria-hidden="true">
        {bandas.map(({ rango, relleno, etiqueta }, index) => <g key={etiqueta}>
          <rect className="fill-neutral-cell" x="0" y={index * 22 + 3} width="100%" height="15" rx="7" />
          <rect className={relleno} x={`${posicion(rango[0])}%`} y={index * 22 + 3} width={`${posicion(rango[1]) - posicion(rango[0])}%`} height="15" rx="7" />
        </g>)}
        {media !== undefined && <line className="stroke-foreground stroke-2" x1={`${posicion(media)}%`} x2={`${posicion(media)}%`} y1="0" y2="43" />}
      </svg>
      <figcaption className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
        {bandas.map(({ rango, color, etiqueta }) => <span className="inline-flex items-center gap-2" key={etiqueta}><span className={`size-3 rounded-full ${color}`} aria-hidden="true" />{etiqueta} · {grados(rango[0])} a {grados(rango[1])}</span>)}
        {media !== undefined && <strong className="text-foreground">Media histórica de tu zona · {grados(media)}</strong>}
      </figcaption>
    </figure>
  </section>
}
