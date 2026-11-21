import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { obtenerDiagnostico } from '../services/api'
import { leerMes, leerUbicacion } from '../utils/consulta'

const claveDiagnostico = (ubicacion: ReturnType<typeof leerUbicacion>, mes: number | undefined) => ['diagnostico', ubicacion, mes] as const

export function useRecomendaciones() {
  const [params] = useSearchParams()
  const ubicacion = leerUbicacion(params)
  const mes = leerMes(params)
  const consulta = useQuery({
    queryKey: claveDiagnostico(ubicacion, mes),
    queryFn: ({ signal }) => {
      if (!ubicacion) throw new Error('Selecciona una zona para continuar.')
      return obtenerDiagnostico(ubicacion, mes, signal)
    },
    enabled: Boolean(ubicacion),
    retry: false,
  })

  return { consulta, ubicacion, busqueda: params.toString() }
}
