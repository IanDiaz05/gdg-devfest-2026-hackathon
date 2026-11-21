import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { LoaderCircle, MapPin } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { sugerirCiudades } from '../services/api'
import type { SugerenciaCiudad } from '../types/api'

const ESPERA_MS = 150

/**
 * Campo de ciudad con sugerencias (patrón combobox de WAI-ARIA).
 * Al enfocarlo muestra las primeras 10 ciudades en orden alfabético ("Ciudad, Estado") y la lista
 * se actualiza mientras se escribe. Flechas para moverse, Enter para elegir y Escape para cerrar.
 * Elegir una opción solo llena el campo: la consulta se envía con el botón del formulario.
 */
export function BuscadorCiudad({ id, valor, onCambio }: {
  id: string
  valor: string
  onCambio: (valor: string) => void
}) {
  const idLista = useId()
  const [abierto, setAbierto] = useState(false)
  const [activa, setActiva] = useState(-1)
  const [texto, setTexto] = useState(valor.trim())
  const lista = useRef<HTMLUListElement>(null)

  // Espera a que se deje de teclear un momento para no pedir una lista por cada letra
  useEffect(() => {
    const espera = setTimeout(() => setTexto(valor.trim()), ESPERA_MS)
    return () => clearTimeout(espera)
  }, [valor])

  const consulta = useQuery({
    queryKey: ['ciudades', texto],
    queryFn: ({ signal }) => sugerirCiudades(texto, signal),
    enabled: abierto,
    staleTime: Infinity,
    placeholderData: keepPreviousData,
    retry: false,
  })
  const opciones = consulta.data ?? []
  const visible = abierto && (opciones.length > 0 || consulta.isFetched)

  useEffect(() => setActiva(-1), [texto])
  useEffect(() => {
    lista.current?.querySelector<HTMLElement>(`[data-indice="${activa}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [activa])

  function elegir(opcion: SugerenciaCiudad) {
    onCambio(opcion.etiqueta)
    setAbierto(false)
    setActiva(-1)
  }

  function teclado(evento: KeyboardEvent<HTMLInputElement>) {
    if (evento.key === 'ArrowDown' || evento.key === 'ArrowUp') {
      evento.preventDefault()
      if (!abierto) { setAbierto(true); return }
      if (!opciones.length) return
      const paso = evento.key === 'ArrowDown' ? 1 : -1
      setActiva((actual) => (actual + paso + opciones.length) % opciones.length)
    } else if (evento.key === 'Enter' && abierto && activa >= 0 && opciones[activa]) {
      evento.preventDefault() // elige la opción en lugar de enviar el formulario
      elegir(opciones[activa])
    } else if (evento.key === 'Escape' && abierto) {
      evento.preventDefault()
      setAbierto(false)
    }
  }

  return (
    <div className="relative mt-2">
      <div className="flex min-h-12 items-center rounded-xl border border-border bg-cream px-3 focus-within:ring-2 focus-within:ring-primary">
        <MapPin size={19} strokeWidth={1.75} className="shrink-0 text-primary" aria-hidden="true" />
        <input className="min-h-12 min-w-0 flex-1 px-2 text-base text-foreground outline-none placeholder:text-muted-foreground focus-visible:outline-none"
          id={id} value={valor} placeholder="Ciudad o municipio" inputMode="search" autoComplete="off" required maxLength={120}
          role="combobox" aria-autocomplete="list" aria-expanded={visible} aria-controls={idLista}
          aria-activedescendant={visible && activa >= 0 ? `${idLista}-${activa}` : undefined}
          onChange={(evento) => { onCambio(evento.target.value); setAbierto(true) }}
          onFocus={() => setAbierto(true)} onClick={() => setAbierto(true)}
          onBlur={() => setAbierto(false)} onKeyDown={teclado} />
        {abierto && consulta.isFetching && <LoaderCircle size={17} className="shrink-0 text-muted-foreground motion-safe:animate-spin" aria-hidden="true" />}
      </div>
      <ul ref={lista} id={idLista} role="listbox" aria-label="Ciudades sugeridas" hidden={!visible}
        className="surface sin-barra absolute inset-x-0 top-full z-30 mt-1 max-h-72 overflow-y-auto overscroll-contain p-1 shadow-soft">
        {opciones.map((opcion, indice) => (
          <li key={opcion.etiqueta} id={`${idLista}-${indice}`} role="option" aria-selected={indice === activa} data-indice={indice}
            className={`flex cursor-pointer items-baseline justify-between gap-3 rounded-lg px-3 py-2.5 text-sm ${indice === activa ? 'bg-secondary' : 'hover:bg-secondary/60'}`}
            onMouseDown={(evento) => evento.preventDefault()} // conserva el foco del campo al hacer clic
            onMouseEnter={() => setActiva(indice)} onClick={() => elegir(opcion)}>
            <span className="min-w-0 truncate font-semibold text-foreground">{opcion.nombre}</span>
            <span className="shrink-0 text-xs text-muted-foreground">{opcion.estado}</span>
          </li>
        ))}
        {consulta.isFetched && !opciones.length && <li role="presentation" className="px-3 py-2.5 text-sm text-muted-foreground">
          {consulta.isError ? 'No pudimos cargar sugerencias. Puedes escribir la ciudad y buscar.' : 'Sin coincidencias. Prueba con otro nombre o con el estado.'}
        </li>}
      </ul>
    </div>
  )
}
