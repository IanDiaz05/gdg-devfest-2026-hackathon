import { clavePublica, guardarDatos, recuperarDatos } from '../pwa/datosGuardados'
import { ErrorApi } from './ErrorApi'
import type { RespuestaAlertas, SugerenciaCiudad, Ubicacion } from '../types/api'
import { normalizar, parametros } from '../utils/consulta'
import { objeto, validarAlertas, validarDiagnostico, validarFicha, validarSugerencias } from './validacion'

const baseUrl = (import.meta.env.VITE_API_BASE_URL ?? '').trim().replace(/\/+$/, '')
export const modoDemo = import.meta.env.VITE_USE_MOCKS === 'true'

async function pedir<T extends object>(ruta: string, signal: AbortSignal, validar: (datos: unknown) => T): Promise<T> {
  const clave = import.meta.env.PROD && typeof window !== 'undefined'
    ? clavePublica(new URL(`${baseUrl}${ruta}`, window.location.href))
    : undefined
  let respuesta: Response
  try {
    respuesta = await fetch(`${baseUrl}${ruta}`, { signal, headers: { Accept: 'application/json' } })
  } catch (error) {
    if (signal.aborted) throw error
    const guardado = await recuperarDatos(clave, validar)
    signal.throwIfAborted()
    if (guardado) return guardado
    throw new Error('No pudimos conectarnos al servicio y no hay una copia guardada de esta consulta.')
  }

  const datos: unknown = await respuesta.json().catch(() => undefined)
  signal.throwIfAborted()

  if (!respuesta.ok) {
    const cuerpo = objeto(datos)
    const detalle = objeto(cuerpo?.detail) ?? cuerpo
    const codigo = typeof detalle?.error === 'string' ? detalle.error : undefined
    const segundos = detalle?.reintentar_en_s
    const mensaje = typeof detalle?.detail === 'string' ? detalle.detail
      : respuesta.status === 400 || respuesta.status === 422 ? 'Revisa la ciudad, las coordenadas o el mes de consulta.'
      : respuesta.status === 404 ? 'No encontramos resultados para esta consulta.'
      : respuesta.status === 503 ? 'El servicio meteorológico está saturado.'
      : 'El servicio no pudo completar la consulta. Inténtalo de nuevo.'
    throw new ErrorApi(mensaje, respuesta.status, codigo, typeof segundos === 'number' && Number.isFinite(segundos) && segundos >= 0 ? segundos : undefined)
  }

  const resultado = validar(datos)
  await guardarDatos(clave, resultado, respuesta)
  return resultado
}

/** Alertas de 7 días de la zona (`GET /api/alertas`). Se piden aparte para mostrarlas con su propio "cargando". */
export async function obtenerAlertas(ubicacion: Ubicacion, signal: AbortSignal): Promise<RespuestaAlertas> {
  if (modoDemo) {
    const demo = (await import('../mocks/recomendaciones.mock')).diagnosticoDemo(ubicacion)
    const { nombre, estado, lat, lon } = demo.ubicacion
    return { ubicacion: { nombre, estado, lat, lon }, alertas_7_dias: demo.alertas_7_dias, desde_cache: true }
  }
  return pedir(`/api/alertas?${parametros(ubicacion)}`, signal, validarAlertas)
}

export async function obtenerDiagnostico(ubicacion: Ubicacion, mes: number | undefined, signal: AbortSignal) {
  if (modoDemo && typeof navigator !== 'undefined' && navigator.onLine === false) {
    throw new Error('Conéctate para abrir una nueva consulta.')
  }
  const resultado = modoDemo
    ? (await import('../mocks/recomendaciones.mock')).diagnosticoDemo(ubicacion, mes)
    : await pedir(`/api/recomendaciones?${parametros(ubicacion, mes)}`, signal, validarDiagnostico)
  signal.throwIfAborted()
  if (mes !== undefined && resultado.clima_zona.mes_evaluado !== mes) {
    throw new Error('El servicio devolvió datos para un mes distinto al solicitado.')
  }
  return resultado
}

const ciudadesDemo: SugerenciaCiudad[] = [
  { nombre: 'Mérida', estado: 'Yucatán', municipio: 'Mérida', etiqueta: 'Mérida, Yucatán', lat: 20.97, lon: -89.62 },
  { nombre: 'Monterrey', estado: 'Nuevo León', municipio: 'Monterrey', etiqueta: 'Monterrey, Nuevo León', lat: 25.67, lon: -100.31 },
  { nombre: 'Toluca', estado: 'Estado de México', municipio: 'Toluca', etiqueta: 'Toluca, Estado de México', lat: 19.29, lon: -99.66 },
]

/** Sugerencias del buscador: sin texto, las primeras en orden alfabético; con texto, las que coinciden. */
export async function sugerirCiudades(texto: string, signal: AbortSignal): Promise<SugerenciaCiudad[]> {
  const q = texto.trim()
  if (modoDemo) {
    const buscado = normalizar(q.split(',')[0] ?? '')
    return ciudadesDemo.filter((ciudad) => normalizar(ciudad.etiqueta).includes(buscado))
  }
  const consulta = new URLSearchParams({ limite: '10' })
  if (q) consulta.set('q', q)
  try {
    return await pedir(`/api/ciudades?${consulta}`, signal, validarSugerencias)
  } catch (error) {
    if (!(error instanceof ErrorApi) || error.status !== 404) throw error
    const { sugerirCiudadesLocales } = await import('./ciudadesLocales')
    signal.throwIfAborted()
    return sugerirCiudadesLocales(q, 10)
  }
}

export async function obtenerFicha(id: string, signal: AbortSignal) {
  if (modoDemo && typeof navigator !== 'undefined' && navigator.onLine === false) {
    throw new Error('Conéctate para abrir una nueva consulta.')
  }
  const resultado = modoDemo
    ? (await import('../mocks/recomendaciones.mock')).fichaDemo(id)
    : await pedir(`/api/cultivos/${encodeURIComponent(id)}`, signal, validarFicha)
  signal.throwIfAborted()
  if (resultado.id !== id) throw new Error('El servicio devolvió la ficha de otro cultivo.')
  return resultado
}
