import { CloudLightning, CloudRain, RefreshCw, ShieldCheck, Snowflake, Sun, Wind } from 'lucide-react'
import type { Alerta } from '../types/api'

const iconos = { helada: Snowflake, calor: Sun, lluvia_fuerte: CloudRain, tormenta: CloudLightning, viento: Wind, uv: Sun }

const formatoDia = new Intl.DateTimeFormat('es-MX', { weekday: 'long', day: 'numeric', month: 'short', timeZone: 'UTC' })
const dia = (fecha?: string) => {
  if (!fecha) return ''
  const valor = new Date(`${fecha}T00:00:00Z`)
  return Number.isNaN(valor.getTime()) ? fecha : formatoDia.format(valor)
}

/** Tarjetas grises mientras llega el pronóstico (misma forma que una alerta). */
function EsqueletoAlertas() {
  return <div role="status" aria-label="Cargando el pronóstico de 7 días" className="space-y-2">
    {[0, 1].map((indice) => <div key={indice} aria-hidden="true"
      className="flex gap-3 rounded-2xl border border-border bg-card p-4 motion-safe:animate-pulse">
      <span className="mt-1 size-5 shrink-0 rounded-full bg-secondary" />
      <div className="flex-1 space-y-2">
        <span className="block h-3 w-2/5 rounded-full bg-secondary" />
        <span className="block h-4 w-3/5 rounded-full bg-secondary" />
        <span className="block h-3 w-full rounded-full bg-secondary" />
        <span className="block h-3 w-4/5 rounded-full bg-secondary" />
      </div>
    </div>)}
  </div>
}

/**
 * Pronóstico y alertas de los próximos 7 días. Se carga aparte de las recomendaciones
 * (GET /api/alertas), así que tiene sus propios estados: cargando, error, sin alertas y con alertas.
 */
export function AlertasClima({ alertas, cargando = false, error = false, reintentar }: {
  alertas?: Alerta[]
  cargando?: boolean
  error?: boolean
  reintentar?: () => void
}) {
  return <section className="space-y-2" aria-labelledby="alertas-titulo" aria-busy={cargando}>
    <h2 id="alertas-titulo" className="mb-3 text-xl font-bold">Pronóstico y alertas</h2>

    {cargando && <EsqueletoAlertas />}

    {!cargando && error && <div role="alert" className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
      <p>No pudimos cargar el pronóstico de esta semana. Las recomendaciones de siembra no cambian.</p>
      {reintentar && <button type="button" onClick={reintentar}
        className="mt-3 inline-flex min-h-10 items-center gap-1.5 rounded-full border border-primary px-4 font-bold text-primary hover:bg-secondary motion-safe:transition-colors">
        <RefreshCw size={15} strokeWidth={1.75} aria-hidden="true" /> Reintentar
      </button>}
    </div>}

    {!cargando && !error && alertas && alertas.length === 0 && <p className="flex items-center gap-2 rounded-2xl border border-success-border bg-success-soft p-4 text-sm font-medium text-success">
      <ShieldCheck size={20} strokeWidth={1.75} className="shrink-0" aria-hidden="true" /> Sin alertas para tus macetas en los próximos 7 días.
    </p>}

    {!cargando && !error && alertas?.map(({ tipo, severidad, fecha, titulo, mensaje }, index) => {
      const Icono = iconos[tipo]
      return <article key={`${tipo}-${index}`}
        className={`flex gap-3 rounded-2xl border p-4 motion-safe:animate-fade-up motion-safe:[animation-duration:250ms] motion-reduce:animate-none ${severidad === 'alta' ? 'border-danger-border bg-danger-soft text-danger' : 'border-warning-border bg-warning-soft text-warning'}`}>
        <Icono size={20} strokeWidth={1.75} className="mt-1 shrink-0" aria-hidden="true" />
        <div>
          <p className="text-xs font-semibold">Severidad {severidad}{fecha && <> · <time dateTime={fecha}>{dia(fecha)}</time></>}</p>
          <h3 className="mt-1 font-bold">{titulo}</h3>
          <p className="text-sm leading-6">{mensaje}</p>
        </div>
      </article>
    })}
  </section>
}
