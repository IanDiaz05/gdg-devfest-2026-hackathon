import { Link } from 'react-router-dom'
import { ErrorApi } from '../services/api'
import { Aviso } from './Interfaz'

export function ErrorConsulta({ error, reintentar, busqueda, ficha = false }: {
  error: Error
  reintentar: () => void
  busqueda: string
  ficha?: boolean
}) {
  if (error instanceof ErrorApi && error.status === 404) {
    return <Aviso>
      {error.message}{' '}
      <Link className="font-bold underline underline-offset-4" to={{ pathname: ficha ? '/zona' : '/', search: busqueda }}>
        {ficha ? 'Volver a los cultivos' : 'Buscar otra ubicación'}
      </Link>
    </Aviso>
  }

  const saturado = error instanceof ErrorApi && error.status === 503
  return <Aviso error reintentar={reintentar}>
    {saturado && <strong className="block">Servicio meteorológico saturado</strong>}
    {error.message}
    {saturado && error.reintentarEnS !== undefined && <span className="mt-1 block">Intenta de nuevo en {error.reintentarEnS} s.</span>}
  </Aviso>
}
