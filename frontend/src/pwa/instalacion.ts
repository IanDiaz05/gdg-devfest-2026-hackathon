import { useSyncExternalStore } from 'react'

/**
 * Estado de "instalar la app" compartido por toda la página. El aviso del navegador
 * (beforeinstallprompt) llega una sola vez y puede llegar antes de que React monte, por eso se
 * escucha aquí, al cargar el módulo, y no dentro de un componente.
 */
interface EventoInstalacion extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

interface Estado {
  evento?: EventoInstalacion
  instalada: boolean
}

const enNavegador = typeof window !== 'undefined'
export const esIos = enNavegador && (/iPhone|iPad|iPod/.test(navigator.userAgent)
  || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1))

let estado: Estado = {
  instalada: enNavegador && (matchMedia('(display-mode: standalone)').matches
    || Boolean((navigator as Navigator & { standalone?: boolean }).standalone)),
}
const oyentes = new Set<() => void>()

function cambiar(parcial: Partial<Estado>) {
  estado = { ...estado, ...parcial }
  oyentes.forEach((oyente) => oyente())
}

// Solo en producción hay service worker, que es lo que hace instalable a la app
if (enNavegador && import.meta.env.PROD) {
  window.addEventListener('beforeinstallprompt', (evento) => {
    evento.preventDefault()
    cambiar({ evento: evento as EventoInstalacion })
  })
  window.addEventListener('appinstalled', () => cambiar({ evento: undefined, instalada: true }))
}

function suscribir(oyente: () => void) {
  oyentes.add(oyente)
  return () => { oyentes.delete(oyente) }
}

/** Abre el diálogo de instalación. Devuelve false si el navegador no lo ofrece (hay que dar instrucciones). */
export async function instalar(): Promise<boolean> {
  const { evento } = estado
  if (!evento) return false
  try {
    await evento.prompt()
    if ((await evento.userChoice).outcome === 'accepted') cambiar({ instalada: true })
    return true
  } catch {
    return false
  } finally {
    cambiar({ evento: undefined })
  }
}

export function useInstalacion() {
  const actual = useSyncExternalStore(suscribir, () => estado, () => estado)
  return {
    ...actual,
    /** Se muestra el botón si la app no está instalada y hay forma de instalarla (diálogo o, en iPhone, instrucciones). */
    disponible: import.meta.env.PROD && !actual.instalada && (Boolean(actual.evento) || esIos),
  }
}
