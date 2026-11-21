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

const { clavePublica, fechaGuardada, guardarDatos, recuperarDatos } = await vite.ssrLoadModule('/src/pwa/datosGuardados.ts')
const url = (ruta) => new URL(ruta, 'https://huerto.example')

test('solo genera claves para fichas públicas y consultas de localidad sin GPS', () => {
  assert.equal(clavePublica(url('/api/cultivos/jitomate')), 'https://huerto.example/api/cultivos/jitomate')
  assert.equal(clavePublica(url('/api/recomendaciones?q=Toluca&mes=12')), 'https://huerto.example/api/recomendaciones?q=Toluca&mes=12')
  assert.match(clavePublica(url('/api/recomendaciones?q=M%C3%A9rida')), /mes=actual-\d{4}-\d+/)
  for (const ruta of [
    '/api/recomendaciones?lat=19&lon=-99',
    '/api/recomendaciones?q=Toluca&lat=19&lon=-99',
    '/api/recomendaciones?q=Calle+5',
    '/api/recomendaciones?q=Toluca&token=prueba',
    '/api/cultivos/jitomate?token=prueba',
    '/api/otra-ruta?q=Toluca',
  ]) assert.equal(clavePublica(url(ruta)), undefined)
})

test('registra la fecha de una copia y elimina respuestas privadas o vencidas', async () => {
  const entradas = new Map()
  const anterior = globalThis.caches
  globalThis.caches = { open: async () => ({
    put: async (clave, respuesta) => { entradas.set(clave, respuesta.clone()) },
    keys: async () => [...entradas.keys()],
    match: async (clave) => entradas.get(clave)?.clone(),
    delete: async (clave) => entradas.delete(clave),
  }) }
  const clave = clavePublica(url('/api/cultivos/jitomate'))
  const ficha = { id: 'jitomate' }
  try {
    await guardarDatos(clave, ficha, Response.json(ficha))
    const copia = await recuperarDatos(clave, (dato) => dato)
    assert.deepEqual(copia, ficha)
    assert.ok(fechaGuardada(copia) > 0)
    await guardarDatos(clave, ficha, Response.json(ficha, { headers: { 'Cache-Control': 'private' } }))
    assert.equal(await recuperarDatos(clave, (dato) => dato), undefined)
    entradas.set(clave, Response.json(ficha, { headers: { 'x-guardado-en': '1' } }))
    assert.equal(await recuperarDatos(clave, (dato) => dato), undefined)
    assert.equal(entradas.size, 0)
  } finally {
    if (anterior === undefined) delete globalThis.caches
    else globalThis.caches = anterior
  }
})
