import type { Diagnostico } from '../types/api'

export const toluca: Diagnostico = {
  "ubicacion": {
    "nombre": "Toluca de Lerdo",
    "municipio": "Toluca de Lerdo",
    "estado": "Estado de México",
    "lat": 19.288,
    "lon": -99.653,
    "altitud_m": 2671,
    "desde_cache": true,
    "alternativas": [
      { "nombre": "Toluca", "estado": "Estado de Chiapas", "lat": 15.029, "lon": -92.245 },
      { "nombre": "Toluca", "estado": "Estado de Puebla", "lat": 18.893, "lon": -97.250 }
    ]
  },
  "clima_zona": {
    "mes_evaluado": 12,
    "mes_nombre": "Diciembre",
    "periodo_referencia": "1996-2025",
    "temp_media_c": 11.1,
    "temp_min_promedio_c": 5.8,
    "temp_max_promedio_c": 17.9,
    "anios_con_helada_pct": 57,
    "mes_mas_frio": { "mes": 1, "nombre": "Enero", "temp_media_c": 10.7 },
    "mes_mas_caluroso": { "mes": 5, "nombre": "Mayo", "temp_media_c": 15.5 },
    "sequia": {
      "activa": true,
      "nivel": "D1",
      "nivel_nombre": "Sequía moderada",
      "fecha_dato": "2026-11-15",
      "consejo": "Usa acolchado (hojas secas) en tus macetas para que no se evapore el agua."
    }
  },
  "alertas_7_dias": [],
  "cultivos": [
    {
      "id": "lechuga",
      "nombre": "Lechuga",
      "icono": "🥬",
      "categoria": "Hortalizas",
      "estado": "con_cuidados",
      "semaforo": "amarillo",
      "razon_corta": "Diciembre es algo frío (11 °C; lo ideal es 12-21 °C). Tolera heladas ligeras: cúbrela en las noches más frías.",
      "etiqueta_clima": "Algo frío",
      "meses_ideales": [],
      "meses_posibles": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      "filtros_rapidos": {
        "maceta_min_litros": 5,
        "espacio_tipo": "maceta_chica",
        "luz": "media_sombra",
        "dias_cosecha_aprox": 55,
        "dificultad": "facil"
      },
      "finanzas_sniim": {
        "mercado_referencia": "Central de Abasto CDMX",
        "producto_sniim": "Lechuga Romanita grande",
        "mes_cosecha_estimado": 2,
        "variacion_precio_pct": -12,
        "destacar_ahorro": false,
        "mensaje_ahorro": null
      }
    },
    {
      "id": "jitomate",
      "nombre": "Jitomate",
      "icono": "🍅",
      "categoria": "Hortalizas",
      "estado": "no_ahora",
      "semaforo": "rojo",
      "razon_corta": "En diciembre hay heladas en 57% de los años y no las aguanta. Mejor siémbralo entre marzo y julio.",
      "etiqueta_clima": "Riesgo alto de helada",
      "meses_ideales": [],
      "meses_posibles": [3, 4, 5, 6, 7],
      "filtros_rapidos": {
        "maceta_min_litros": 20,
        "espacio_tipo": "maceta_grande",
        "luz": "pleno_sol",
        "dias_cosecha_aprox": 90,
        "dificultad": "media"
      },
      "finanzas_sniim": {
        "mercado_referencia": "Central de Abasto CDMX",
        "producto_sniim": "Tomate Saladette",
        "mes_cosecha_estimado": 10,
        "variacion_precio_pct": 9,
        "destacar_ahorro": false,
        "mensaje_ahorro": null
      }
    },
    {
      "id": "albahaca",
      "nombre": "Albahaca",
      "icono": "🌿",
      "categoria": "Hierbas",
      "estado": "no_ahora",
      "semaforo": "rojo",
      "razon_corta": "En diciembre hay heladas en 57% de los años y no las aguanta. Mejor siémbrala entre marzo y julio.",
      "etiqueta_clima": "Riesgo alto de helada",
      "meses_ideales": [],
      "meses_posibles": [3, 4, 5, 6, 7],
      "filtros_rapidos": {
        "maceta_min_litros": 3,
        "espacio_tipo": "maceta_chica",
        "luz": "pleno_sol",
        "dias_cosecha_aprox": 60,
        "dificultad": "facil"
      },
      "finanzas_sniim": null
    }
  ]
}
