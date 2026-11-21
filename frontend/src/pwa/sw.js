/* El build inyecta la revisión y la lista completa de archivos de la SPA. */
const scope = new URL(self.registration.scope)
const prefijo = `quesiembro-shell:${scope.pathname}:`
const nombreCache = `${prefijo}__VERSION__`
const archivos = __ARCHIVOS__.map((ruta) => new URL(ruta, scope).href)
const estaticos = new Set(archivos)
const inicio = new URL('index.html', scope).href

self.addEventListener('install', (evento) => {
  evento.waitUntil(caches.open(nombreCache).then((cache) =>
    cache.addAll(archivos.map((url) => new Request(url, { cache: 'reload' }))),
  ))
})

self.addEventListener('activate', (evento) => {
  evento.waitUntil((async () => {
    const nombres = await caches.keys()
    await Promise.all(nombres.filter((nombre) =>
      nombre.startsWith(prefijo) && nombre !== nombreCache,
    ).map((nombre) => caches.delete(nombre)))
    await self.clients.claim()
  })())
})

self.addEventListener('message', (evento) => {
  if (evento.data === 'ACTUALIZAR') evento.waitUntil(self.skipWaiting())
})

self.addEventListener('fetch', (evento) => {
  const { request } = evento
  const url = new URL(request.url)
  if (request.method !== 'GET' || url.origin !== scope.origin ||
    !url.pathname.startsWith(scope.pathname)) return

  if (request.mode === 'navigate') {
    const ruta = url.pathname.slice(scope.pathname.length)
    if (!/^(?:index\.html|zona\/?|recomendaciones\/?|calendario\/?|cultivos?\/[^/]+\/?|)$/.test(ruta)) return
    // Sirve HTML y chunks de la misma revisión, incluso durante un despliegue.
    evento.respondWith(caches.open(nombreCache).then(async (cache) => await cache.match(inicio) ?? fetch(request)))
    return
  }

  if (!estaticos.has(url.href)) return
  const cache = caches.open(nombreCache)
  if (url.pathname.startsWith(new URL('pwa/', scope).pathname)) {
    const actualizar = cache.then(async (almacen) => {
      const nueva = await fetch(request)
      if (nueva.ok && nueva.headers.get('Content-Type')?.startsWith('image/')) {
        await almacen.put(request, nueva.clone())
      }
      return nueva
    })
    evento.waitUntil(actualizar.catch(() => {}))
    evento.respondWith(cache.then(async (almacen) => await almacen.match(request) ?? actualizar))
    return
  }
  evento.respondWith(cache.then(async (almacen) => await almacen.match(request) ?? fetch(request)))
})
