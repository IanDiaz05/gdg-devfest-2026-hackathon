import { Leaf, MapPin, Sprout } from 'lucide-react'
import type { Diagnostico } from '../types/api'
import { formatoNumero } from '../utils/consulta'
import { PlantasIlustracion } from './PlantasIlustracion'
import huerto from '../assets/huerto-portada.webp'

export function HeroHuerto({ datos }: { datos?: Diagnostico }) {
  const ideal = datos?.cultivos.find((cultivo) => cultivo.estado === 'optimo')

  return <figure className="relative isolate min-w-0 pb-8 motion-safe:animate-fade-up motion-safe:[animation-delay:160ms] motion-reduce:animate-none sm:pb-10 lg:pb-12">
    <svg viewBox="0 0 480 450" preserveAspectRatio="none" aria-hidden="true" className="pointer-events-none absolute -inset-7 -z-10 h-full w-[110%] overflow-visible opacity-45 blur-3xl">
      <path d="M77 44C169 2 266 9 296 69s-23 160-93 178S30 214 21 159 25 70 77 44Z" className="fill-sage" />
      <path d="M279 193c76-24 166 22 178 79 15 72-64 151-148 150-67 0-111-54-99-117 9-48 29-98 69-112Z" className="fill-terracotta/40" />
    </svg>
    <div className="relative aspect-[4/3] overflow-hidden rounded-botanical bg-earth-soft shadow-hero sm:aspect-[6/5]">
      <img src={huerto} width="960" height="640" alt="Huerto urbano con albahaca y jitomates en macetas de barro" decoding="async" fetchPriority="high"
        className="h-full w-full object-cover object-[center_63%] oscuro:brightness-90" />
      <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,white_0.55px,transparent_0.8px)] bg-size-[6px_7px] opacity-15" />
    </div>
    <span aria-hidden="true" className="absolute right-5 top-[24%] text-white drop-shadow motion-safe:animate-float motion-safe:[animation-delay:1400ms] motion-reduce:animate-none">
      <svg width="27" height="24" viewBox="0 0 27 24" fill="currentColor"><path d="M13.5 10C8.5 2 2 1 2 6c0 5 3 8 8 8-4 4-2 8 1 7 2-1 2.5-4 2.5-6 0 2 .5 5 2.5 6 3 1 5-3 1-7 5 0 8-3 8-8 0-5-6.5-4-11.5 4Z" /></svg>
    </span>
    <div className="pointer-events-none absolute bottom-4 left-1 hidden w-[41%] rounded-3xl bg-cream/90 px-1 shadow-raised sm:block lg:-left-5" aria-hidden="true">
      <PlantasIlustracion className="h-auto w-full" />
    </div>
    <figcaption className="absolute right-2 bottom-0 w-fit max-w-[calc(100%-1rem)] rounded-2xl border border-card/70 bg-card/90 px-4 py-3 shadow-raised backdrop-blur-lg sm:right-4 sm:max-w-[62%] sm:px-5 sm:py-4">
      {datos ? <>
        <p className="flex items-center gap-1.5 text-sm font-bold text-primary"><MapPin className="shrink-0" size={15} aria-hidden="true" /> {datos.ubicacion.nombre}</p>
        <p className="mt-1 text-sm text-muted-foreground">{datos.clima_zona.mes_nombre} · {formatoNumero.format(datos.clima_zona.temp_media_c)} °C de media histórica</p>
        {ideal && <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-primary"><Leaf size={15} className="shrink-0" aria-hidden="true" /> Ideal para sembrar {ideal.nombre.toLocaleLowerCase('es-MX')}</p>}
      </> : <>
        <p className="flex items-center gap-2 font-bold text-primary"><Sprout size={19} strokeWidth={1.75} aria-hidden="true" /> Tu clima, tu calendario</p>
        <p className="mt-1 text-sm text-muted-foreground">Consulta qué cultivar en tu municipio.</p>
      </>}
    </figcaption>
  </figure>
}
