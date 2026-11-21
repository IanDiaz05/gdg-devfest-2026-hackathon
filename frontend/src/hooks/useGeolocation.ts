import { useEffect, useRef, useState } from 'react'
import type { Ubicacion } from '../types/api'

export function useGeolocation(alEncontrar: (ubicacion: Ubicacion) => void) {
  const [buscando, setBuscando] = useState(false)
  const [error, setError] = useState('')
  const solicitud = useRef(0)

  useEffect(() => () => { solicitud.current += 1 }, [])

  function cancelar() {
    solicitud.current += 1
    setBuscando(false)
    setError('')
  }

  function solicitar() {
    setError('')
    if (!navigator.geolocation) {
      setError('Tu navegador no permite compartir la ubicación. Busca tu ciudad manualmente.')
      return
    }

    const id = ++solicitud.current
    setBuscando(true)
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      if (id !== solicitud.current) return
      setBuscando(false)
      // Tres decimales conservan unos 110 m de resolución sin enviar el GPS exacto.
      alEncontrar({ lat: Number(coords.latitude.toFixed(3)), lon: Number(coords.longitude.toFixed(3)) })
    }, ({ code }) => {
      if (id !== solicitud.current) return
      setBuscando(false)
      setError(code === 1
        ? 'El permiso de ubicación está desactivado. Puedes escribir tu ciudad.'
        : 'No pudimos obtener tu ubicación. Puedes escribir tu ciudad.')
    }, { timeout: 10_000, maximumAge: 60_000 })
  }

  return { solicitar, cancelar, buscando, error }
}
