const nombreCache = `quesiembro-datos-v1:${import.meta.env.BASE_URL}`
const maxEdad = 7 * 24 * 60 * 60 * 1000
const limite = 36
const copias = new WeakMap<object, number>()

export function fechaGuardada(datos: object | undefined) {
  return datos ? copias.get(datos) : undefined
}

export function clavePublica(url: URL) {
  if (url.username || url.password || url.searchParams.has('lat') || url.searchParams.has('lon')) return
  if (/\/api\/cultivos\/[a-z0-9_-]+$/i.test(url.pathname) && !url.search) return url.href
  const localidad = url.searchParams.get('q')?.trim()
  if (!url.pathname.endsWith('/api/recomendaciones') || !localidad) return
  // Guarda nombres de localidad y sus calificadores estatales, fuera de direcciones o texto libre.
  const partes = localidad.split(',')
  if (partes.length > 2 || partes.some((parte) => !/^[\p{L}][\p{L}\p{M} .’'-]{0,79}$/u.test(parte.trim()))) return
  if ([...url.searchParams.keys()].some((clave) => clave !== 'q' && clave !== 'mes')) return
  const clave = new URL(url)
  if (!clave.searchParams.has('mes')) {
    const hoy = new Date()
    clave.searchParams.set('mes', `actual-${hoy.getFullYear()}-${hoy.getMonth() + 1}`)
  }
  return clave.href
}

export async function guardarDatos(clave: string | undefined, datos: object, respuesta: Response) {
  if (!clave || !('caches' in globalThis)) return
  try {
    const cache = await caches.open(nombreCache)
    if (/\b(?:private|no-store)\b/i.test(respuesta.headers.get('Cache-Control') ?? '')) {
      await cache.delete(clave)
      return
    }
    await cache.put(clave, new Response(JSON.stringify(datos), { headers: { 'x-guardado-en': String(Date.now()) } }))
    const entradas = await cache.keys()
    await Promise.all(entradas.slice(0, Math.max(0, entradas.length - limite)).map((entrada) => cache.delete(entrada)))
  } catch {
    // El almacenamiento es opcional, incluso con cuotas agotadas o navegación privada.
  }
}

export async function recuperarDatos<T extends object>(clave: string | undefined, validar: (datos: unknown) => T) {
  if (!clave || !('caches' in globalThis)) return
  try {
    const cache = await caches.open(nombreCache)
    const respuesta = await cache.match(clave)
    if (!respuesta) return
    const fecha = Number(respuesta.headers.get('x-guardado-en'))
    if (fecha <= 0 || !Number.isFinite(fecha) || Date.now() - fecha > maxEdad) {
      await cache.delete(clave)
      return
    }
    const datos = validar(await respuesta.json())
    copias.set(datos, fecha)
    return datos
  } catch {
    return undefined
  }
}
