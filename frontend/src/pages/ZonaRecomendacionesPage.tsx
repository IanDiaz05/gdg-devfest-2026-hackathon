import { useConexion } from '../pwa/conexion'
import { fechaGuardada } from '../pwa/datosGuardados'
import { EstadoDatos } from '../components/EstadoDatos'
import { useSearchParams } from 'react-router-dom'
import { AlertasClima } from '../components/AlertasClima'
import { CultivosRecomendados, TarjetaCultivo } from '../components/CultivosRecomendados'
import { ErrorConsulta } from '../components/ErrorConsulta'
import { BarraUbicacion } from '../components/BarraUbicacion'
import { ClimaCard } from '../components/ClimaCard'
import { CargaPantalla, ElegirZona } from '../components/Interfaz'
import { SelectorLocalidad } from '../components/SelectorLocalidad'
import { useAlertas } from '../hooks/useAlertas'
import { useRecomendaciones } from '../hooks/useRecomendaciones'
import type { Recomendacion, Ubicacion } from '../types/api'
import { parametros } from '../utils/consulta'

const prioridad = (cultivo: Recomendacion) => Number(cultivo.estado === 'optimo') * 4
  + Number(cultivo.finanzas_sniim?.destacar_ahorro === true) * 2 + Number(cultivo.estado === 'con_cuidados')

export function ZonaRecomendacionesPage() {
  const { consulta, ubicacion, busqueda } = useRecomendaciones()
  const conectado = useConexion()
  const [params, setParams] = useSearchParams()
  // Las alertas se piden al mismo tiempo que las recomendaciones, pero cada una se muestra cuando llega
  const pronostico = useAlertas(ubicacion, conectado)

  if (!ubicacion) return <ElegirZona />
  if (consulta.isPending) return <CargaPantalla mensaje="Consultando el clima histórico…" />
  if (consulta.isError) return <ErrorConsulta error={consulta.error} busqueda={busqueda} reintentar={() => void consulta.refetch()} />

  const { ubicacion: zona, clima_zona: clima, cultivos } = consulta.data
  const enLinea = conectado && !fechaGuardada(consulta.data)
  const destacados = [...cultivos].filter((cultivo) => cultivo.estado !== 'no_ahora')
    .sort((a, b) => prioridad(b) - prioridad(a)).slice(0, 4)

  function cambiar(lugar: Ubicacion, mes: number) {
    const siguiente = parametros(lugar, mes)
    const espacio = params.get('espacio')
    if (espacio !== null) siguiente.set('espacio', espacio)
    setParams(siguiente)
  }

  return <div className="w-full">
    <EstadoDatos datos={consulta.data} actualizado={consulta.dataUpdatedAt} />
    <h1 className="sr-only">Tu zona</h1>
    <div className="mb-4">
      <BarraUbicacion ubicacion={zona} mes={clima.mes_evaluado} busqueda={busqueda} onMes={(mes) => cambiar(ubicacion, mes)} />
    </div>
    <SelectorLocalidad alternativas={zona.alternativas} elegir={({ lat, lon }) => cambiar({ lat, lon }, clima.mes_evaluado)} />
    <div className={enLinea ? 'grid gap-5 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]' : undefined}>
      <ClimaCard clima={clima} altitud={zona.altitud_m} />
      {/* Si /api/alertas falla, se usan las alertas guardadas que ya vienen con las recomendaciones */}
      {enLinea && <AlertasClima alertas={pronostico.isError ? consulta.data.alertas_7_dias : pronostico.data?.alertas_7_dias}
        cargando={pronostico.isPending && !pronostico.isError} />}
    </div>

    {destacados.length > 0 && <section className="mt-8" aria-labelledby="destacados">
      <h2 id="destacados" className="mb-4 text-2xl font-bold tracking-tight">Recomendaciones de {clima.mes_nombre.toLocaleLowerCase('es-MX')} en {zona.nombre}</h2>
      {destacados.length > 1 && <p id="guia-destacados" className="mb-2 text-sm text-muted-foreground">Desliza la lista o usa las flechas del teclado para explorar.</p>}
      <ul tabIndex={destacados.length > 1 ? 0 : undefined} aria-describedby={destacados.length > 1 ? 'guia-destacados' : undefined} className="grid auto-cols-[min(83%,20rem)] grid-flow-col snap-x gap-3 overflow-x-auto p-1 pb-3 lg:grid-flow-row lg:grid-cols-2 xl:grid-cols-4">
        {destacados.map((cultivo) => <li key={cultivo.id} className="snap-start"><TarjetaCultivo cultivo={cultivo} busqueda={busqueda} destacada /></li>)}
      </ul>
    </section>}

    <CultivosRecomendados cultivos={cultivos} busqueda={busqueda} />
  </div>
}
