import { Snowflake, Sun } from 'lucide-react'
import type { Alerta } from '../types/api'

export function AlertasClima({ alertas }: { alertas: Alerta[] }) {
  if (!alertas.length) return null
  return <section className="mb-5 space-y-2" aria-label="Alertas para los próximos siete días">
    {alertas.map(({ tipo, severidad, titulo, mensaje }, index) => {
      const Icono = tipo === 'helada' ? Snowflake : Sun
      return <article key={`${tipo}-${index}`} className={`flex gap-3 rounded-2xl border p-4 ${severidad === 'alta' ? 'border-danger-border bg-danger-soft text-danger' : 'border-warning-border bg-warning-soft text-warning'}`}>
        <Icono size={20} strokeWidth={1.75} className="mt-1 shrink-0" aria-hidden="true" />
        <div>
          <p className="text-xs font-semibold">Próximos 7 días · Severidad {severidad}</p>
          <h2 className="mt-1 font-bold">{titulo}</h2>
          <p className="text-sm leading-6">{mensaje}</p>
        </div>
      </article>
    })}
  </section>
}
