import { CloudLightning, CloudRain, Snowflake, Sun, Wind } from 'lucide-react'
import type { Alerta } from '../types/api'

const iconos = { helada: Snowflake, calor: Sun, lluvia_fuerte: CloudRain, tormenta: CloudLightning, viento: Wind, uv: Sun }

export function AlertasClima({ alertas }: { alertas: Alerta[] }) {
  if (!alertas.length) return null
  return <section className="space-y-2" aria-label="Alertas para los próximos siete días">
    <h2 className="mb-3 text-xl font-bold">Pronóstico y alertas</h2>
    {alertas.map(({ tipo, severidad, fecha, titulo, mensaje }, index) => {
      const Icono = iconos[tipo]
      return <article key={`${tipo}-${index}`} className={`flex gap-3 rounded-2xl border p-4 ${severidad === 'alta' ? 'border-danger-border bg-danger-soft text-danger' : 'border-warning-border bg-warning-soft text-warning'}`}>
        <Icono size={20} strokeWidth={1.75} className="mt-1 shrink-0" aria-hidden="true" />
        <div>
          <p className="text-xs font-semibold">Próximos 7 días · Severidad {severidad}{fecha && <> · <time dateTime={fecha}>{fecha}</time></>}</p>
          <h3 className="mt-1 font-bold">{titulo}</h3>
          <p className="text-sm leading-6">{mensaje}</p>
        </div>
      </article>
    })}
  </section>
}
