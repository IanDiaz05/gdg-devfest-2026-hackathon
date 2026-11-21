import { CalendarDays, Database, Home, MapPin, Menu, Sprout, X } from 'lucide-react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { Suspense, useEffect, useRef, useState } from 'react'
import { CargaPantalla } from './Interfaz'
import { ControlesPwa } from './ControlesPwa'
import { BotonTema } from './BotonTema'
import { modoDemo } from '../services/api'

const navegacion = [
  { ruta: '/', etiqueta: 'Inicio', Icono: Home },
  { ruta: '/zona', etiqueta: 'Tu zona', Icono: MapPin },
  { ruta: '/recomendaciones', etiqueta: 'Qué sembrar', Icono: Sprout },
  { ruta: '/calendario', etiqueta: 'Calendario', Icono: CalendarDays },
]

export function Layout() {
  const { search, pathname } = useLocation()
  const principal = useRef<HTMLElement>(null)
  const botonMenu = useRef<HTMLButtonElement>(null)
  const rutaAnterior = useRef(pathname)
  const [menu, setMenu] = useState(false)
  const inicio = pathname === '/'

  useEffect(() => {
    if (rutaAnterior.current === pathname) return
    rutaAnterior.current = pathname
    window.scrollTo(0, 0)
    principal.current?.focus({ preventScroll: true })
  }, [pathname])

  return (
    <div className="flex min-h-screen min-h-dvh w-full flex-col bg-cream pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0">
      <a href="#contenido" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:rounded-lg focus:bg-card focus:px-4 focus:py-3">Saltar al contenido</a>
      <header className="sticky top-0 z-50 w-full border-b border-border bg-cream/90 pt-[env(safe-area-inset-top)] backdrop-blur-md">
        <div className="app-frame flex min-h-16 items-center justify-between gap-3">
          <Link className="flex min-h-11 items-center gap-2.5 text-base font-extrabold tracking-tight text-primary sm:text-lg" to={{ pathname: '/', search }} aria-label="QUESIEMBRO, ir al inicio">
            <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground"><Sprout size={20} strokeWidth={1.75} aria-hidden="true" /></span>
            QUESIEMBRO
          </Link>
          <nav className="hidden items-center gap-1 md:flex lg:gap-2" aria-label="Navegación principal">
            {navegacion.map(({ ruta, etiqueta }) => <NavLink key={ruta} end={ruta === '/'} to={{ pathname: ruta, search }} className={({ isActive }) =>
              `inline-flex min-h-11 items-center rounded-full px-3 text-sm font-bold lg:px-4 ${isActive ? 'bg-secondary text-primary' : 'text-muted-foreground hover:bg-secondary/60 hover:text-primary'}`
            }>{etiqueta}</NavLink>)}
          </nav>
          <div className="flex items-center gap-2">
          <span className="hidden items-center gap-1.5 text-sm font-bold text-primary md:inline-flex"><MapPin size={16} aria-hidden="true" /> México</span>
          <BotonTema />
          <button ref={botonMenu} type="button" aria-expanded={menu} aria-controls="menu-movil" aria-label={menu ? 'Cerrar menú' : 'Abrir menú'}
            className="grid size-11 place-items-center rounded-xl border border-border bg-card text-primary md:hidden"
            onClick={() => setMenu(!menu)}>
            {menu ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </button>
          </div>
        </div>
        <nav id="menu-movil" aria-label="Menú móvil" onKeyDown={(event) => {
          if (event.key === 'Escape') {
            setMenu(false)
            botonMenu.current?.focus()
          }
        }} className={`border-t border-border bg-card md:hidden ${menu ? '' : 'hidden'}`}>
          <div className="app-frame grid py-2">
            {navegacion.map(({ ruta, etiqueta, Icono }) => <NavLink key={ruta} end={ruta === '/'} to={{ pathname: ruta, search }}
              onClick={() => { setMenu(false); botonMenu.current?.focus() }}
              className={({ isActive }) => `flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold ${isActive ? 'bg-secondary text-primary' : 'text-muted-foreground hover:bg-secondary/60'}`}>
              <Icono size={18} strokeWidth={1.75} aria-hidden="true" /> {etiqueta}
            </NavLink>)}
          </div>
        </nav>
      </header>
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 gap-1 border-t border-border bg-card px-2 pt-1 pb-[calc(0.25rem+env(safe-area-inset-bottom))] pl-[max(0.5rem,env(safe-area-inset-left))] pr-[max(0.5rem,env(safe-area-inset-right))] md:hidden" aria-label="Navegación inferior">
        {navegacion.map(({ ruta, etiqueta, Icono }) => <NavLink key={ruta} end={ruta === '/'} onClick={() => setMenu(false)} to={{ pathname: ruta, search }}
          className={({ isActive }) => `flex min-h-12 items-center justify-center gap-1 rounded-lg text-center text-xs font-bold flex-col ${isActive ? 'bg-secondary text-primary' : 'text-muted-foreground hover:bg-secondary'}`}>
          <Icono size={19} strokeWidth={1.75} aria-hidden="true" />{etiqueta}
        </NavLink>)}
      </nav>
      <div className="pt-3 empty:hidden"><ControlesPwa /></div>
      {modoDemo && <aside className="w-full bg-secondary/65">
        <div className="app-frame flex items-center gap-2 py-2 text-sm text-muted-foreground">
          <Database className="size-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" /> Modo datos de ejemplo · Diagnósticos de diciembre
        </div>
      </aside>}
      <main className={`w-full flex-1 ${inicio ? '' : 'app-frame py-5 sm:py-8'}`} id="contenido" ref={principal} tabIndex={-1}>
        <Suspense fallback={<CargaPantalla mensaje="Abriendo pantalla…" />}><Outlet /></Suspense>
      </main>
      <footer className="w-full bg-pie text-pie-texto">
        <div className="app-frame grid gap-5 py-8 sm:grid-cols-[1fr_auto] sm:items-center sm:py-10">
          <div>
            <Link to={{ pathname: '/', search }} className="inline-flex min-h-11 items-center gap-2 text-lg font-extrabold focus-visible:outline-white"><Sprout size={22} aria-hidden="true" /> QUESIEMBRO</Link>
            <p className="mt-1 text-sm text-pie-texto/90">Sin cuentas. Sin registro. Solo cultivar.</p>
          </div>
          <nav aria-label="Enlaces del pie" className="flex flex-wrap items-center gap-x-5">
            {navegacion.slice(1).map(({ ruta, etiqueta }) => <Link key={ruta} to={{ pathname: ruta, search }}
              className="inline-flex min-h-11 items-center text-sm font-semibold underline-offset-4 hover:underline focus-visible:outline-white">{etiqueta}</Link>)}
          </nav>
        </div>
      </footer>
    </div>
  )
}
