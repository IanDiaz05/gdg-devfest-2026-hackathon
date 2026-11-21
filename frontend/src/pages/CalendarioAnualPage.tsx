import { EstadoDatos } from '../components/EstadoDatos'
import { useState } from 'react'
import { ErrorConsulta } from '../components/ErrorConsulta'
import { FiltroEspacio, estiloControl, useFiltroEspacio } from '../components/FiltrosCultivos'
import { CambiarZona } from '../components/CambiarZona'
import { Aviso, CargaPantalla, TituloPagina } from '../components/Interfaz'
import { RuedaAnual } from '../components/RuedaAnual'
import { useRecomendaciones } from '../hooks/useRecomendaciones'
import { normalizar } from '../utils/consulta'

export function CalendarioAnualPage() {
  const { consulta, ubicacion, busqueda } = useRecomendaciones()
  const { espacio, setEspacio } = useFiltroEspacio()
  const [nombre, setNombre] = useState('')
  const [enRueda, setEnRueda] = useState('')

  if (!ubicacion) return <div className="w-full min-w-0">
    <TituloPagina etiqueta="Tu zona" titulo="Calendario anual" />
    <div className="surface my-5 p-4"><CambiarZona id="zona-calendario" /></div>
  </div>
  if (consulta.isPending) return <CargaPantalla mensaje="Cargando el calendario…" />
  if (consulta.isError) return <ErrorConsulta error={consulta.error} busqueda={busqueda} reintentar={() => void consulta.refetch()} />

  const { cultivos, ubicacion: zona } = consulta.data
  const filtrados = cultivos.filter((cultivo) => normalizar(cultivo.nombre).includes(normalizar(nombre))
    && (!espacio || cultivo.filtros_rapidos.espacio_tipo === espacio))
  const mes = consulta.data.clima_zona.mes_evaluado
  // La rueda muestra el cultivo elegido; si no hay uno, el primero que es ideal en el mes consultado
  const elegido = filtrados.find((cultivo) => cultivo.id === enRueda)
    ?? filtrados.find((cultivo) => cultivo.meses_ideales.includes(mes)) ?? filtrados[0]

  return <div className="w-full min-w-0">
    <EstadoDatos datos={consulta.data} actualizado={consulta.dataUpdatedAt} />
    <TituloPagina etiqueta={zona.nombre} titulo="Calendario anual" />
    <div className="surface my-5 grid gap-3 p-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] sm:gap-4">
      <div className="border-b border-border pb-3 sm:col-span-2 sm:pb-4">
        <CambiarZona id="zona-calendario" actual={`${zona.nombre}, ${zona.estado}`} />
      </div>
      <label className="grid gap-1 text-sm font-semibold">Buscar cultivo
        <input type="search" className={estiloControl} value={nombre} onChange={(event) => setNombre(event.target.value)} placeholder="Ej. jitomate" />
      </label>
      <FiltroEspacio valor={espacio} cambiar={setEspacio} />
    </div>
    {elegido
      ? <RuedaAnual key={mes} cultivos={filtrados} elegido={elegido} elegir={setEnRueda} mes={mes} busqueda={busqueda} />
      : <Aviso>{cultivos.length ? 'No hay cultivos con estos filtros.' : 'Esta zona todavía no tiene cultivos para el calendario.'}</Aviso>}
  </div>
}
