import type { Diagnostico, FichaCultivo, RespuestaAlertas, SugerenciaCiudad } from '../types/api'
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
const opcional = (regla: Regla): Regla => (valor) => valor === undefined || regla(valor)
const nullable = (regla: Regla): Regla => (valor) => valor === null || regla(valor)
const unoDe = (...opciones: string[]): Regla => (valor) => typeof valor === 'string' && opciones.includes(valor)
const campos = (reglas: Record<string, Regla>): Regla => (valor) => {
  const entrada = objeto(valor)
  return entrada !== undefined && Object.entries(reglas).every(([campo, regla]) => regla(entrada[campo]))
}
const rango: Regla = (valor) => Array.isArray(valor) && valor.length === 2 && valor.every(numero) && valor[0] <= valor[1]

const luzNivel: Regla = (valor) => typeof valor === 'number' && Number.isInteger(valor) && valor >= 1 && valor <= 4
const entero: Regla = (valor) => typeof valor === 'number' && Number.isInteger(valor)
const diasRiego: Regla = (valor) => typeof valor === 'number' && Number.isInteger(valor) && valor >= 1
const consumoHidrico = unoDe('bajo', 'medio', 'alto')
const dificultad = unoDe('facil', 'media', 'dificil')
const alternativa = { nombre: texto, estado: texto, lat: numero, lon: numero }
const mesClimatico = campos({ mes: esMes, nombre: texto, temp_media_c: numero })
const alerta = campos({
  tipo: unoDe('helada', 'calor', 'lluvia_fuerte', 'tormenta', 'viento', 'uv'),
  severidad: unoDe('media', 'alta'), fecha: texto, titulo: texto, mensaje: texto,
  cultivos_afectados: opcional(lista(texto)),
})
const diagnostico = campos({
  ubicacion: campos({
    ...alternativa, municipio: texto, altitud_m: numero, desde_cache: booleano, alternativas: lista(campos(alternativa)),
  }),
  clima_zona: campos({
    mes_evaluado: esMes, mes_nombre: texto, periodo_referencia: texto,
    temp_media_c: numero, temp_min_promedio_c: numero, temp_max_promedio_c: numero,
    anios_con_helada_pct: (valor) => typeof valor === 'number' && valor >= 0 && valor <= 100,
    mes_mas_frio: mesClimatico, mes_mas_caluroso: mesClimatico,
    sequia: opcional(nullable(campos({
      activa: booleano, nivel: unoDe('D0', 'D1', 'D2', 'D3', 'D4'), nivel_nombre: texto, fecha_dato: texto, consejo: texto,
    }))),
    lluvia_mes_mm: opcional(nullable(numero)),
    origen: opcional(unoDe('open-meteo', 'conagua')),
    estacion_smn: opcional(nullable(campos({
      estacion: texto, clave: texto, distancia_km: numero, heladas_estimadas: booleano,
      altitud_estacion_m: opcional(nullable(numero)), diferencia_altitud_m: opcional(nullable(numero)),
    }))),
    lluvia_reciente: opcional(nullable(campos({
      fuente: texto, estacion: texto, distancia_km: numero, mes: texto, lluvia_mm: numero,
      normal_mm: opcional(nullable(numero)), anomalia_pct: opcional(nullable(entero)),
      temp_min_c: opcional(nullable(numero)), temp_max_c: opcional(nullable(numero)),
      mensaje: texto, consejo: texto,
    }))),
  }),
  alertas_7_dias: lista((valor) => alerta(valor)),
  cultivos: lista(campos({
    id: texto, nombre: texto, icono: texto, categoria: texto,
    estado: unoDe('optimo', 'con_cuidados', 'no_ahora'), semaforo: unoDe('verde', 'amarillo', 'rojo'),
    razon_corta: texto, etiqueta_clima: texto, meses_ideales: lista(esMes), meses_posibles: lista(esMes),
    filtros_rapidos: campos({
      maceta_min_litros: numero, espacio_tipo: unoDe('maceta_chica', 'maceta_grande', 'patio'),
      profundidad_maceta_cm: entero, luz_nivel: luzNivel, riego_frecuencia_dias: diasRiego,
      consumo_hidrico: consumoHidrico, pet_safe: booleano, atrae_polinizadores: booleano,
      es_nativa_region: booleano, dias_cosecha_aprox: entero, dificultad,
    }),
  })),
})

const ficha = campos({
  id: texto, nombre: texto, nombre_cientifico: texto, ecocrop_nombre: texto,
  categoria: texto, icono: texto, resumen: texto, es_nativa_region: booleano,
  restricciones: campos({ pet_safe: booleano, dificultad }),
  impacto_ambiental: campos({ consumo_hidrico: consumoHidrico, atrae_polinizadores: booleano }),
  guia_rapida: campos({ error_comun: texto }),
  ficha_tecnica: campos({
    temp_ideal_c: rango, temp_limite_c: rango, tolera_helada: booleano, altitud_max_m: numero,
    dias_a_cosecha: rango, maceta_min_litros: entero, profundidad_maceta_cm: entero,
    luz_nivel: luzNivel, riego_frecuencia_dias: diasRiego, riego: texto, sustrato_recomendado: texto,
  }),
  tutorial: lista(texto),
  companeros_cultivo: lista(campos({ id: texto, nombre: texto, beneficio: texto, evidencia: unoDe('comprobada', 'popular') })),
  curiosidades: lista(texto), ojo: lista(texto), fuentes: lista(texto),
})

function validar<T>(valor: unknown, regla: Regla): T {
  if (!regla(valor)) throw new Error('La API devolvió una respuesta incompleta o con un formato inesperado.')
  return valor as T
}

const semaforos = { optimo: 'verde', con_cuidados: 'amarillo', no_ahora: 'rojo' }

export function validarDiagnostico(valor: unknown): Diagnostico {
  const datos = validar<Diagnostico>(valor, diagnostico)
  if (datos.cultivos.some((cultivo) => cultivo.semaforo !== semaforos[cultivo.estado]
    || !cultivo.meses_ideales.every((mes) => cultivo.meses_posibles.includes(mes)))) {
    throw new Error('La API devolvió recomendaciones de siembra inconsistentes.')
  }
  return datos
}
export const validarFicha = (valor: unknown) => validar<FichaCultivo>(valor, ficha)

const sugerencias = lista(campos({ nombre: texto, estado: texto, municipio: texto, etiqueta: texto, lat: numero, lon: numero }))
const respuestaAlertas = campos({
  ubicacion: campos({ nombre: texto, estado: texto, lat: numero, lon: numero }),
  alertas_7_dias: lista(alerta),
  desde_cache: booleano,
})
export const validarAlertas = (valor: unknown) => validar<RespuestaAlertas>(valor, respuestaAlertas)

export const validarSugerencias = (valor: unknown) => validar<SugerenciaCiudad[]>(valor, sugerencias)
