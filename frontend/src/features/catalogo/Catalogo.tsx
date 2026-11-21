import { useQuery } from '@tanstack/react-query'
import { CircleCheck, CircleMinus, TriangleAlert } from 'lucide-react'
import { obtenerCatalogo } from '../../api/productosApi'

const moneda = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })
const estados = {
  OPTIMO: { texto: 'Buen momento de compra', Icono: CircleCheck, color: 'text-green-800' },
  NORMAL: { texto: 'Precio habitual', Icono: CircleMinus, color: 'text-amber-800' },
  ALTO: { texto: 'Precio elevado', Icono: TriangleAlert, color: 'text-red-800' },
}

export function Catalogo({ mes }: { mes: number }) {
  const catalogo = useQuery({
    queryKey: ['catalogo', mes],
    queryFn: () => obtenerCatalogo(mes),
  })

  if (catalogo.isPending) {
    return <p role="status">Cargando productos…</p>
  }

  if (catalogo.isError) {
    return <p role="alert">No se pudo cargar el catálogo.</p>
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {catalogo.data.map((producto) => {
        const { texto, Icono, color } = estados[producto.estadoMesActual]

        return (
          <li key={producto.id} className="rounded-xl border border-stone-200 bg-white p-4">
            <div className="flex items-center gap-3">
              <img src={producto.iconoUrl} alt="" width={40} height={40} />
              <div>
                <h2 className="font-semibold">{producto.nombre}</h2>
                <p>{moneda.format(producto.precioPromedioMes)} / {producto.unidad}</p>
              </div>
            </div>
            <p className={`mt-3 flex items-center gap-2 text-sm ${color}`}>
              <Icono size={16} aria-hidden="true" />
              {texto}
            </p>
          </li>
        )
      })}
    </ul>
  )
}
