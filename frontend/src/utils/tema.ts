/**
 * Modo claro / oscuro. El tema vive en <html data-tema="claro|oscuro">; index.css cambia la paleta
 * según ese atributo. index.html lo aplica antes de pintar (sin parpadeo) con la misma lógica.
 * Si la persona no ha elegido, se sigue el tema del sistema.
 */
export type Tema = 'claro' | 'oscuro'

const CLAVE = 'quesiembro-tema'
const COLOR_BARRA = { claro: '#2D5A3D', oscuro: '#0B120E' }

export function temaElegido(): Tema | null {
  try {
    const guardado = localStorage.getItem(CLAVE)
    return guardado === 'claro' || guardado === 'oscuro' ? guardado : null
  } catch {
    return null
  }
}

export function temaDelSistema(): Tema {
  return typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches ? 'oscuro' : 'claro'
}

export function temaActual(): Tema {
  return document.documentElement.dataset.tema === 'oscuro' ? 'oscuro' : 'claro'
}

export function aplicarTema(tema: Tema, guardar = false) {
  document.documentElement.dataset.tema = tema
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', COLOR_BARRA[tema])
  if (!guardar) return
  try {
    localStorage.setItem(CLAVE, tema)
  } catch {
    // Sin almacenamiento (modo privado): el tema dura solo esta visita
  }
}
