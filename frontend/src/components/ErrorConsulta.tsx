import { useConexion } from '../pwa/conexion'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ErrorApi } from '../services/ErrorApi'
import { Aviso } from './Interfaz'

export function ErrorConsulta({ error, reintentar, busqueda, ficha = false }: {
  error: Error
  reintentar: () => void
  busqueda: string
  ficha?: boolean
}) {
  const conectado = useConexion()
  const saturado = error instanceof ErrorApi && error.status === 503
  const habilitarEn = saturado ? error.recibidoEn + (error.reintentarEnS ?? 0) * 1000 : 0
  const [momento, setMomento] = useState(Date.now)
  const bloqueado = momento < habilitarEn

  useEffect(() => {
    if (!habilitarEn) return
    const timer = window.setTimeout(() => setMomento(Date.now()), Math.max(0, habilitarEn - Date.now()))
    return () => window.clearTimeout(timer)
  }, [habilitarEn])

  if (error instanceof ErrorApi && error.status === 404) {
    return <Aviso>
      {error.message}{' '}
      <Link className="font-bold underline underline-offset-4" to={{ pathname: ficha ? '/zona' : '/', search: busqueda }}>
        {ficha ? 'Volver a los cultivos' : 'Buscar otra ubicación'}
      </Link>
    </Aviso>
  }

  return <Aviso error reintentar={reintentar} reintentoBloqueado={bloqueado || !conectado}>
    {saturado && <strong className="block">Servicio meteorológico saturado</strong>}
    {error.message}
    {bloqueado && <span className="mt-1 block">Puedes reintentar en cuanto termine la espera de {saturado && error.reintentarEnS} s.</span>}
  </Aviso>
}
