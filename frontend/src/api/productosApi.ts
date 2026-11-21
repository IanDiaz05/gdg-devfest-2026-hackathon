import type { ProductoResumen } from '../types/agricola'
import { mockProductos } from './mockProductos'

export async function obtenerCatalogo(mes: number): Promise<ProductoResumen[]> {
  if (!Number.isInteger(mes) || mes < 1 || mes > 12) {
    throw new RangeError('El mes debe ser un entero entre 1 y 12.')
  }

  return mockProductos.map(({ id, nombre, categoria, icono, preciosMensuales }) => {
    const precioPromedioMes = preciosMensuales[mes - 1]
    const promedioAnual = preciosMensuales.reduce((total, precio) => total + precio, 0)
      / preciosMensuales.length
    const variacionPorcentualAnual = ((precioPromedioMes / promedioAnual) - 1) * 100

    // Umbrales provisionales para los datos simulados.
    let estadoMesActual: ProductoResumen['estadoMesActual'] = 'NORMAL'
    if (variacionPorcentualAnual <= -10) estadoMesActual = 'OPTIMO'
    if (variacionPorcentualAnual >= 10) estadoMesActual = 'ALTO'

    return {
      id,
      nombre,
      categoria,
      unidad: 'kg',
      iconoUrl: `data:image/svg+xml,${encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><text x="2" y="37" font-size="38">${icono}</text></svg>`,
      )}`,
      estadoMesActual,
      precioPromedioMes,
      variacionPorcentualAnual,
    }
  })
}
