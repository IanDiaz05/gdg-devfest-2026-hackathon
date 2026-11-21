import { ErrorApi } from '../services/api'
import type { Diagnostico, FichaCultivo, Recomendacion, Ubicacion } from '../types/api'
import { normalizar, meses } from '../utils/consulta'
import { jitomate } from './jitomate'
import { toluca } from './toluca-diciembre'

const [lechuga, tomate, albahaca] = toluca.cultivos
const merida: Diagnostico = {
  ubicacion: {
    nombre: 'Mérida', municipio: 'Mérida', estado: 'Yucatán',
    lat: 20.967, lon: -89.623, altitud_m: 10, desde_cache: true, alternativas: [],
  },
  clima_zona: {
    mes_evaluado: 12, mes_nombre: 'Diciembre', periodo_referencia: '1996-2025',
    temp_media_c: 24, temp_min_promedio_c: 18, temp_max_promedio_c: 30, anios_con_helada_pct: 0,
    mes_mas_frio: { mes: 1, nombre: 'Enero', temp_media_c: 23 },
    mes_mas_caluroso: { mes: 5, nombre: 'Mayo', temp_media_c: 30 },
    sequia: null,
  },
  alertas_7_dias: [{
    tipo: 'calor', severidad: 'media', titulo: 'Calor esta semana',
    mensaje: 'En este ejemplo se esperan máximas de 35 °C. Revisa la humedad de tus macetas.',
  }],
  cultivos: [
    {
      ...tomate, estado: 'optimo', semaforo: 'verde', etiqueta_clima: 'Temperatura ideal',
      razon_corta: 'Diciembre en Mérida está en el rango ideal del jitomate (20–27 °C).',
      meses_ideales: [10, 11, 12, 1], meses_posibles: [1, 2, 10, 11, 12],
      finanzas_sniim: {
        mercado_referencia: 'Central de Abasto CDMX', producto_sniim: 'Tomate Saladette',
        mes_cosecha_estimado: 3, variacion_precio_pct: 18, destacar_ahorro: true,
        mensaje_ahorro: 'En este ejemplo, la cosecha coincide con un precio 18% mayor al promedio.',
      },
    },
    {
      ...lechuga, etiqueta_clima: 'Algo caluroso', meses_ideales: [],
      meses_posibles: [1, 2, 11, 12],
      razon_corta: 'Diciembre puede resultar algo caluroso para la lechuga.',
      finanzas_sniim: null,
    },
    {
      ...albahaca, estado: 'optimo', semaforo: 'verde', etiqueta_clima: 'Temperatura ideal',
      razon_corta: 'El invierno cálido de Mérida favorece el crecimiento de la albahaca.',
      meses_ideales: [1, 2, 11, 12], meses_posibles: [1, 2, 3, 10, 11, 12],
    },
  ],
}

const monterrey: Diagnostico = {
  ubicacion: {
    nombre: 'Monterrey', municipio: 'Monterrey', estado: 'Nuevo León',
    lat: 25.686, lon: -100.316, altitud_m: 540, desde_cache: true, alternativas: [],
  },
  clima_zona: {
    ...toluca.clima_zona, temp_media_c: 15, temp_min_promedio_c: 8, temp_max_promedio_c: 22,
    anios_con_helada_pct: 23, sequia: null,
    mes_mas_frio: { mes: 1, nombre: 'Enero', temp_media_c: 14 },
    mes_mas_caluroso: { mes: 8, nombre: 'Agosto', temp_media_c: 30 },
  },
  alertas_7_dias: [{
    tipo: 'helada', severidad: 'alta', titulo: 'Riesgo de helada esta semana',
    mensaje: 'En este ejemplo se esperan 0 °C. Resguarda tus macetas por la noche.',
  }],
  cultivos: [
    { ...lechuga, razon_corta: 'Necesita protección durante las noches frías.' },
    ...[tomate, albahaca].map((cultivo) => ({
      ...cultivo, meses_ideales: [3, 4, 9], meses_posibles: [3, 4, 5, 6, 7, 8, 9, 10],
      razon_corta: 'En diciembre hay riesgo de helada. En primavera comienza su ventana de siembra.',
      finanzas_sniim: null,
    })),
  ],
}

const alternativas: Diagnostico[] = toluca.ubicacion.alternativas.map((lugar, indice) => ({
  ...(indice === 0 ? merida : monterrey),
  ubicacion: { ...lugar, municipio: lugar.nombre, altitud_m: indice === 0 ? 25 : 2080, desde_cache: true, alternativas: [] },
  alertas_7_dias: [],
}))

const zonas = [toluca, merida, monterrey, ...alternativas]
const nombres = new Map([['toluca', toluca], ['toluca de lerdo', toluca], ['merida', merida], ['monterrey', monterrey]])
const semaforos = { optimo: 'verde', con_cuidados: 'amarillo', no_ahora: 'rojo' } as const

function evaluar(cultivo: Recomendacion, mes: number): Recomendacion {
  const estado = cultivo.meses_ideales.includes(mes) ? 'optimo'
    : cultivo.meses_posibles.includes(mes) ? 'con_cuidados' : 'no_ahora'
  return {
    ...cultivo, estado, semaforo: semaforos[estado], finanzas_sniim: null,
    etiqueta_clima: estado === 'optimo' ? 'Mes ideal' : estado === 'con_cuidados' ? 'Siembra con cuidados' : 'Fuera de temporada',
    razon_corta: `Evaluación de ejemplo para ${meses[mes - 1].toLocaleLowerCase('es-MX')} según el calendario de esta zona.`,
  }
}

export function diagnosticoDemo(ubicacion: Ubicacion, mes = 12): Diagnostico {
  const zona = 'q' in ubicacion ? nombres.get(normalizar(ubicacion.q)) : zonas.find(({ ubicacion: lugar }) =>
    Math.hypot(lugar.lat - ubicacion.lat, lugar.lon - ubicacion.lon) <= 0.25,
  )
  if (!zona) throw new ErrorApi('La demo incluye Toluca, Mérida y Monterrey. Prueba con alguna de estas ciudades.', 404, 'ciudad_no_encontrada')
  if (mes === 12) return zona
  const clima = zona.clima_zona
  const extremos = [clima.mes_mas_frio, clima.mes_mas_caluroso]
  const promedio = extremos.find((extremo) => extremo.mes === mes)?.temp_media_c ?? clima.temp_media_c
  const diferencia = promedio - clima.temp_media_c
  return {
    ...zona,
    clima_zona: {
      ...clima, mes_evaluado: mes, mes_nombre: meses[mes - 1], temp_media_c: promedio,
      temp_min_promedio_c: Number((clima.temp_min_promedio_c + diferencia).toFixed(1)),
      temp_max_promedio_c: Number((clima.temp_max_promedio_c + diferencia).toFixed(1)),
    },
    cultivos: zona.cultivos.map((cultivo) => evaluar(cultivo, mes)),
  }
}

const fichas: FichaCultivo[] = [
  jitomate,
  {
    id: lechuga.id, nombre: lechuga.nombre, icono: lechuga.icono, categoria: lechuga.categoria,
    nombre_cientifico: 'Lactuca sativa', ecocrop_nombre: 'Lactuca sativa',
    resumen: 'Una hortaliza de hoja para macetas con buena humedad y luz suave.',
    ficha_tecnica: {
      temp_ideal_c: [12, 21], temp_limite_c: [5, 28], tolera_helada: true, altitud_max_m: 3000,
      dias_a_cosecha: [45, 65], maceta_min_litros: 5, profundidad_min_cm: 15, luz: 'media_sombra',
      riego: 'Mantén la tierra húmeda y evita encharcar.', sustrato_recomendado: 'Tierra suelta con composta.',
    },
    tutorial: ['Siembra las semillas cerca de la superficie.', 'Separa las plántulas para que tengan espacio.', 'Corta primero las hojas exteriores.'],
    ojo: ['Protege las hojas del calor intenso.'], companeros_cultivo: [],
    curiosidades: ['Puedes cosechar las hojas exteriores mientras el centro sigue creciendo.'],
    fuentes: [], contexto_economico_sniim: null,
  },
  {
    id: albahaca.id, nombre: albahaca.nombre, icono: albahaca.icono, categoria: albahaca.categoria,
    nombre_cientifico: 'Ocimum basilicum', ecocrop_nombre: 'Ocimum basilicum',
    resumen: 'Hierba aromática que crece bien con sol y un sustrato que drene.',
    ficha_tecnica: {
      temp_ideal_c: [20, 28], temp_limite_c: [10, 35], tolera_helada: false, altitud_max_m: 2500,
      dias_a_cosecha: [50, 70], maceta_min_litros: 3, profundidad_min_cm: 15, luz: 'pleno_sol',
      riego: 'Riega cuando empiece a secarse la superficie.', sustrato_recomendado: 'Tierra con composta y material para drenaje.',
    },
    tutorial: ['Siembra en sustrato húmedo.', 'Coloca la maceta en una zona soleada.', 'Corta las puntas para estimular nuevas ramas.'],
    ojo: ['Resguarda la maceta cuando haya riesgo de helada.'], companeros_cultivo: [],
    curiosidades: ['Existen variedades de hojas verdes y moradas.'], fuentes: [], contexto_economico_sniim: null,
  },
]

export function fichaDemo(id: string): FichaCultivo {
  const ficha = fichas.find((cultivo) => cultivo.id === id)
  if (!ficha) throw new ErrorApi('El cultivo solicitado no existe en el catálogo de ejemplo.', 404, 'cultivo_no_encontrado')
  return ficha
}
