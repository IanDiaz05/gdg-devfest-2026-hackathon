import { Database } from 'lucide-react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { Suspense, useEffect, useRef } from 'react'
import logo from '../assets/imagen.png'
import { CargaPantalla } from './Interfaz'
import { ControlesPwa } from './ControlesPwa'
import { Navbar, navegacion } from './Navbar'
import { modoDemo } from '../services/api'

export function Layout() {
  const { search, pathname } = useLocation()
  const principal = useRef<HTMLElement>(null)
  const rutaAnterior = useRef(pathname)
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
      <Navbar />
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
            <Link to={{ pathname: '/', search }} className="inline-flex min-h-11 items-center gap-2 text-lg font-extrabold focus-visible:outline-white">
              <img src={logo} alt="" width={32} height={32} className="size-8 shrink-0 rounded-lg object-contain" />
              QUESIEMBRO
            </Link>
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
