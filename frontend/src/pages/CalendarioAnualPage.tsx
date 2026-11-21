import { EstadoDatos } from '../components/EstadoDatos'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ErrorConsulta } from '../components/ErrorConsulta'
import { FiltroEspacio, estiloControl, useFiltroEspacio } from '../components/FiltrosCultivos'
import { Aviso, CargaPantalla, ElegirZona, TituloPagina } from '../components/Interfaz'
import { RuedaAnual } from '../components/RuedaAnual'
import { useRecomendaciones } from '../hooks/useRecomendaciones'
import { meses, normalizar } from '../utils/consulta'

const estadosMes = {
  ideal: { clase: 'bg-success-soft text-success', texto: 'Óptimo', simbolo: '✓' },
  cuidados: { clase: 'bg-warning-soft text-warning', texto: 'Con cuidados', simbolo: '!' },
  no: { clase: 'bg-neutral-cell text-muted-foreground', texto: 'No recomendado', simbolo: '–' },
}

export function CalendarioAnualPage() {
  const { consulta, ubicacion, busqueda } = useRecomendaciones()
  const { espacio, setEspacio } = useFiltroEspacio()
  const [nombre, setNombre] = useState('')
  const [enRueda, setEnRueda] = useState('')

  if (!ubicacion) return <ElegirZona />
  if (consulta.isPending) return <CargaPantalla mensaje="Cargando el calendario…" />
  if (consulta.isError) return <ErrorConsulta error={consulta.error} busqueda={busqueda} reintentar={() => void consulta.refetch()} />

  const { cultivos, ubicacion: zona } = consulta.data
  const filtrados = cultivos.filter((cultivo) => normalizar(cultivo.nombre).includes(normalizar(nombre))
    && (!espacio || cultivo.filtros_rapidos.espacio_tipo === espacio))
  const mes = consulta.data.clima_zona.mes_evaluado
  // La rueda muestra el cultivo elegido; si no hay uno, el primero que es ideal en el mes consultado
  const elegido = filtrados.find((cultivo) => cultivo.id === enRueda)
    ?? filtrados.find((cultivo) => cultivo.meses_ideales.includes(mes)) ?? filtrados[0]

  return <div className="w-full">
    <EstadoDatos datos={consulta.data} actualizado={consulta.dataUpdatedAt} />
    <TituloPagina etiqueta={zona.nombre} titulo="Calendario anual" />
    <div className="surface my-5 grid gap-3 p-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] sm:p-4">
      <label className="grid gap-1 text-sm font-semibold">Buscar cultivo
        <input type="search" className={estiloControl} value={nombre} onChange={(event) => setNombre(event.target.value)} placeholder="Ej. jitomate" />
      </label>
      <FiltroEspacio valor={espacio} cambiar={setEspacio} />
    </div>
    {elegido && <RuedaAnual cultivos={filtrados} elegido={elegido} elegir={setEnRueda} mes={mes} busqueda={busqueda} />}
    <ul className="mb-4 flex flex-wrap gap-2 text-sm">
      {Object.values(estadosMes).map(({ texto, clase, simbolo }) => <li key={texto} className={`rounded-full px-3 py-1.5 font-semibold ${clase}`}>{simbolo} {texto}</li>)}
    </ul>
    {filtrados.length ? <ul className="grid gap-3">
      {filtrados.map((cultivo) => <li key={cultivo.id} className="surface p-4 shadow-soft">
        <h2 className="mb-2 text-lg font-bold">
          <Link className="inline-flex min-h-11 items-center gap-2 text-primary underline underline-offset-4" to={{ pathname: `/cultivo/${encodeURIComponent(cultivo.id)}`, search: busqueda }}>
            <span aria-hidden="true">{cultivo.icono}</span>{cultivo.nombre}
          </Link>
        </h2>
        <ol className="grid grid-cols-3 gap-1.5 min-[360px]:grid-cols-4 sm:grid-cols-6 lg:grid-cols-12">
          {meses.map((mes, index) => {
            const numero = index + 1
            const estado = cultivo.meses_ideales.includes(numero) ? estadosMes.ideal
              : cultivo.meses_posibles.includes(numero) ? estadosMes.cuidados : estadosMes.no
            return <li key={mes} className={`rounded-md px-1 py-2 text-center text-sm font-semibold ${estado.clase}`}>
              <span className="sr-only">{mes} · {estado.texto}</span><span aria-hidden="true">{mes.slice(0, 3)} {estado.simbolo}</span>
            </li>
          })}
        </ol>
      </li>)}
    </ul> : <Aviso>{cultivos.length ? 'No hay cultivos con estos filtros.' : 'Esta zona todavía no tiene cultivos para el calendario.'}</Aviso>}
  </div>
}
