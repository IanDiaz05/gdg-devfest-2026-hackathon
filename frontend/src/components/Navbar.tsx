import { skipToken, useQuery } from '@tanstack/react-query'
import { CalendarDays, Home, MapPin, Search, Sprout } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import type { To } from 'react-router-dom'
import logo from '../assets/imagen.png'
import { claveDiagnostico } from '../hooks/useRecomendaciones'
import { useScrolled } from '../hooks/useScrolled'
import type { Diagnostico } from '../types/api'
import { leerMes, leerUbicacion } from '../utils/consulta'
import { BotonInstalar } from './BotonInstalar'
import { BotonTema } from './BotonTema'

export const navegacion = [
  { ruta: '/', etiqueta: 'Inicio', Icono: Home },
  { ruta: '/zona', etiqueta: 'Tu zona', Icono: MapPin },
  { ruta: '/recomendaciones', etiqueta: 'Qué sembrar', Icono: Sprout },
  { ruta: '/calendario', etiqueta: 'Calendario', Icono: CalendarDays },
]

const foco = 'focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-cream'
const transicion = 'transition duration-200 motion-reduce:transition-none'
const escalonado = ['', '[animation-delay:40ms]', '[animation-delay:80ms]', '[animation-delay:120ms]']

function NavLinkItem({ item, search, vista, cerrar }: {
  item: (typeof navegacion)[number]
  search: string
  vista: 'escritorio' | 'panel' | 'inferior'
  cerrar?: () => void
}) {
  const { ruta, etiqueta, Icono } = item
  const estilos = {
    escritorio: 'relative min-h-11 gap-1.5 rounded-full px-2.5 text-[15px] font-medium whitespace-nowrap xl:gap-2 xl:px-4',
    panel: 'min-h-14 gap-3 rounded-2xl px-4 py-4 text-lg font-semibold',
    inferior: 'min-h-12 flex-col gap-1 rounded-xl px-1 text-center text-xs font-bold',
  }
  return <NavLink end to={{ pathname: ruta, search }} onClick={cerrar} className={({ isActive }) =>
    `flex items-center ${vista !== 'panel' ? 'justify-center' : ''} ${estilos[vista]} ${foco} ${transicion} ${isActive ? 'bg-secondary/85 text-primary' : 'text-muted-foreground hover:bg-primary/5 hover:text-primary'} ${vista === 'escritorio' ? `after:absolute after:inset-x-3.5 after:bottom-1.5 after:h-0.5 after:origin-left after:rounded-full after:bg-terracotta after:transition-transform after:duration-200 motion-reduce:after:transition-none ${isActive ? 'after:scale-x-100' : 'after:scale-x-0 hover:after:scale-x-50'}` : ''}`
  }>
    <Icono size={vista === 'panel' ? 21 : 18} className="shrink-0" strokeWidth={1.75} aria-hidden="true" />
    {etiqueta}
  </NavLink>
}

function LocationChip({ etiqueta, destino, cerrar }: { etiqueta: string; destino: To; cerrar?: () => void }) {
  return <Link to={destino} onClick={cerrar} aria-label={etiqueta === 'Elegir zona' ? etiqueta : `Tu zona: ${etiqueta}`}
    title={etiqueta} className={`inline-flex min-h-11 min-w-0 items-center gap-1.5 rounded-full border border-primary/25 bg-card px-3 text-sm font-semibold text-primary hover:border-primary/50 hover:bg-secondary/60 ${transicion} ${foco}`}>
    <MapPin size={17} strokeWidth={1.75} className="shrink-0" aria-hidden="true" />
    <span className="truncate lg:max-w-[5rem] xl:max-w-[9rem]">{etiqueta}</span>
  </Link>
}

function CtaSembrar({ destino, cerrar }: { destino: To; cerrar?: () => void }) {
  return <Link to={destino} onClick={cerrar}
    className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-primary px-3 py-2.5 text-sm font-bold whitespace-nowrap text-primary-foreground shadow-md hover:bg-primary-hover hover:shadow-lg motion-safe:hover:-translate-y-0.5 motion-safe:active:scale-95 xl:px-5 ${transicion} ${foco}`}>
    <Search size={17} strokeWidth={1.75} className="lg:hidden xl:block" aria-hidden="true" /> Ver qué sembrar hoy
  </Link>
}

function IconoMenu({ abierto = false }: { abierto?: boolean }) {
  return <span className="relative block size-5" aria-hidden="true">
    {[abierto ? 'translate-y-0 rotate-45' : '-translate-y-1.5', abierto ? 'scale-x-0 opacity-0' : '', abierto ? 'translate-y-0 -rotate-45' : 'translate-y-1.5']
      .map((clase, index) => <span key={index} className={`absolute inset-x-0 top-[9px] h-0.5 rounded-full bg-current ${transicion} ${clase}`} />)}
  </span>
}

function MobileMenu({ abierto, onCerrar, onDescartar, search, etiqueta, destinoZona, destinoCta }: {
  abierto: boolean
  onCerrar: () => void
  onDescartar: () => void
  search: string
  etiqueta: string
  destinoZona: To
  destinoCta: To
}) {
  const panel = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialogo = panel.current
    if (!dialogo) return
    if (abierto && !dialogo.open) dialogo.showModal()
    if (!abierto && dialogo.open) dialogo.close()
    if (!abierto) return

    const anterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = anterior }
  }, [abierto])

  return <dialog ref={panel} id="menu-movil" aria-labelledby="titulo-menu-movil"
    onCancel={(event) => { event.preventDefault(); onDescartar() }}
    onClick={(event) => { if (event.target === event.currentTarget) onDescartar() }}
    className="fixed inset-y-0 right-0 left-auto m-0 h-dvh max-h-none w-[calc(100%_-_1rem)] max-w-[26rem] overflow-y-auto overscroll-contain bg-cream text-foreground shadow-raised backdrop:bg-primary/30 backdrop:backdrop-blur-sm lg:hidden">
    <div className="min-h-full px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-7">
      <div className="flex items-center justify-between gap-4 border-b border-primary/10 pb-4">
        <h2 id="titulo-menu-movil" className="font-display text-2xl font-bold text-primary">Menú</h2>
        <button type="button" autoFocus aria-label="Cerrar menú" onClick={onDescartar}
          className={`grid size-11 place-items-center rounded-xl border border-primary/15 bg-card text-primary hover:bg-secondary ${transicion} ${foco}`}>
          <IconoMenu abierto />
        </button>
      </div>
      <nav aria-label="Principal móvil" className="mt-4">
        <ul className="grid gap-1">
          {navegacion.map((item, index) => <li key={item.ruta} className={`motion-safe:animate-fade-up [animation-duration:200ms] motion-reduce:animate-none ${escalonado[index]}`}>
            <NavLinkItem item={item} search={search} vista="panel" cerrar={onCerrar} />
          </li>)}
        </ul>
      </nav>
      <div className="mt-5 grid gap-3 border-t border-primary/10 pt-5">
        <LocationChip etiqueta={etiqueta} destino={destinoZona} cerrar={onCerrar} />
        <CtaSembrar destino={destinoCta} cerrar={onCerrar} />
      </div>
    </div>
  </dialog>
}

export function Navbar() {
  const { key, pathname, search, hash } = useLocation()
  const scrolled = useScrolled()
  const [menu, setMenu] = useState(false)
  const boton = useRef<HTMLButtonElement>(null)
  const params = new URLSearchParams(search)
  const ubicacion = leerUbicacion(params)
  const { data } = useQuery<Diagnostico>({
    queryKey: claveDiagnostico(ubicacion, leerMes(params)),
    queryFn: skipToken,
  })
  const etiqueta = data ? `${data.ubicacion.nombre}, ${data.ubicacion.estado}`
    : ubicacion ? ('q' in ubicacion ? ubicacion.q : 'Tu ubicación') : 'Elegir zona'
  const inicio = { pathname: '/', search }
  const formulario = { ...inicio, hash: '#ubicacion' }
  const destinoZona = ubicacion ? { pathname: '/zona', search } : formulario
  const destinoCta = ubicacion ? { pathname: '/recomendaciones', search } : formulario

  useEffect(() => {
    setMenu(false)
    if (pathname !== '/' || hash !== '#ubicacion') return
    const frame = requestAnimationFrame(() => {
      document.getElementById('ubicacion')?.scrollIntoView()
      document.getElementById('ciudad')?.focus({ preventScroll: true })
    })
    return () => cancelAnimationFrame(frame)
  }, [key, pathname, hash])
  useEffect(() => {
    const escritorio = matchMedia('(min-width: 64rem)')
    const ajustar = () => { if (escritorio.matches) setMenu(false) }
    escritorio.addEventListener('change', ajustar)
    return () => escritorio.removeEventListener('change', ajustar)
  }, [])

  function descartar() {
    setMenu(false)
    requestAnimationFrame(() => boton.current?.focus({ preventScroll: true }))
  }

  return <>
    <header className={`sticky top-0 z-50 w-full border-b border-primary/10 bg-cream/80 pt-[env(safe-area-inset-top)] backdrop-blur-lg ${transicion} ${scrolled ? 'shadow-sm' : ''}`}>
      <div className={`app-frame grid grid-cols-[auto_1fr_auto] items-center gap-2 lg:gap-3 xl:gap-5 transition-[height] duration-200 motion-reduce:transition-none ${scrolled ? 'h-[3.75rem] lg:h-[4.5rem]' : 'h-16 lg:h-20'}`}>
        <Link to={inicio} aria-label="QUESIEMBRO, ir al inicio"
          className={`group flex min-h-11 items-center gap-2 rounded-xl text-primary sm:gap-2.5 ${foco}`}>
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-soft">
            <img src={logo} alt="" width={34} height={34} className="size-[2.125rem] rounded-lg object-contain transition duration-200 motion-safe:group-hover:scale-105 motion-safe:group-hover:rotate-6 motion-reduce:transition-none" />
          </span>
          <span className="font-display text-xl font-bold tracking-tight xl:text-[1.35rem]"><span className="text-muted-foreground">QUE</span>SIEMBRO</span>
        </Link>
        <nav aria-label="Principal" className="hidden min-w-0 justify-self-center lg:block">
          <ul className="flex items-center gap-0.5 xl:gap-1">
            {navegacion.map((item) => <li key={item.ruta}><NavLinkItem item={item} search={search} vista="escritorio" /></li>)}
          </ul>
        </nav>
        <div className="col-start-3 flex items-center gap-2 xl:gap-3">
          <div className="hidden items-center gap-2 lg:flex xl:gap-3">
            <LocationChip etiqueta={etiqueta} destino={destinoZona} />
            <CtaSembrar destino={destinoCta} />
          </div>
          <BotonInstalar className={`${foco} ${transicion}`} />
          <BotonTema className={foco} />
          <button ref={boton} type="button" aria-expanded={menu} aria-controls="menu-movil"
          aria-label={menu ? 'Cerrar menú' : 'Abrir menú'} onClick={() => setMenu((abierto) => !abierto)}
          className={`grid size-11 place-items-center rounded-full border border-primary/20 bg-card text-primary hover:bg-secondary lg:hidden ${foco} ${transicion}`}>
            <IconoMenu abierto={menu} />
          </button>
        </div>
      </div>
      <MobileMenu abierto={menu} onCerrar={() => setMenu(false)} onDescartar={descartar} search={search} etiqueta={etiqueta} destinoZona={destinoZona} destinoCta={destinoCta} />
    </header>
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-primary/10 bg-cream/95 px-2 pt-1 pb-[calc(0.25rem+env(safe-area-inset-bottom))] pl-[max(0.5rem,env(safe-area-inset-left))] pr-[max(0.5rem,env(safe-area-inset-right))] shadow-soft backdrop-blur-lg md:hidden" aria-label="Navegación inferior">
      <ul className="grid grid-cols-4 gap-1">
        {navegacion.map((item) => <li key={item.ruta}><NavLinkItem item={item} search={search} vista="inferior" /></li>)}
      </ul>
    </nav>
  </>
}
