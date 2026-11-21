import { useQuery } from '@tanstack/react-query'
import { obtenerFicha } from '../services/api'

export function useCultivoDetalle(id: string) {
  return useQuery({
    queryKey: ['ficha', id],
    queryFn: ({ signal }) => obtenerFicha(id, signal),
    retry: false,
  })
}
