import { CalendarDays, Database, MapPin, Sprout } from 'lucide-react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useEffect, useRef } from 'react'
import { modoDemo } from '../services/api'

const navegacion = [
  { ruta: '/zona', etiqueta: 'Tu zona', Icono: MapPin },
  { ruta: '/recomendaciones', etiqueta: 'Qué sembrar', Icono: Sprout },
  { ruta: '/calendario', etiqueta: 'Calendario', Icono: CalendarDays },
]

export function Layout() {
  const { search, pathname } = useLocation()
  const principal = useRef<HTMLElement>(null)

  useEffect(() => {
    principal.current?.focus()
  }, [pathname])

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-background shadow-soft md:max-w-5xl">
      <a className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-card focus:px-4 focus:py-3" href="#contenido">Saltar al contenido</a>
      <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 px-5 pb-3 pt-6 md:px-10">
        <Link className="flex min-h-10 items-center gap-2 text-lg font-bold tracking-tight text-primary" to={{ pathname: '/', search }} aria-label="QUESIEMBRO, ir al inicio">
          <Sprout className="size-6 shrink-0" strokeWidth={1.75} aria-hidden="true" /> QUESIEMBRO
        </Link>
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground md:order-last">México</span>
        <nav className="flex w-full flex-wrap items-center justify-between gap-1 border-b border-border pb-2 md:w-auto md:justify-center md:border-0 md:pb-0" aria-label="Navegación principal">
          {navegacion.map(({ ruta, etiqueta, Icono }) => (
            <NavLink key={ruta} className={({ isActive }) => `flex min-h-11 items-center gap-1.5 rounded-full px-2.5 text-sm font-semibold ${isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`} to={{ pathname: ruta, search }}>
              <Icono size={16} strokeWidth={1.75} aria-hidden="true" />{etiqueta}
            </NavLink>
          ))}
        </nav>
      </header>
      {modoDemo && <aside className="mx-5 flex items-center justify-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-center text-xs font-medium text-muted-foreground md:mx-10">
        <Database className="size-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" /> Modo datos de ejemplo (Backend desconectado)
      </aside>}
      <main className="w-full flex-1 px-5 py-6 md:px-10" id="contenido" ref={principal} tabIndex={-1}>
        <Outlet />
      </main>
      <footer className="mt-auto px-5 pb-8 pt-6 text-center text-sm text-muted-foreground">
        Sin cuentas. Sin registro. Solo cultivar.
      </footer>
    </div>
  )
}
