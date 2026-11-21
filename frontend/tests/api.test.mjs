import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { createServer } from 'vite'

const vite = await createServer({
  configFile: false,
  envFile: false,
  optimizeDeps: { noDiscovery: true },
  server: { middlewareMode: true, ws: false, watch: null },
})
after(() => vite.close())

const { obtenerDiagnostico, obtenerFicha, sugerirCiudades } = await vite.ssrLoadModule('/src/services/api.ts')
const { ErrorApi } = await vite.ssrLoadModule('/src/services/ErrorApi.ts')
const { leerUbicacion, leerMes } = await vite.ssrLoadModule('/src/utils/consulta.ts')
const { diagnosticoDemo, fichaDemo } = await vite.ssrLoadModule('/src/mocks/recomendaciones.mock.ts')
const signal = new AbortController().signal

function diagnosticoV31() {
  const demo = diagnosticoDemo({ q: 'Toluca' })
  return {
    ...demo,
    clima_zona: { ...demo.clima_zona, sequia: null, lluvia_mes_mm: null },
    alertas_7_dias: [{ tipo: 'tormenta', severidad: 'media', fecha: '2026-11-22', titulo: 'Tormenta', mensaje: 'Ejemplo de prueba' }],
    cultivos: demo.cultivos.map((cultivo) => ({
      ...cultivo,
      filtros_rapidos: {
        ...cultivo.filtros_rapidos, profundidad_maceta_cm: 30, luz_nivel: 4,
        riego_frecuencia_dias: 2, consumo_hidrico: 'alto', pet_safe: false,
        atrae_polinizadores: true, es_nativa_region: true,
      },
    })),
  }
}

test('GPS prevalece en una URL con ambas formas de búsqueda', () => {
  const params = new URLSearchParams('q=Toluca&lat=19.288&lon=-99.653&mes=12')
  assert.deepEqual(leerUbicacion(params), { lat: 19.288, lon: -99.653 })
  assert.equal(leerMes(params), 12)
  assert.deepEqual(leerUbicacion(new URLSearchParams('q=Toluca&lat=99&lon=5')), { q: 'Toluca' })
})

test('diagnóstico v3.1 conserva ventanas anuales y admite sequía nula u omitida', async (t) => {
  const datos = diagnosticoV31()
  delete datos.clima_zona.sequia
  t.mock.method(globalThis, 'fetch', async (ruta) => {
    assert.equal(ruta, '/api/recomendaciones?mes=12&lat=19.288&lon=-99.653')
    return Response.json(datos)
  })
  const obtener = () => obtenerDiagnostico({ lat: 19.288, lon: -99.653 }, 12, signal)
  const resultado = await obtener()
  assert.equal(resultado.alertas_7_dias[0].tipo, 'tormenta')
  assert.deepEqual(resultado.cultivos[1].meses_posibles, [3, 4, 5, 6, 7])
  datos.clima_zona.sequia = null
  assert.equal((await obtener()).clima_zona.sequia, null)
  datos.clima_zona.sequia = { activa: false, nivel: 'D0', nivel_nombre: 'Anormalmente seco', fecha_dato: '2026-11-15', consejo: 'Ejemplo' }
  assert.equal((await obtener()).clima_zona.sequia.nivel, 'D0')
  datos.cultivos[1].meses_ideales = [1]
  await assert.rejects(obtener, /inconsistentes/)
})

test('ficha v3.1 acepta profundidad y nivel de luz y comprueba su ID', async (t) => {
  const demo = fichaDemo('jitomate')
  const datos = {
    ...demo, es_nativa_region: true,
    ficha_tecnica: { ...demo.ficha_tecnica, profundidad_maceta_cm: 30, luz_nivel: 4, riego_frecuencia_dias: 2 },
    restricciones: { pet_safe: false, dificultad: 'media' },
    impacto_ambiental: { consumo_hidrico: 'alto', atrae_polinizadores: true },
    guia_rapida: { error_comun: 'Ejemplo de prueba' },
  }
  delete datos.contexto_economico_sniim
  t.mock.method(globalThis, 'fetch', async (ruta) => {
    assert.equal(ruta, '/api/cultivos/jitomate')
    return Response.json(datos)
  })
  assert.equal((await obtenerFicha('jitomate', signal)).ficha_tecnica.luz_nivel, 4)
  datos.id = 'lechuga'
  await assert.rejects(obtenerFicha('jitomate', signal), /otro cultivo/)
})

test('errores de HTTP y de red no se confunden con vacíos', async (t) => {
  const respuestas = [
    [400, { error: 'ubicacion_invalida', detail: 'Ubicación inválida' }],
    [404, { error: 'ciudad_no_encontrada', detail: 'Ciudad no encontrada' }],
    [422, { detail: [] }],
    [503, { error: 'clima_no_disponible', detail: 'Clima saturado', reintentar_en_s: 60 }],
  ]
  t.mock.method(globalThis, 'fetch', async () => {
    const siguiente = respuestas.shift()
    if (!siguiente) throw new TypeError('Sin red')
    return Response.json(siguiente[1], { status: siguiente[0] })
  })
  const obtener = () => obtenerDiagnostico({ q: 'Lugar de prueba' }, undefined, signal)
  for (const status of [400, 404, 422, 503]) {
    await assert.rejects(obtener, (error) => error instanceof ErrorApi && error.status === status
      && (status !== 503 || error.reintentarEnS === 60))
  }
  await assert.rejects(obtener, /No pudimos conectarnos/)
})

test('la demo conserva el fixture de diciembre y no fabrica otros meses ni homónimos', () => {
  const zona = diagnosticoDemo({ q: 'Toluca' }, 12)
  assert.equal(zona.clima_zona.mes_evaluado, 12)
  assert.deepEqual(zona.ubicacion.alternativas, [])
  assert.throws(() => diagnosticoDemo({ q: 'Toluca' }, 1), /solo incluye diagnósticos de diciembre/)
})

test('el buscador pide sugerencias con y sin texto y valida la respuesta', async (t) => {
  const tulum = { nombre: 'Tulum', estado: 'Quintana Roo', municipio: 'Tulum', etiqueta: 'Tulum, Quintana Roo', lat: 20.21, lon: -87.46 }
  const rutas = []
  let respuesta = [tulum]
  t.mock.method(globalThis, 'fetch', async (ruta) => {
    rutas.push(ruta)
    return Response.json(respuesta)
  })
  assert.deepEqual(await sugerirCiudades('', signal), [tulum])
  assert.deepEqual(await sugerirCiudades('  tul ', signal), [tulum])
  assert.deepEqual(rutas, ['/api/ciudades?limite=10', '/api/ciudades?limite=10&q=tul'])
  respuesta = [{ ...tulum, etiqueta: undefined }]
  await assert.rejects(sugerirCiudades('tul', signal), /formato inesperado/)
})

test('el buscador usa el catálogo local si la API no ofrece sugerencias', async (t) => {
  let status = 404
  t.mock.method(globalThis, 'fetch', async () => Response.json({ detail: 'Not Found' }, { status }))

  assert.equal((await sugerirCiudades('', signal)).length, 10)
  const [toluca] = await sugerirCiudades('tolúca, estado de méx', signal)
  assert.equal(toluca.etiqueta, 'Toluca, Estado de México')
  assert.deepEqual(await sugerirCiudades('zzzzz', signal), [])

  status = 503
  await assert.rejects(sugerirCiudades('Toluca', signal), { status: 503 })
})
