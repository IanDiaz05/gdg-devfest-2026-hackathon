import { useSearchParams } from 'react-router-dom'
import { AlertasClima } from '../components/AlertasClima'
import { CultivosRecomendados, TarjetaCultivo } from '../components/CultivosRecomendados'
import { ErrorConsulta } from '../components/ErrorConsulta'
import { BarraUbicacion } from '../components/BarraUbicacion'
import { ClimaCard } from '../components/ClimaCard'
import { CargaPantalla, ElegirZona } from '../components/Interfaz'
import { SelectorLocalidad } from '../components/SelectorLocalidad'
import { useRecomendaciones } from '../hooks/useRecomendaciones'
import type { Recomendacion, Ubicacion } from '../types/api'
import { parametros } from '../utils/consulta'

const prioridad = (cultivo: Recomendacion) => Number(cultivo.estado === 'optimo') * 4
  + Number(cultivo.finanzas_sniim?.destacar_ahorro === true) * 2 + Number(cultivo.estado === 'con_cuidados')

export function ZonaRecomendacionesPage() {
  const { consulta, ubicacion, busqueda } = useRecomendaciones()
  const [params, setParams] = useSearchParams()

  if (!ubicacion) return <ElegirZona />
  if (consulta.isPending) return <CargaPantalla mensaje="Consultando el clima histórico…" />
  if (consulta.isError) return <ErrorConsulta error={consulta.error} busqueda={busqueda} reintentar={() => void consulta.refetch()} />

  const { ubicacion: zona, clima_zona: clima, alertas_7_dias: alertas, cultivos } = consulta.data
  const destacados = [...cultivos].filter((cultivo) => prioridad(cultivo) > 0)
    .sort((a, b) => prioridad(b) - prioridad(a)).slice(0, 4)

  function cambiar(lugar: Ubicacion, mes: number) {
    const siguiente = parametros(lugar, mes)
    const espacio = params.get('espacio')
    if (espacio !== null) siguiente.set('espacio', espacio)
    setParams(siguiente)
  }

  return <div className="mx-auto max-w-md md:max-w-none">
    <h1 className="sr-only">Tu zona</h1>
    <div className="mb-4">
      <BarraUbicacion ubicacion={zona} mes={clima.mes_evaluado} busqueda={busqueda} onMes={(mes) => cambiar(ubicacion, mes)} />
    </div>
    <SelectorLocalidad alternativas={zona.alternativas} elegir={({ lat, lon }) => cambiar({ lat, lon }, clima.mes_evaluado)} />
    <AlertasClima alertas={alertas} />

    <ClimaCard clima={clima} altitud={zona.altitud_m} />

    {destacados.length > 0 && <section className="mt-8" aria-labelledby="destacados">
      <h2 id="destacados" className="mb-4 text-2xl font-bold tracking-tight">Destacados de {clima.mes_nombre.toLocaleLowerCase('es-MX')}</h2>
      <ul className="grid auto-cols-[min(82vw,19rem)] grid-flow-col gap-3 overflow-x-auto pb-3 snap-x">
        {destacados.map((cultivo) => <li key={cultivo.id} className="snap-start"><TarjetaCultivo cultivo={cultivo} busqueda={busqueda} destacada /></li>)}
      </ul>
    </section>}

    <CultivosRecomendados cultivos={cultivos} busqueda={busqueda} />
  </div>
}
