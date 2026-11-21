import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import type { Plugin } from 'vite'

function generarWorker(): Plugin {
  return {
    name: 'quesiembro-service-worker',
    apply: 'build',
    enforce: 'post',
    async generateBundle(_, bundle) {
      const fuente = await readFile(new URL('./src/pwa/sw.js', import.meta.url), 'utf8')
      const archivos = ['index.html', 'manifest.webmanifest', 'pwa/icon-192.png', 'pwa/icon-512.png', 'pwa/apple-touch-icon.png']
      const hash = createHash('sha256').update(fuente)
      for (const nombre of archivos.slice(1)) {
        hash.update(await readFile(new URL(`./public/${nombre}`, import.meta.url)))
      }
      for (const nombre of Object.keys(bundle).sort()) {
        const archivo = bundle[nombre]
        hash.update(nombre).update(archivo.type === 'chunk' ? archivo.code : archivo.source)
        if (nombre.startsWith('assets/') && !nombre.endsWith('.map')) archivos.push(nombre)
      }
      this.emitFile({
        type: 'asset',
        fileName: 'sw.js',
        source: fuente.replace('__VERSION__', hash.digest('hex').slice(0, 16))
          .replace('__ARCHIVOS__', JSON.stringify(archivos)),
      })
    },
  }
}

const proxy = { '/api/': 'http://127.0.0.1:8000' }

export default defineConfig({
  plugins: [react(), tailwindcss(), generarWorker()],
  server: { proxy },
  preview: { proxy },
})
