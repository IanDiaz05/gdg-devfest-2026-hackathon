import { useConexion } from '../pwa/conexion'
import { fechaGuardada } from '../pwa/datosGuardados'
import { modoDemo } from '../services/api'

const formato = new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short' })

export function EstadoDatos({ datos, actualizado, contexto }: { datos: object; actualizado: number; contexto?: string }) {
  const conectado = useConexion()
  const guardado = fechaGuardada(datos)
  if (modoDemo || (conectado && !guardado)) return null
  const fecha = guardado ?? actualizado
  return <p role="status" className="mb-4 rounded-xl border border-warning-border bg-warning-soft px-4 py-3 text-sm text-warning">
    {contexto && <strong>{contexto} · </strong>}Copia guardada · datos sin actualizar
    {fecha > 0 && <> desde <time dateTime={new Date(fecha).toISOString()}>{formato.format(fecha)}</time></>}.
  </p>
}
