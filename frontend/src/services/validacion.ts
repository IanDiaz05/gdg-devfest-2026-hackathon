import type { Diagnostico, FichaCultivo } from '../types/api'
import { esMes } from '../utils/consulta'

export function objeto(valor: unknown): Record<string, unknown> | undefined {
  return valor !== null && typeof valor === 'object' && !Array.isArray(valor)
    ? valor as Record<string, unknown>
    : undefined
}

type Regla = (valor: unknown) => boolean
const texto: Regla = (valor) => typeof valor === 'string'
const numero: Regla = (valor) => typeof valor === 'number' && Number.isFinite(valor)
const booleano: Regla = (valor) => typeof valor === 'boolean'
const lista = (regla: Regla): Regla => (valor) => Array.isArray(valor) && valor.every(regla)
const nullable = (regla: Regla): Regla => (valor) => valor === null || regla(valor)
const unoDe = (...opciones: string[]): Regla => (valor) => typeof valor === 'string' && opciones.includes(valor)
const campos = (reglas: Record<string, Regla>): Regla => (valor) => {
  const entrada = objeto(valor)
  return entrada !== undefined && Object.entries(reglas).every(([campo, regla]) => regla(entrada[campo]))
}
const rango: Regla = (valor) => Array.isArray(valor) && valor.length === 2 && valor.every(numero) && valor[0] <= valor[1]

const luz = unoDe('pleno_sol', 'media_sombra', 'sombra')
const alternativa = { nombre: texto, estado: texto, lat: numero, lon: numero }
const mesClimatico = campos({ mes: esMes, nombre: texto, temp_media_c: numero })
const diagnostico = campos({
  ubicacion: campos({
    ...alternativa, municipio: texto, altitud_m: numero, desde_cache: booleano, alternativas: lista(campos(alternativa)),
  }),
  clima_zona: campos({
    mes_evaluado: esMes, mes_nombre: texto, periodo_referencia: texto,
    temp_media_c: numero, temp_min_promedio_c: numero, temp_max_promedio_c: numero,
    anios_con_helada_pct: (valor) => typeof valor === 'number' && valor >= 0 && valor <= 100,
    mes_mas_frio: mesClimatico, mes_mas_caluroso: mesClimatico,
    sequia: nullable(campos({ activa: booleano, nivel: texto, nivel_nombre: texto, fecha_dato: texto, consejo: texto })),
  }),
  alertas_7_dias: lista(campos({
    tipo: unoDe('helada', 'calor'), severidad: unoDe('media', 'alta'), titulo: texto, mensaje: texto,
  })),
  cultivos: lista(campos({
    id: texto, nombre: texto, icono: texto, categoria: texto,
    estado: unoDe('optimo', 'con_cuidados', 'no_ahora'), semaforo: unoDe('verde', 'amarillo', 'rojo'),
    razon_corta: texto, etiqueta_clima: texto, meses_ideales: lista(esMes), meses_posibles: lista(esMes),
    filtros_rapidos: campos({
      maceta_min_litros: numero, espacio_tipo: unoDe('maceta_chica', 'maceta_grande', 'patio'),
      luz, dias_cosecha_aprox: numero, dificultad: unoDe('facil', 'media', 'dificil'),
    }),
    finanzas_sniim: nullable(campos({
      mercado_referencia: texto, producto_sniim: texto, mes_cosecha_estimado: esMes,
      variacion_precio_pct: numero, destacar_ahorro: booleano, mensaje_ahorro: nullable(texto),
    })),
  })),
})

const mesPrecio = campos({ mes: esMes, nombre: texto, variacion_pct: numero })
const ficha = campos({
  id: texto, nombre: texto, nombre_cientifico: texto, ecocrop_nombre: texto,
  categoria: texto, icono: texto, resumen: texto,
  ficha_tecnica: campos({
    temp_ideal_c: rango, temp_limite_c: rango, tolera_helada: booleano, altitud_max_m: numero,
    dias_a_cosecha: rango, maceta_min_litros: numero, profundidad_min_cm: numero,
    luz, riego: texto, sustrato_recomendado: texto,
  }),
  tutorial: lista(texto),
  companeros_cultivo: lista(campos({ id: texto, nombre: texto, beneficio: texto, evidencia: unoDe('comprobada', 'popular') })),
  curiosidades: lista(texto), ojo: lista(texto), fuentes: lista(texto),
  contexto_economico_sniim: nullable(campos({
    mercado_referencia: texto, producto_sniim: texto, mes_mas_caro: mesPrecio, mes_mas_barato: mesPrecio,
    estados_productores: lista(campos({ estado: texto, participacion_pct: numero })), tip_ahorro: texto,
  })),
})

function validar<T>(valor: unknown, regla: Regla): T {
  if (!regla(valor)) throw new Error('La API devolvió una respuesta incompleta o con un formato inesperado.')
  return valor as T
}

export const validarDiagnostico = (valor: unknown) => validar<Diagnostico>(valor, diagnostico)
export const validarFicha = (valor: unknown) => validar<FichaCultivo>(valor, ficha)
