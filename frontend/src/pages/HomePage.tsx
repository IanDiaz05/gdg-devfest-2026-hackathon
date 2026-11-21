import { skipToken, useQuery } from '@tanstack/react-query'
import { ArrowRight, CalendarDays, Container, Flower, LoaderCircle, LocateFixed, Search, Sprout, Trees, UserRound } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Boton } from '../components/Boton'
import { BuscadorCiudad } from '../components/BuscadorCiudad'
import { Chip } from '../components/Chip'
import { HeroHuerto } from '../components/HeroHuerto'
import { Aviso } from '../components/Interfaz'
import { cultivosEjemplo, SeccionesInicio } from '../components/SeccionesInicio'
import { useGeolocation } from '../hooks/useGeolocation'
import { claveDiagnostico } from '../hooks/useRecomendaciones'
import { useConexion } from '../pwa/conexion'
import { fechaGuardada } from '../pwa/datosGuardados'
import { modoDemo } from '../services/api'
import type { Diagnostico, Ubicacion } from '../types/api'
import { espacios, guardarEspacio, leerEspacio, leerMes, leerUbicacion, parametros } from '../utils/consulta'

const ejemplos = ['Toluca', 'Mérida', 'Monterrey']
const iconosEspacio = { '': Sprout, maceta_chica: Flower, maceta_grande: Container, patio: Trees }

export function HomePage() {
  const conectado = useConexion()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [ciudad, setCiudad] = useState(params.get('q') ?? '')
  const [espacio, setEspacio] = useState(() => leerEspacio(params.get('espacio')))
  const ubicacionActual = leerUbicacion(params)
  const mes = modoDemo ? 12 : leerMes(params)

  // La portada reutiliza el diagnóstico de la navegación, sin iniciar una consulta.
  const consulta = useQuery<Diagnostico>({ queryKey: claveDiagnostico(ubicacionActual, mes), queryFn: skipToken })
  const datos = !modoDemo && conectado && !fechaGuardada(consulta.data) ? consulta.data : undefined

  function consultar(ubicacion: Ubicacion) {
    const consulta = parametros(ubicacion, mes)
    consulta.set('espacio', espacio)
    navigate({ pathname: '/zona', search: consulta.toString() })
  }

  function elegirEspacio(valor: (typeof espacios)[number][0]) {
    setEspacio(valor)
    guardarEspacio(valor)
  }

  const { solicitar, cancelar, buscando, error } = useGeolocation(consultar)

  return (
    <>
      <section className="relative isolate w-full overflow-clip bg-cream" aria-labelledby="titulo-inicio">
        <div aria-hidden="true" className="pointer-events-none absolute -top-30 -left-24 -z-10 size-96 rounded-full bg-sage/15 blur-3xl" />
        <div className="app-frame grid items-center gap-x-10 gap-y-6 pt-7 pb-8 sm:py-11 lg:min-h-[calc(100svh-4rem)] lg:grid-cols-2 lg:content-center lg:gap-x-14 lg:gap-y-5 xl:gap-x-20">
          <div className="min-w-0 motion-safe:animate-fade-up motion-reduce:animate-none lg:col-start-1 lg:row-start-1">
            <p className="eyebrow flex items-center gap-2"><Sprout size={17} strokeWidth={1.75} aria-hidden="true" /> Tu huerto empieza aquí</p>
            <h1 id="titulo-inicio" className="mt-3 max-w-[13ch] font-display text-4xl leading-[1.06] font-semibold tracking-[-0.045em] text-foreground sm:text-5xl lg:text-6xl xl:text-7xl">
              Descubre qué <span className="relative inline-block pb-1 text-primary">sembrar
                <svg viewBox="0 0 240 15" preserveAspectRatio="none" aria-hidden="true" className="pointer-events-none absolute right-0 bottom-0 h-2 w-full text-terracotta/75 sm:h-3">
                  <path d="M3 11C65 0 149 1 237 7M18 13C77 6 161 6 216 10" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" />
                </svg>
              </span> en tu patio o macetas
            </h1>
            <p className="mt-4 max-w-[48ch] leading-7 text-muted-foreground sm:text-lg">
              Elige qué cultivar con 30 años de datos climáticos de tu localidad.
            </p>
          </div>

          {/* relative z-20: la animación crea una capa propia; sin esto, la lista de ciudades queda debajo de la franja de abajo */}
          <div id="ubicacion" className="surface relative z-20 min-w-0 p-4 shadow-soft motion-safe:animate-fade-up motion-safe:[animation-delay:85ms] motion-reduce:animate-none sm:p-5 lg:col-start-1 lg:row-start-2">
            <form onSubmit={(event) => {
              event.preventDefault()
              const q = ciudad.trim()
              if (!q) return
              cancelar()
              consultar({ q })
            }} className="@container" role="search" aria-label="Buscar ubicación">
              <label className="block font-bold text-foreground" htmlFor="ciudad">¿Dónde vas a cultivar?</label>
              <BuscadorCiudad id="ciudad" valor={ciudad} onCambio={setCiudad} />
              <fieldset className="mt-3.5">
                <legend className="mb-2 text-sm font-bold text-foreground">¿Qué espacio tienes?</legend>
                <div className="grid grid-cols-2 gap-2 @xl:grid-cols-4">
                  {espacios.map(([valor, etiqueta]) => {
                    const Icono = iconosEspacio[valor]
                    return <Chip key={valor} selected={espacio === valor} onClick={() => elegirEspacio(valor)}
                      className="inline-flex min-w-0 items-center justify-center gap-1.5 px-2">
                      <Icono size={16} className="shrink-0" strokeWidth={1.75} aria-hidden="true" /> {etiqueta}
                    </Chip>
                  })}
                </div>
              </fieldset>
              <div className="mt-4 grid gap-2 min-[560px]:grid-cols-2">
                <Boton type="submit" disabled={!ciudad.trim()}>
                  <Search size={17} strokeWidth={1.75} aria-hidden="true" /> Ver qué sembrar hoy
                </Boton>
                <Boton variante="secundario" className="group" onClick={solicitar} disabled={buscando || !conectado} aria-busy={buscando}>
                  {buscando ? <LoaderCircle size={18} className="motion-safe:animate-spin motion-reduce:animate-none" aria-hidden="true" /> :
                    <LocateFixed size={18} strokeWidth={1.75} className="motion-safe:group-hover:animate-pulse motion-reduce:animate-none" aria-hidden="true" />}
                  <span aria-live="polite">{buscando ? 'Localizando…' : 'Usar mi ubicación actual'}</span>
                </Boton>
              </div>
            </form>
            {error && <Aviso error>{error}</Aviso>}
            {modoDemo && <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-0.5">
              <span className="text-xs font-semibold text-muted-foreground">Ejemplos de ubicación</span>
              {ejemplos.map((nombre) => <button type="button" key={nombre}
                className="min-h-11 rounded-md text-sm font-bold text-primary underline-offset-4 hover:underline"
                onClick={() => { setCiudad(nombre); cancelar(); consultar({ q: nombre }) }}>{nombre}</button>)}
            </div>}
          </div>

          <div className="min-w-0 lg:col-start-2 lg:row-span-2 lg:row-start-1">
            <HeroHuerto datos={datos} />
          </div>

          <div className="grid gap-5 border-t border-border pt-4 motion-safe:animate-fade-up motion-safe:[animation-delay:200ms] motion-reduce:animate-none lg:col-span-2 lg:grid-cols-[1fr_auto] lg:items-center">
            <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm font-semibold text-primary sm:gap-x-6" aria-label="Resumen de QUESIEMBRO">
              <li className="flex items-center gap-2"><CalendarDays size={17} aria-hidden="true" /> 30 años de datos climáticos</li>
              <li className="flex items-center gap-2"><Sprout size={17} aria-hidden="true" /> {datos?.cultivos.length ? `${datos.cultivos.length} cultivos evaluados` : 'Cultivos para casa'}</li>
              <li className="flex items-center gap-2"><UserRound size={17} aria-hidden="true" /> Sin registro</li>
            </ul>
            <div className="flex flex-wrap items-center gap-2" aria-label="Explorar cultivos">
              {cultivosEjemplo.slice(0, 3).map(({ id, nombre }) => {
                const estilo = 'inline-flex min-h-11 items-center gap-1.5 rounded-full border border-border bg-card px-3 text-sm font-bold text-primary hover:border-sage hover:bg-secondary motion-safe:transition motion-safe:duration-200 motion-safe:hover:-translate-y-0.5'
                return modoDemo && id === 'cilantro'
                  ? <a key={id} href="#cultivos-del-mes" className={estilo}>{nombre}</a>
                  : <Link key={id} to={{ pathname: `/cultivo/${id}`, search: params.toString() }} className={estilo}>
                    {nombre}<ArrowRight size={14} aria-hidden="true" />
                  </Link>
              })}
            </div>
          </div>
        </div>
      </section>
      <SeccionesInicio cultivos={datos?.cultivos} busqueda={params.toString()} ejemplo={modoDemo} />
    </>
  )
}
