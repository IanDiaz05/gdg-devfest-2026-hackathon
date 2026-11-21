import { RefreshCw, WifiOff } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useConexion } from '../pwa/conexion'

/**
 * Registra el service worker y muestra los avisos de "sin conexión" y "nueva versión".
 * El botón de instalar vive en la barra de navegación (BotonInstalar).
 */
export function ControlesPwa() {
  const conectado = useConexion()
  const [actualizacion, setActualizacion] = useState<ServiceWorker>()
  const [aplicando, setAplicando] = useState(false)

  useEffect(() => {
    if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return
    const worker = navigator.serviceWorker
    let activa = true
    let registro: ServiceWorkerRegistration | undefined
    let instalando: ServiceWorker | null = null
    const mostrar = () => {
      if (activa && registro?.waiting && worker.controller) setActualizacion(registro.waiting)
    }
    const observar = () => {
      instalando?.removeEventListener('statechange', mostrar)
      instalando = registro?.installing ?? null
      instalando?.addEventListener('statechange', mostrar)
      mostrar()
    }
    let controlada = Boolean(worker.controller)
    const cambiarControlador = () => {
      if (controlada) location.reload()
      controlada = true
    }
    worker.addEventListener('controllerchange', cambiarControlador)
    const revisar = () => {
      if (!document.hidden && navigator.onLine) void registro?.update().catch(() => {})
    }
    document.addEventListener('visibilitychange', revisar)
    window.addEventListener('online', revisar)
    void worker.register(`${import.meta.env.BASE_URL}sw.js`, { updateViaCache: 'none' }).then((resultado) => {
      if (!activa) return
      registro = resultado
      registro.addEventListener('updatefound', observar)
      observar()
    }).catch(() => {})
    return () => {
      activa = false
      worker.removeEventListener('controllerchange', cambiarControlador)
      document.removeEventListener('visibilitychange', revisar)
      window.removeEventListener('online', revisar)
      registro?.removeEventListener('updatefound', observar)
      instalando?.removeEventListener('statechange', mostrar)
    }
  }, [])

  if (conectado && !actualizacion) return null

  return <div className="app-frame space-y-2">
    {!conectado && <p role="status" className="flex items-center gap-2 rounded-xl bg-warning-soft px-4 py-3 text-sm font-medium text-warning">
      <WifiOff size={18} className="shrink-0" aria-hidden="true" /> Sin conexión. Puedes consultar datos guardados en este dispositivo.
    </p>}
    {actualizacion && <div className="surface flex flex-wrap items-center justify-between gap-2 px-4 py-2">
      <p role="status" className="text-sm font-semibold">{aplicando ? 'Actualizando QUESIEMBRO…' : 'Hay una nueva versión disponible.'}</p>
      <button type="button" className="app-button" disabled={aplicando} onClick={() => {
        setAplicando(true)
        actualizacion.postMessage('ACTUALIZAR')
      }}><RefreshCw size={16} aria-hidden="true" /> Actualizar</button>
    </div>}
  </div>
}
