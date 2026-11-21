import { useQuery } from '@tanstack/react-query'
import { obtenerAlertas } from '../services/api'
import type { Ubicacion } from '../types/api'

/** Pronóstico de 7 días de la zona, con su propia carga (la página no espera por él). */
export function useAlertas(ubicacion: Ubicacion | undefined, activo = true) {
  return useQuery({
    queryKey: ['alertas', ubicacion],
    queryFn: ({ signal }) => {
      if (!ubicacion) throw new Error('Selecciona una zona para continuar.')
      return obtenerAlertas(ubicacion, signal)
    },
    enabled: Boolean(ubicacion) && activo,
    retry: 1,
    staleTime: 30 * 60 * 1000, // el backend lo guarda 1 hora
    refetchOnReconnect: true,
  })
}
