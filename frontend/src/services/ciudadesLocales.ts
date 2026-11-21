import { ciudades } from '../../../backend/data/ciudades.json'
import type { SugerenciaCiudad } from '../types/api'
import { normalizar } from '../utils/consulta'

const comparar = new Intl.Collator('es-MX').compare
const catalogo = ciudades.map((ciudad) => ({
  ciudad,
  nombre: ciudad.busqueda,
  estado: normalizar(ciudad.estado),
})).sort((a, b) => comparar(a.nombre, b.nombre) || comparar(a.estado, b.estado)
  || b.ciudad.poblacion - a.ciudad.poblacion)

const coincide = (valor: string, texto: string) => valor.startsWith(texto) || valor.includes(` ${texto}`)

export function sugerirCiudadesLocales(q: string, limite: number): SugerenciaCiudad[] {
  const [texto, estado = ''] = q.split(',').map(normalizar)
  const grupos: SugerenciaCiudad[][] = [[], [], []]
  const vistas = new Set<string>()

  for (const entrada of catalogo) {
    if (!coincide(entrada.estado, estado)) continue
    const orden = entrada.nombre.startsWith(texto) ? 0
      : coincide(entrada.nombre, texto) ? 1
      : !estado && coincide(entrada.estado, texto) ? 2 : -1
    if (orden === -1) continue

    const { nombre, municipio, lat, lon, estado: estadoCiudad } = entrada.ciudad
    const etiqueta = `${nombre}, ${estadoCiudad}`
    if (vistas.has(etiqueta)) continue
    vistas.add(etiqueta)
    grupos[orden].push({ nombre, municipio: municipio || nombre, estado: estadoCiudad, etiqueta, lat, lon })
  }

  return grupos.flat().slice(0, limite)
}
