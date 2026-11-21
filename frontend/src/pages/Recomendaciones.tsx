import { Link } from 'react-router-dom'
import { CultivosRecomendados } from '../components/CultivosRecomendados'
import { ErrorConsulta } from '../components/ErrorConsulta'
import { CargaPantalla, ElegirZona, TituloPagina } from '../components/Interfaz'
import { useRecomendaciones } from '../hooks/useRecomendaciones'

export function Recomendaciones() {
  const { consulta, ubicacion, busqueda } = useRecomendaciones()

  if (!ubicacion) return <ElegirZona />
  if (consulta.isPending) return <CargaPantalla mensaje="Buscando recomendaciones de siembra…" />
  if (consulta.isError) return <ErrorConsulta error={consulta.error} busqueda={busqueda} reintentar={() => void consulta.refetch()} />

  const { clima_zona: clima, cultivos, ubicacion: zona } = consulta.data
  return <div className="mx-auto max-w-md md:max-w-none">
    <TituloPagina etiqueta={zona.nombre} titulo={`Recomendaciones de ${clima.mes_nombre.toLocaleLowerCase('es-MX')}`} />
    <Link className="mt-3 inline-flex min-h-11 items-center text-sm font-bold text-primary underline underline-offset-4" to={{ pathname: '/zona', search: busqueda }}>Ver clima de tu zona</Link>
    <CultivosRecomendados cultivos={cultivos} busqueda={busqueda} />
  </div>
}
