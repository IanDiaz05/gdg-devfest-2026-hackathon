import type { ProductoResumen } from '../types/agricola'

type ProductoMock = {
  id: string
  nombre: string
  categoria: ProductoResumen['categoria']
  icono: string
  preciosMensuales: readonly number[]
}

// Precios simulados en MXN/kg, de enero a diciembre.
export const mockProductos: readonly ProductoMock[] = [
  {
    id: 'jitomate',
    nombre: 'Jitomate',
    categoria: 'VERDURAS',
    icono: '🍅',
    preciosMensuales: [36, 34, 29, 24, 20, 18, 19, 22, 25, 28, 30, 35],
  },
  {
    id: 'cebolla',
    nombre: 'Cebolla',
    categoria: 'VERDURAS',
    icono: '🧅',
    preciosMensuales: [27, 24, 20, 18, 17, 19, 21, 24, 26, 29, 30, 29],
  },
  {
    id: 'platano',
    nombre: 'Plátano',
    categoria: 'FRUTAS',
    icono: '🍌',
    preciosMensuales: [23, 22, 21, 19, 17, 16, 16, 17, 18, 20, 22, 23],
  },
  {
    id: 'limon',
    nombre: 'Limón',
    categoria: 'FRUTAS',
    icono: '🍋',
    preciosMensuales: [31, 39, 46, 44, 37, 30, 25, 23, 22, 24, 26, 29],
  },
  {
    id: 'frijol',
    nombre: 'Frijol negro',
    categoria: 'ESPECIAS_GRANOS',
    icono: '🫘',
    preciosMensuales: [34, 34, 35, 36, 38, 40, 41, 40, 38, 36, 35, 34],
  },
]
