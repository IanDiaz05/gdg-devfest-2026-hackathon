import { useSyncExternalStore } from 'react'

function suscribir(notificar: () => void) {
  window.addEventListener('online', notificar)
  window.addEventListener('offline', notificar)
  return () => {
    window.removeEventListener('online', notificar)
    window.removeEventListener('offline', notificar)
  }
}

export function useConexion() {
  return useSyncExternalStore(suscribir, () => navigator.onLine, () => true)
}
