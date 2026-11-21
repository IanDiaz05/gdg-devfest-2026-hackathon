import { LocateFixed, MapPin, Search } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Aviso } from '../components/Interfaz'
import { useGeolocation } from '../hooks/useGeolocation'
import type { Ubicacion } from '../types/api'
import { espacios, leerMes, parametros } from '../utils/consulta'
import { PlantasIlustracion } from '../components/PlantasIlustracion'
import { Chip } from '../components/Chip'

const ejemplos = ['Toluca', 'Mérida', 'Monterrey']

export function HomePage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [ciudad, setCiudad] = useState(params.get('q') ?? '')
  const [espacio, setEspacio] = useState(() => params.get('espacio') ?? sessionStorage.getItem('quesiembro-espacio') ?? '')

  function consultar(ubicacion: Ubicacion) {
    const mes = leerMes(params)
    const consulta = parametros(ubicacion, mes)
    consulta.set('espacio', espacio)
    navigate({ pathname: '/zona', search: consulta.toString() })
  }

  function elegirEspacio(valor: string) {
    setEspacio(valor)
    sessionStorage.setItem('quesiembro-espacio', valor)
  }

  const { solicitar, cancelar, buscando, error } = useGeolocation(consultar)

  return (
    <div className="mx-auto max-w-md md:max-w-5xl">
      <section className="md:grid md:grid-cols-2 md:items-center md:gap-10 lg:gap-16">
        <div className="py-3 md:py-5">
          <p className="eyebrow">Tu huerto empieza aquí</p>
          <h1 className="mt-3 max-w-[18ch] text-[2rem] font-bold leading-[1.1] tracking-tight sm:text-4xl lg:text-5xl">
            Descubre qué sembrar hoy en tu patio o macetas
          </h1>
          <p className="mt-5 max-w-md text-base leading-7 text-muted-foreground">
            Cultiva a tu ritmo, con 30 años de datos climáticos de tu localidad
          </p>
          <div className="mt-6 rounded-2xl bg-cream px-4 py-5 md:hidden">
            <PlantasIlustracion className="mx-auto h-32 w-full max-w-xs" />
          </div>
          <form onSubmit={(event) => {
            event.preventDefault()
            const q = ciudad.trim()
            if (!q) return
            cancelar()
            consultar({ q })
          }} className="mt-6">
            <h2 className="mb-3 text-lg font-bold text-foreground">¿Dónde vas a cultivar?</h2>
            <div className="surface flex items-center px-4 shadow-soft focus-within:ring-2 focus-within:ring-ring">
              <MapPin size={18} strokeWidth={1.75} className="shrink-0 text-primary" aria-hidden="true" />
              <label className="sr-only" htmlFor="ciudad">Busca tu ciudad o municipio</label>
              <input className="min-h-14 min-w-0 w-full bg-transparent px-3 text-base text-foreground outline-none placeholder:text-[#7A817C]" id="ciudad" value={ciudad} onChange={(event) => setCiudad(event.target.value)} placeholder="Busca tu ciudad o municipio..." list="ciudades-mx" required maxLength={120} />
              <datalist id="ciudades-mx">
                <option value="Toluca" /><option value="Monterrey" /><option value="Mérida" />
              </datalist>
              <button className="grid size-10 shrink-0 place-items-center text-primary" type="submit" aria-label="Buscar ciudad"><Search size={20} strokeWidth={1.75} /></button>
            </div>
          </form>
          <button className="mt-3 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-sm font-bold text-white hover:bg-primary-hover disabled:opacity-60" onClick={solicitar} disabled={buscando}>
            <LocateFixed size={19} strokeWidth={1.75} aria-hidden="true" /> {buscando ? 'Buscando ubicación…' : 'Usar mi ubicación actual'}
          </button>
          {error && <div className="mt-3"><Aviso error>{error}</Aviso></div>}
          <div className="mt-3 flex flex-wrap gap-2">
            {ejemplos.map((nombre) => (
              <Chip key={nombre} onClick={() => { setCiudad(nombre); cancelar(); consultar({ q: nombre }) }}>{nombre}</Chip>
            ))}
          </div>
          <fieldset className="mt-6">
            <legend className="mb-3 text-lg font-bold text-foreground">¿Qué espacio tienes?</legend>
            <div className="flex flex-wrap gap-2">
              {espacios.map(([valor, etiqueta]) => (
                <Chip key={valor} selected={espacio === valor} onClick={() => elegirEspacio(valor)}>{etiqueta}</Chip>
              ))}
            </div>
          </fieldset>
        </div>
        <figure className="hidden rounded-3xl bg-cream p-8 shadow-soft md:grid md:min-h-[23rem] md:place-items-center">
          <PlantasIlustracion className="w-full max-w-lg" />
        </figure>
      </section>
    </div>
  )
}
