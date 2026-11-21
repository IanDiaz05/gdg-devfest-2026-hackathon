import { useId } from 'react'
import type { SVGProps } from 'react'

/**
 * Íconos de cultivo tipo garabato minimalista: trazo de tinta (color del texto, así cambia solo con
 * el modo oscuro) + una mancha de color un poco desfasada. Lienzo de 48 × 48.
 * El trazo usa la clase `k` (estilo en index.css). El filtro hace temblar las líneas como dibujo a mano.
 * Si un cultivo no tiene dibujo, se muestra el emoji que manda la API (`icono`).
 */
const DIBUJOS: Record<string, string> = {
  acelga: `<path d="M24 40C14 36 10 24 14 12C20 6 30 6 34 12C38 24 34 36 24 40Z" fill="#8BC47A" transform="translate(1.5 1.5)"/><path class="k" d="M24 40C14 36 10 24 14 12C20 6 30 6 34 12C38 24 34 36 24 40Z"/><path d="M24 45V16" stroke="#C0392B" stroke-width="2.4" stroke-linecap="round" fill="none"/><path class="k" d="M24 30L18 24M24 25L30 19"/>`,
  ajo: `<g transform="scale(2)"><path d="M12 4.2C12.6 6.2 13.8 7.2 15.8 8.4C18.6 10 19.9 12.4 19.5 15.2C19 18.4 15.9 20.3 12 20.3C8.1 20.3 5 18.4 4.5 15.2C4.1 12.4 5.4 10 8.2 8.4C10.2 7.2 11.4 6.2 12 4.2Z" fill="#F1E6D2" transform="translate(.7 .7)"/><path class="k" style="stroke-width:1.1" d="M12 4.2C12.6 6.2 13.8 7.2 15.8 8.4C18.6 10 19.9 12.4 19.5 15.2C19 18.4 15.9 20.3 12 20.3C8.1 20.3 5 18.4 4.5 15.2C4.1 12.4 5.4 10 8.2 8.4C10.2 7.2 11.4 6.2 12 4.2ZM12 4.2V1.8M12 7.6C10.4 10.4 10 15.6 10.9 20.2M12 7.6C13.6 10.4 14 15.6 13.1 20.2M10.4 20.3L9.7 22M12 20.3V22.3M13.6 20.3L14.3 22"/></g>`,
  albahaca: `<g fill="#7DBA6A" transform="translate(1.5 1.5)"><path d="M24 34C16 34 12 28 14 22C20 22 24 28 24 34Z"/><path d="M24 34C32 34 36 28 34 22C28 22 24 28 24 34Z"/><path d="M24 20C18 20 16 15 18 11C22 11 24 15 24 20Z"/><path d="M24 20C30 20 32 15 30 11C26 11 24 15 24 20Z"/></g><path class="k" d="M24 44V12M24 34C16 34 12 28 14 22C20 22 24 28 24 34ZM24 34C32 34 36 28 34 22C28 22 24 28 24 34ZM24 20C18 20 16 15 18 11C22 11 24 15 24 20ZM24 20C30 20 32 15 30 11C26 11 24 15 24 20Z"/>`,
  amaranto: `<path d="M24 6C30 12 30 22 24 26C18 22 18 12 24 6Z" fill="#C2457A" transform="translate(1.5 1.5)"/><path class="k" d="M24 6C30 12 30 22 24 26C18 22 18 12 24 6ZM24 44V26M24 36C18 33 14 35 12 39M24 31C30 28 34 30 36 34M22 12L19 10M26 14L29 12M22 18L19 17M26 20L29 19"/>`,
  calabacita: `<path d="M10 36C7 33 8 29 12 26L30 10C34 7 39 8 40 12C41 15 39 18 36 21L20 36C16 40 12 39 10 36Z" fill="#7CB66A" transform="translate(1.5 1.5)"/><path class="k" d="M10 36C7 33 8 29 12 26L30 10C34 7 39 8 40 12C41 15 39 18 36 21L20 36C16 40 12 39 10 36ZM38 9L42 5M15 32L32 16M19 35L35 19"/>`,
  cebolla: `<path d="M24 44C16 44 14 36 18 31C20 28 22 27 24 26C26 27 28 28 30 31C34 36 32 44 24 44Z" fill="#EFE7F3" transform="translate(1.5 1.5)"/><path class="k" d="M24 44C16 44 14 36 18 31C20 28 22 27 24 26C26 27 28 28 30 31C34 36 32 44 24 44ZM21 44L20 46M24 44V46.5M27 44L28 46"/><path d="M22 27C20 18 18 10 16 4M24 26V4M26 27C28 18 30 10 32 4" stroke="#5E9B5A" stroke-width="2.2" stroke-linecap="round" fill="none"/>`,
  cebollin: `<circle cx="25.5" cy="9.5" r="4.5" fill="#B88AD6"/><path d="M18 44C18 30 16 20 14 10M24 44V12M30 44C30 30 32 20 34 12" stroke="#5E9B5A" stroke-width="2.2" stroke-linecap="round" fill="none"/><path class="k" d="M17 36H31M24 4.5L24 3M20.5 6L19 5M27.5 6L29 5"/><circle class="k" cx="24" cy="8" r="4"/>`,
  chile_habanero: `<path d="M24 14C34 14 38 22 34 30C32 36 28 40 24 42C20 40 16 36 14 30C10 22 14 14 24 14Z" fill="#F28C28" transform="translate(1.5 1.5)"/><path class="k" d="M24 14C34 14 38 22 34 30C32 36 28 40 24 42C20 40 16 36 14 30C10 22 14 14 24 14ZM24 14C24 10 26 7 30 6M19 15C21 13 27 13 29 15M24 18C22 26 22 34 24 42"/>`,
  chile_serrano: `<path d="M14 14C20 12 26 16 30 24C34 32 36 38 40 42C32 42 24 38 20 30C16 24 12 20 14 14Z" fill="#3E8E4A" transform="translate(1.5 1.5)"/><path class="k" d="M14 14C20 12 26 16 30 24C34 32 36 38 40 42C32 42 24 38 20 30C16 24 12 20 14 14ZM14 14C12 10 12 7 15 5M12 16C15 13 19 13 20 16"/>`,
  chicharo: `<path d="M6 30C14 18 30 14 42 16C38 26 26 34 6 30Z" fill="#8CC56E" transform="translate(1.5 1.5)"/><g fill="#C9E7A0"><circle cx="16" cy="26" r="3.5"/><circle cx="23" cy="24" r="3.5"/><circle cx="30" cy="22" r="3.5"/></g><path class="k" d="M6 30C14 18 30 14 42 16C38 26 26 34 6 30ZM42 16L45 13"/><g class="k"><circle cx="16" cy="26" r="3.5"/><circle cx="23" cy="24" r="3.5"/><circle cx="30" cy="22" r="3.5"/></g>`,
  cilantro: `<path d="M24 14C20 10 14 12 15 17C11 18 11 24 16 25C16 29 21 30 24 26C27 30 32 29 32 25C37 24 37 18 33 17C34 12 28 10 24 14Z" fill="#6FB66B" transform="translate(1.5 1.5)"/><path class="k" d="M24 14C20 10 14 12 15 17C11 18 11 24 16 25C16 29 21 30 24 26C27 30 32 29 32 25C37 24 37 18 33 17C34 12 28 10 24 14ZM24 44V26M24 37L18 31M24 33L30 28"/>`,
  epazote: `<path d="M24 6C30 12 31 22 28 30L24 40L20 30C17 22 18 12 24 6Z" fill="#5E9E58" transform="translate(1.5 1.5)"/><path class="k" d="M24 6C30 12 31 22 28 30L24 40L20 30C17 22 18 12 24 6ZM24 45V9M20 14L18 15M28 14L30 15M19 20L17 21M29 20L31 21M19 26L17 27M29 26L31 27"/>`,
  espinaca: `<path d="M24 40C12 38 8 26 12 16C16 8 26 6 32 10C40 16 38 32 24 40Z" fill="#4E9A4F" transform="translate(1.5 1.5)"/><path class="k" d="M24 40C12 38 8 26 12 16C16 8 26 6 32 10C40 16 38 32 24 40ZM24 40V46M24 40C24 30 26 20 30 12M25 30L17 26M27 22L20 18M26 26L33 24"/>`,
  fresa: `<path d="M24 42C14 38 10 28 12 20C16 16 32 16 36 20C38 28 34 38 24 42Z" fill="#E2453C" transform="translate(1.5 1.5)"/><path class="k" d="M24 42C14 38 10 28 12 20C16 16 32 16 36 20C38 28 34 38 24 42ZM14 19C17 14 21 15 24 18C27 15 31 14 34 19M24 18V11"/><path d="M20 26h.1M28 26h.1M24 31h.1M19 33h.1M29 33h.1M24 37h.1" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>`,
  frijol_ejote: `<path d="M8 12C16 14 30 24 38 38C40 41 37 43 35 41C26 30 16 22 8 18C5 17 5 12 8 12Z" fill="#7BB765" transform="translate(1.5 1.5)"/><path class="k" d="M8 12C16 14 30 24 38 38C40 41 37 43 35 41C26 30 16 22 8 18C5 17 5 12 8 12ZM14 17C16 16 18 17 18 19M22 22C24 21 26 22 26 24M29 28C31 27 33 28 33 30M38 40L41 44"/>`,
  hierbabuena: `<g fill="#79C99E" transform="translate(1.5 1.5)"><path d="M24 30C16 30 12 24 13 18C19 18 24 23 24 30Z"/><path d="M24 30C32 30 36 24 35 18C29 18 24 23 24 30Z"/><path d="M24 16C20 12 21 7 24 4C27 7 28 12 24 16Z"/></g><path class="k" d="M24 44V16M24 30C16 30 12 24 13 18C19 18 24 23 24 30ZM24 30C32 30 36 24 35 18C29 18 24 23 24 30ZM24 16C20 12 21 7 24 4C27 7 28 12 24 16ZM17 22L19 24M31 22L29 24"/>`,
  jitomate: `<path d="M24 42C14 42 8 35 8 27C8 19 15 14 24 14C33 14 40 19 40 27C40 35 34 42 24 42Z" fill="#E5483E" transform="translate(1.5 1.5)"/><path class="k" d="M24 42C14 42 8 35 8 27C8 19 15 14 24 14C33 14 40 19 40 27C40 35 34 42 24 42ZM24 14L20 9M24 14L28 9M24 14L17 15M24 14L31 15M24 14V7M14 24C14 21 16 19 18 18"/>`,
  lechuga: `<path d="M24 42C12 42 6 34 8 26C6 20 12 14 18 15C20 9 28 9 30 15C36 14 42 20 40 26C42 34 36 42 24 42Z" fill="#9BD27E" transform="translate(1.5 1.5)"/><path class="k" d="M24 42C12 42 6 34 8 26C6 20 12 14 18 15C20 9 28 9 30 15C36 14 42 20 40 26C42 34 36 42 24 42ZM24 42C20 34 20 26 24 20C28 26 28 34 24 42M16 38C14 32 15 26 18 22M32 38C34 32 33 26 30 22"/>`,
  nopal: `<g fill="#6FA864" transform="translate(1.5 1.5)"><path d="M24 44C17 44 14 36 15 28C16 20 20 16 24 16C28 16 32 20 33 28C34 36 31 44 24 44Z"/><path d="M31 18C29 12 31 6 36 5C41 5 42 11 40 16C38 20 34 21 31 18Z"/></g><path class="k" d="M24 44C17 44 14 36 15 28C16 20 20 16 24 16C28 16 32 20 33 28C34 36 31 44 24 44ZM31 18C29 12 31 6 36 5C41 5 42 11 40 16C38 20 34 21 31 18Z"/><path d="M21 26h.1M27 24h.1M22 34h.1M28 32h.1M25 40h.1M36 10h.1M34 15h.1" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>`,
  oregano: `<g fill="#8FBF6E"><ellipse cx="17" cy="25" rx="4" ry="3"/><ellipse cx="31" cy="17" rx="4" ry="3"/><ellipse cx="24" cy="11" rx="3.2" ry="4"/><ellipse cx="17" cy="35" rx="3.5" ry="2.6"/><ellipse cx="31" cy="29" rx="3.5" ry="2.6"/></g><path class="k" d="M24 44V14M24 32L17 25M24 22L31 17M24 39L17 35M24 33L31 29"/><g class="k"><ellipse cx="16" cy="24" rx="4" ry="3"/><ellipse cx="30" cy="16" rx="4" ry="3"/><ellipse cx="24" cy="10" rx="3.2" ry="4"/></g>`,
  // Papa: alargada e irregular, con bultos y "ojitos" (antes parecía galleta)
  papa: `<path d="M8 27C7 21 11 16 17 15C20 14.5 22 12 27 12C34 12 41 16 41 23C41 27 39 29 39 32C38 37 32 39 25 38C21 38 19 40 14 39C9 37.5 8.5 32 8 27Z" fill="#C79A63" transform="translate(1.5 1.5)"/><path class="k" d="M8 27C7 21 11 16 17 15C20 14.5 22 12 27 12C34 12 41 16 41 23C41 27 39 29 39 32C38 37 32 39 25 38C21 38 19 40 14 39C9 37.5 8.5 32 8 27ZM15 23C16 24.2 17.6 24.2 18.5 23M28 18C29 19.2 30.6 19.2 31.5 18M31 30C32 31.2 33.6 31.2 34.5 30M18 33C19 34.2 20.6 34.2 21.5 33"/><path d="M24 25h.1M35 23h.1M13 30h.1M26 33h.1" stroke="#8A6239" stroke-width="2" stroke-linecap="round"/>`,
  pepino: `<path d="M8 34C6 30 9 26 13 24L32 13C37 10 42 13 41 18C40 21 38 23 35 25L16 36C13 38 9 37 8 34Z" fill="#4F9A57" transform="translate(1.5 1.5)"/><path class="k" d="M8 34C6 30 9 26 13 24L32 13C37 10 42 13 41 18C40 21 38 23 35 25L16 36C13 38 9 37 8 34ZM41 15C44 13 44 10 42 9"/><path d="M15 30h.1M21 26h.1M27 22h.1M33 18h.1M20 31h.1M26 28h.1" stroke="#DDEBD3" stroke-width="2.4" stroke-linecap="round"/>`,
  perejil: `<path d="M24 10C20 6 14 9 15 13C10 13 9 19 13 21C11 25 15 29 19 27C20 31 28 31 29 27C33 29 37 25 35 21C39 19 38 13 33 13C34 9 28 6 24 10Z" fill="#4FA55A" transform="translate(1.5 1.5)"/><path class="k" d="M24 10C20 6 14 9 15 13C10 13 9 19 13 21C11 25 15 29 19 27C20 31 28 31 29 27C33 29 37 25 35 21C39 19 38 13 33 13C34 9 28 6 24 10ZM24 44V28M24 38L18 28M24 36L30 27M19 17C20 15 22 15 23 17M25 15C26 13 28 13 29 15M21 23C22 21 24 21 25 23"/>`,
  romero: `<circle cx="31" cy="23" r="2.2" fill="#9DB4E8"/><circle cx="18" cy="17" r="2.2" fill="#9DB4E8"/><path d="M24 46C23 34 24 20 26 6" stroke="#8A6A4A" stroke-width="2.2" stroke-linecap="round" fill="none"/><path d="M24 38L18 35M24 38L30 35M24 32L18 29M24 32L30 29M25 26L19 23M25 26L31 23M25 20L20 17M25 20L30 17M26 14L22 11M26 14L30 11" stroke="#5B8F6A" stroke-width="2" stroke-linecap="round" fill="none"/>`,
  rabano: `<g transform="translate(1.5 1.5)"><path d="M24 44C16 44 12 38 12 32C12 26 17 22 24 22C31 22 36 26 36 32C36 38 32 44 24 44Z" fill="#E0507A"/><path d="M24 22C18 18 14 10 18 6C24 6 25 14 24 22Z" fill="#7DBA6A"/><path d="M24 22C30 18 34 10 30 6C24 6 23 14 24 22Z" fill="#7DBA6A"/></g><path class="k" d="M24 44C16 44 12 38 12 32C12 26 17 22 24 22C31 22 36 26 36 32C36 38 32 44 24 44ZM24 44V47M24 22C18 18 14 10 18 6C24 6 25 14 24 22ZM24 22C30 18 34 10 30 6C24 6 23 14 24 22Z"/>`,
  tomate_verde: `<path d="M24 8C34 12 40 22 38 32C36 40 30 44 24 44C18 44 12 40 10 32C8 22 14 12 24 8Z" fill="#B6D98A" transform="translate(1.5 1.5)"/><path class="k" d="M24 8C34 12 40 22 38 32C36 40 30 44 24 44C18 44 12 40 10 32C8 22 14 12 24 8ZM24 8C22 20 22 32 24 44M24 8C16 18 15 32 18 42M24 8C32 18 33 32 30 42M24 8V4"/>`,
  verdolaga: `<g fill="#6FB66B"><ellipse cx="14" cy="25" rx="3.6" ry="2.6" transform="rotate(-30 14 25)"/><ellipse cx="36" cy="27" rx="3.6" ry="2.6" transform="rotate(25 36 27)"/><ellipse cx="26" cy="10" rx="2.6" ry="3.6"/><ellipse cx="18" cy="33" rx="3.2" ry="2.3" transform="rotate(-20 18 33)"/><ellipse cx="31" cy="35" rx="3.2" ry="2.3" transform="rotate(20 31 35)"/></g><path d="M24 44C24 36 20 30 14 26M24 44C26 36 30 30 36 28M24 40C24 30 24 20 26 12M22 38L18 33M26 39L31 35" stroke="#B8475A" stroke-width="2" stroke-linecap="round" fill="none"/>`,
  zanahoria: `<path d="M17 18C17 16 31 16 31 18C31 26 27 36 24 44C21 36 17 26 17 18Z" fill="#F08A2E" transform="translate(1.5 1.5)"/><path class="k" d="M17 18C17 16 31 16 31 18C31 26 27 36 24 44C21 36 17 26 17 18ZM19 24H23M26 28H29M21 33H24"/><path d="M24 17C22 11 18 8 15 6M24 17V5M24 17C26 11 30 8 33 6" stroke="#5E9B5A" stroke-width="2.2" stroke-linecap="round" fill="none"/>`,
}

export const tieneDibujo = (id: string) => id in DIBUJOS

/** Dibujo del cultivo como <svg>. Sirve dentro de HTML o anidado en otro SVG (con x, y). */
export function IconoCultivo({ id, icono, size = 28, className = '', ...props }: {
  id: string
  icono?: string
  size?: number
  className?: string
} & Omit<SVGProps<SVGSVGElement>, 'id'>) {
  const filtro = `garabato-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  const dibujo = DIBUJOS[id]
  if (!dibujo) {
    // Cultivo nuevo sin dibujo: se usa el emoji que manda la API
    return <span aria-hidden="true" className={className} style={{ fontSize: size * 0.8, lineHeight: 1 }}>{icono}</span>
  }
  return <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" focusable="false"
    className={`icono-garabato ${className}`} {...props}>
    <filter id={filtro} x="-10%" y="-10%" width="120%" height="120%">
      <feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves={2} seed={5} />
      <feDisplacementMap in="SourceGraphic" scale={1.6} />
    </filter>
    {/* Dibujos propios, fijos en este archivo (no vienen de la API ni del usuario) */}
    <g filter={`url(#${filtro})`} dangerouslySetInnerHTML={{ __html: dibujo }} />
  </svg>
}
