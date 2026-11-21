export type Ubicacion = { q: string } | { lat: number; lon: number }
export type EstadoSiembra = 'optimo' | 'con_cuidados' | 'no_ahora'
export type Semaforo = 'verde' | 'amarillo' | 'rojo'
export type TipoEspacio = 'maceta_chica' | 'maceta_grande' | 'patio'
export type Luz = 'pleno_sol' | 'media_sombra' | 'sombra'
export type Dificultad = 'facil' | 'media' | 'dificil'
export type Evidencia = 'comprobada' | 'popular'
export type TipoAlerta = 'helada' | 'calor'
export type Severidad = 'media' | 'alta'

export interface Alternativa {
  nombre: string
  estado: string
  lat: number
  lon: number
}

export interface MesClimatico {
  mes: number
  nombre: string
  temp_media_c: number
}

export interface Alerta {
  tipo: TipoAlerta
  severidad: Severidad
  titulo: string
  mensaje: string
}

export interface Recomendacion {
  id: string
  nombre: string
  icono: string
  categoria: string
  estado: EstadoSiembra
  semaforo: Semaforo
  razon_corta: string
  etiqueta_clima: string
  meses_ideales: number[]
  meses_posibles: number[]
  filtros_rapidos: {
    maceta_min_litros: number
    espacio_tipo: TipoEspacio
    luz: Luz
    dias_cosecha_aprox: number
    dificultad: Dificultad
  }
  finanzas_sniim: {
    mercado_referencia: string
    producto_sniim: string
    mes_cosecha_estimado: number
    variacion_precio_pct: number
    destacar_ahorro: boolean
    mensaje_ahorro: string | null
  } | null
}

export interface Diagnostico {
  ubicacion: Alternativa & {
    municipio: string
    altitud_m: number
    desde_cache: boolean
    alternativas: Alternativa[]
  }
  clima_zona: {
    mes_evaluado: number
    mes_nombre: string
    periodo_referencia: string
    temp_media_c: number
    temp_min_promedio_c: number
    temp_max_promedio_c: number
    anios_con_helada_pct: number
    mes_mas_frio: MesClimatico
    mes_mas_caluroso: MesClimatico
    sequia: {
      activa: boolean
      nivel: string
      nivel_nombre: string
      fecha_dato: string
      consejo: string
    } | null
  }
  alertas_7_dias: Alerta[]
  cultivos: Recomendacion[]
}

export interface MesPrecio {
  mes: number
  nombre: string
  variacion_pct: number
}

export interface FichaCultivo {
  id: string
  nombre: string
  nombre_cientifico: string
  ecocrop_nombre: string
  categoria: string
  icono: string
  resumen: string
  ficha_tecnica: {
    temp_ideal_c: [number, number]
    temp_limite_c: [number, number]
    tolera_helada: boolean
    altitud_max_m: number
    dias_a_cosecha: [number, number]
    maceta_min_litros: number
    profundidad_min_cm: number
    luz: Luz
    riego: string
    sustrato_recomendado: string
  }
  tutorial: string[]
  companeros_cultivo: { id: string; nombre: string; beneficio: string; evidencia: Evidencia }[]
  curiosidades: string[]
  ojo: string[]
  fuentes: string[]
  contexto_economico_sniim: {
    mercado_referencia: string
    producto_sniim: string
    mes_mas_caro: MesPrecio
    mes_mas_barato: MesPrecio
    estados_productores: { estado: string; participacion_pct: number }[]
    tip_ahorro: string
  } | null
}

export type ErrorContrato =
  | { error: 'ciudad_no_encontrada' | 'cultivo_no_encontrado'; detail: string }
  | { error: 'clima_no_disponible'; detail: string; reintentar_en_s: number }
