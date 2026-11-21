/**
 * Genera los íconos de la PWA (iOS, Android y PC) a partir del logo.
 *
 * Fuente: src/assets/imagen.png (logo con fondo transparente).
 * Uso:    npm run iconos      (desde frontend/; vuelve a correrlo si cambia el logo)
 *
 * Archivos que genera en public/:
 *   pwa/icon-192.png, pwa/icon-512.png        → "any": cuadro verde redondeado (Android, Chrome/Edge en PC)
 *   pwa/icon-maskable-192.png, -512.png       → "maskable": fondo completo con margen, Android lo recorta
 *   pwa/apple-touch-icon.png (180 px)         → iPhone/iPad y Safari en Mac; iOS redondea las esquinas solo
 *   favicon-16.png, favicon-32.png, favicon.ico → pestaña del navegador
 */
import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const VERDE = '#2D5A3D' // mismo verde de la marca y del cuadro del logo en la barra
const LOGO = fileURLToPath(new URL('../src/assets/imagen.png', import.meta.url))
const PUBLICO = new URL('../public/', import.meta.url)

// Logo sin los márgenes transparentes, para controlar exactamente cuánto ocupa
const logo = await sharp(LOGO).trim().toBuffer()

/** Logo centrado en un lienzo de `lado` px, ocupando como máximo `fraccion` del alto/ancho. */
async function logoCentrado(lado, fraccion) {
  const caja = Math.round(lado * fraccion)
  const pieza = await sharp(logo).resize(caja, caja, { fit: 'inside' }).toBuffer()
  return sharp({ create: { width: lado, height: lado, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: pieza, gravity: 'center' }])
    .png()
    .toBuffer()
}

/** Fondo verde: completo (iOS y maskable) o como cuadro redondeado con esquinas transparentes ("any"). */
function fondo(lado, redondeado) {
  const radio = redondeado ? Math.round(lado * 0.22) : 0
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${lado}" height="${lado}"><rect width="${lado}" height="${lado}" rx="${radio}" fill="${VERDE}"/></svg>`)
}

async function icono(lado, { fraccion, redondeado }) {
  const imagen = sharp(fondo(lado, redondeado)).composite([{ input: await logoCentrado(lado, fraccion) }])
  // Los de fondo completo van sin canal de transparencia: iOS pinta de negro cualquier transparencia
  const final = redondeado ? imagen : sharp(await imagen.png().toBuffer()).flatten({ background: VERDE })
  return final.png({ compressionLevel: 9 }).toBuffer()
}

/** .ico con varias imágenes PNG dentro (formato que aceptan todos los navegadores y Windows). */
function ico(pngs) {
  const cabecera = Buffer.alloc(6)
  cabecera.writeUInt16LE(0, 0)
  cabecera.writeUInt16LE(1, 2)
  cabecera.writeUInt16LE(pngs.length, 4)
  let desplazamiento = 6 + 16 * pngs.length
  const entradas = pngs.map(({ lado, datos }) => {
    const entrada = Buffer.alloc(16)
    entrada.writeUInt8(lado >= 256 ? 0 : lado, 0)
    entrada.writeUInt8(lado >= 256 ? 0 : lado, 1)
    entrada.writeUInt16LE(1, 4) // planos
    entrada.writeUInt16LE(32, 6) // bits por píxel
    entrada.writeUInt32LE(datos.length, 8)
    entrada.writeUInt32LE(desplazamiento, 12)
    desplazamiento += datos.length
    return entrada
  })
  return Buffer.concat([cabecera, ...entradas, ...pngs.map(({ datos }) => datos)])
}

// "maskable": Android recorta hasta un círculo del 80 %; con el logo al 60 % nunca se corta
const archivos = {
  'pwa/icon-192.png': await icono(192, { fraccion: 0.7, redondeado: true }),
  'pwa/icon-512.png': await icono(512, { fraccion: 0.7, redondeado: true }),
  'pwa/icon-maskable-192.png': await icono(192, { fraccion: 0.6, redondeado: false }),
  'pwa/icon-maskable-512.png': await icono(512, { fraccion: 0.6, redondeado: false }),
  'pwa/apple-touch-icon.png': await icono(180, { fraccion: 0.72, redondeado: false }),
  'favicon-16.png': await icono(16, { fraccion: 0.86, redondeado: true }),
  'favicon-32.png': await icono(32, { fraccion: 0.82, redondeado: true }),
}
archivos['favicon.ico'] = ico(await Promise.all([16, 32, 48].map(async (lado) => ({
  lado, datos: lado === 48 ? await icono(48, { fraccion: 0.8, redondeado: true }) : archivos[`favicon-${lado}.png`],
}))))

await mkdir(new URL('pwa/', PUBLICO), { recursive: true })
for (const [nombre, datos] of Object.entries(archivos)) {
  await writeFile(new URL(nombre, PUBLICO), datos)
  console.log(`public/${nombre}  ${(datos.length / 1024).toFixed(1)} KB`)
}
