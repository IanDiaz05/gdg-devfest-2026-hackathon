import type { Ubicacion } from '../types/api'

export const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

export function leerUbicacion(params: URLSearchParams): Ubicacion | undefined {
  const q = params.get('q')?.trim()

  const lat = params.get('lat')
  const lon = params.get('lon')
  if (lat?.trim() && lon?.trim() && Math.abs(Number(lat)) <= 90 && Math.abs(Number(lon)) <= 180) {
    return { lat: Number(lat), lon: Number(lon) }
  }
  if (q) return { q }
}

export function parametros(ubicacion: Ubicacion, mes?: number): URLSearchParams {
  const params = new URLSearchParams()
  if (mes !== undefined) params.set('mes', String(mes))
  if ('q' in ubicacion) {
    params.set('q', ubicacion.q)
  } else {
    params.set('lat', String(ubicacion.lat))
    params.set('lon', String(ubicacion.lon))
  }
  return params
}

export function leerMes(params: URLSearchParams) {
  const mes = Number(params.get('mes'))
  return esMes(mes) ? mes : undefined
}

export function esMes(valor: unknown): valor is number {
  return typeof valor === 'number' && Number.isInteger(valor) && valor >= 1 && valor <= 12
}

export const normalizar = (texto: string) => texto.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase('es-MX').trim()

export const espacios = [
  ['', 'Todo espacio'],
  ['maceta_chica', 'Maceta chica'],
  ['maceta_grande', 'Maceta grande'],
  ['patio', 'Patio'],
] as const

export const formatoNumero = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 1 })

const claveEspacio = 'quesiembro-espacio'

export function leerEspacio(valor: string | null) {
  let preferencia = valor
  if (preferencia === null) {
    try {
      preferencia = sessionStorage.getItem(claveEspacio)
    } catch {
      // La navegación todavía conserva el filtro en la URL.
    }
  }
  return espacios.find(([id]) => id === preferencia)?.[0] ?? ''
}

export function guardarEspacio(valor: string) {
  try {
    sessionStorage.setItem(claveEspacio, valor)
  } catch {
    // La navegación todavía conserva el filtro en la URL.
  }
}
