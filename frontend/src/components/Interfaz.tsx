import { CircleCheck, CircleX, Leaf, TriangleAlert } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { EstadoSiembra } from '../types/api'

export const estados = {
  optimo: {
    titulo: 'Siémbralo ahora',
    Icono: CircleCheck,
    clase: 'bg-success-soft text-success border-success-border',
  },
  con_cuidados: {
    titulo: 'Puedes sembrarlo con cuidados',
    Icono: TriangleAlert,
    clase: 'bg-warning-soft text-warning border-warning-border',
  },
  no_ahora: {
    titulo: 'No conviene sembrarlo ahora',
    Icono: CircleX,
    clase: 'bg-danger-soft text-danger border-danger-border',
  },
} satisfies Record<EstadoSiembra, { titulo: string; Icono: typeof Leaf; clase: string }>

export function Estado({ estado, texto }: { estado: EstadoSiembra; texto?: string }) {
  const { titulo, Icono, clase } = estados[estado]
  return (
    <span className={`inline-flex min-h-8 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${clase}`}>
      <Icono size={15} strokeWidth={1.75} aria-hidden="true" /> {texto ?? titulo}
    </span>
  )
}

export function CultivoIcono({ icono }: { icono?: string }) {
  return (
    <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-earth-soft text-2xl text-primary" aria-hidden="true">
      {icono ?? <Leaf size={26} strokeWidth={1.75} />}
    </span>
  )
}

export function Aviso({ children, error, reintentar, reintentoBloqueado }: {
  children: ReactNode
  error?: boolean
  reintentar?: () => void
  reintentoBloqueado?: boolean
}) {
  return (
    <div className={`my-3 rounded-2xl border p-4 ${error ? 'border-red-200 bg-red-50 text-red-800' : 'border-border bg-white text-muted-foreground'}`} role={error ? 'alert' : 'status'}>
      <p>{children}</p>
      {reintentar && <button className="mt-3 min-h-11 rounded-full border border-primary px-4 text-sm font-bold text-primary disabled:opacity-60" disabled={reintentoBloqueado} onClick={reintentar}>Reintentar</button>}
    </div>
  )
}

export function ElegirZona() {
  return <Aviso>Elige una ciudad para consultar sus cultivos. <Link className="font-bold underline underline-offset-4" to="/">Elegir zona</Link></Aviso>
}

export function TituloPagina({ etiqueta, titulo, children }: {
  etiqueta: string
  titulo: string
  children?: ReactNode
}) {
  return (
    <header>
      <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-terracotta">{etiqueta}</p>
      <h1 className="font-display text-3xl font-semibold tracking-tight text-primary md:text-4xl">{titulo}</h1>
      {children}
    </header>
  )
}


export function CargaPantalla({ mensaje }: { mensaje: string }) {
  return <div role="status" className="mx-auto max-w-md space-y-3 md:max-w-none">
    <p className="sr-only">{mensaje}</p>
    <div aria-hidden="true" className="surface space-y-3 p-5 motion-safe:animate-pulse">
      <div className="h-4 w-1/3 rounded-full bg-secondary" />
      <div className="h-9 w-1/2 rounded-xl bg-secondary" />
      <div className="h-4 w-full rounded-full bg-secondary" />
    </div>
    <div aria-hidden="true" className="grid grid-cols-2 gap-3 motion-safe:animate-pulse">
      <div className="surface h-28" /><div className="surface h-28" />
    </div>
  </div>
}
