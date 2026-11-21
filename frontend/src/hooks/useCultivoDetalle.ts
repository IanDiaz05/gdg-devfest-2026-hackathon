import { fechaGuardada } from '../pwa/datosGuardados'
import { useQuery } from '@tanstack/react-query'
import { obtenerFicha } from '../services/api'

export function useCultivoDetalle(id: string) {
  return useQuery({
    queryKey: ['ficha', id],
    queryFn: ({ signal }) => obtenerFicha(id, signal),
    retry: false,
    networkMode: 'always',
    structuralSharing: false,
    staleTime: (query) => fechaGuardada(query.state.data) ? 0 : 30 * 60 * 1000,
    refetchOnReconnect: true,
  })
}
