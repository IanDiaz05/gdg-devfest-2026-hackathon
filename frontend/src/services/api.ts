import type { Ubicacion } from '../types/api'
import { parametros } from '../utils/consulta'
import { objeto, validarDiagnostico, validarFicha } from './validacion'

const baseUrl = (import.meta.env.VITE_API_BASE_URL ?? '').trim().replace(/\/+$/, '')
export const modoDemo = import.meta.env.VITE_USE_MOCKS === 'true'
  || (import.meta.env.VITE_USE_MOCKS !== 'false' && !baseUrl)

export class ErrorApi extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly codigo?: string,
    readonly reintentarEnS?: number,
  ) {
    super(message)
  }
}

async function pedir<T>(ruta: string, signal: AbortSignal, validar: (datos: unknown) => T): Promise<T> {
  let respuesta: Response
  try {
    respuesta = await fetch(`${baseUrl}${ruta}`, { signal, headers: { Accept: 'application/json' } })
  } catch (error) {
    if (signal.aborted) throw error
    throw new Error('No pudimos conectarnos al servicio. Revisa tu conexión e inténtalo de nuevo.')
  }

  const datos: unknown = await respuesta.json().catch(() => undefined)
  signal.throwIfAborted()

  if (!respuesta.ok) {
    const cuerpo = objeto(datos)
    const detalle = objeto(cuerpo?.detail) ?? cuerpo
    const codigo = typeof detalle?.error === 'string' ? detalle.error : undefined
    const segundos = detalle?.reintentar_en_s
    const mensaje = typeof detalle?.detail === 'string' ? detalle.detail
      : respuesta.status === 404 ? 'No encontramos resultados para esta consulta.'
      : respuesta.status === 503 ? 'El servicio meteorológico está saturado.'
      : 'El servicio no pudo completar la consulta. Inténtalo de nuevo.'
    throw new ErrorApi(mensaje, respuesta.status, codigo, typeof segundos === 'number' && Number.isFinite(segundos) && segundos >= 0 ? segundos : undefined)
  }

  return validar(datos)
}

export async function obtenerDiagnostico(ubicacion: Ubicacion, mes: number | undefined, signal: AbortSignal) {
  const resultado = modoDemo
    ? (await import('../mocks/recomendaciones.mock')).diagnosticoDemo(ubicacion, mes)
    : await pedir(`/api/recomendaciones?${parametros(ubicacion, mes)}`, signal, validarDiagnostico)
  signal.throwIfAborted()
  if (mes !== undefined && resultado.clima_zona.mes_evaluado !== mes) {
    throw new Error('El servicio devolvió datos para un mes distinto al solicitado.')
  }
  return resultado
}

export async function obtenerFicha(id: string, signal: AbortSignal) {
  const resultado = modoDemo
    ? (await import('../mocks/recomendaciones.mock')).fichaDemo(id)
    : await pedir(`/api/cultivos/${encodeURIComponent(id)}`, signal, validarFicha)
  signal.throwIfAborted()
  if (resultado.id !== id) throw new Error('El servicio devolvió la ficha de otro cultivo.')
  return resultado
}
