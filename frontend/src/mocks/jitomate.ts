import type { FichaCultivo } from '../types/api'

export const jitomate: FichaCultivo = {
  "id": "jitomate",
  "nombre": "Jitomate",
  "nombre_cientifico": "Solanum lycopersicum",
  "ecocrop_nombre": "Lycopersicon esculentum",
  "categoria": "Hortalizas",
  "icono": "🍅",
  "resumen": "El cultivo estrella del huerto en casa; requiere sol directo y soporte para crecer vertical.",
  "ficha_tecnica": {
    "temp_ideal_c": [20, 27],
    "temp_limite_c": [7, 35],
    "tolera_helada": false,
    "altitud_max_m": 2400,
    "dias_a_cosecha": [70, 110],
    "maceta_min_litros": 20,
    "profundidad_min_cm": 30,
    "luz": "pleno_sol",
    "riego": "Constante en la base, sin mojar las hojas ni encharcar",
    "sustrato_recomendado": "50% tierra negra, 30% composta o humus de lombriz, 20% perlita o tepojal"
  },
  "tutorial": [
    "Siembra 2 semillas a 0.5 cm de profundidad en un semillero húmedo.",
    "Cuando la plántula mida 10-15 cm y tenga 4 hojas verdaderas, trasplántala a una maceta de al menos 20 litros.",
    "Coloca un tutor o vara desde el inicio para sostener el tallo conforme crezca.",
    "Riega cada 2 días en clima templado y a diario en calor, siempre directo a la tierra.",
    "Cosecha entre 70 y 110 días después, cuando el fruto tenga color rojo uniforme."
  ],
  "companeros_cultivo": [
    {
      "id": "albahaca",
      "nombre": "Albahaca",
      "beneficio": "Ayuda a repeler mosca blanca y pulgones.",
      "evidencia": "popular"
    },
    {
      "id": "zanahoria",
      "nombre": "Zanahoria",
      "beneficio": "Aprovecha la parte baja de la maceta sin competir por luz.",
      "evidencia": "popular"
    }
  ],
  "curiosidades": [
    "Su nombre viene del náhuatl xictomatl, que significa 'tomate con ombligo'.",
    "México es centro de domesticación del jitomate y conserva decenas de variedades criollas."
  ],
  "ojo": [
    "No lo siembres junto a papa: comparten plagas como el tizón tardío."
  ],
  "contexto_economico_sniim": {
    "mercado_referencia": "Central de Abasto CDMX",
    "producto_sniim": "Tomate Saladette",
    "mes_mas_caro": { "mes": 12, "nombre": "Diciembre", "variacion_pct": 33 },
    "mes_mas_barato": { "mes": 2, "nombre": "Febrero", "variacion_pct": -28 },
    "estados_productores": [
      { "estado": "Sinaloa", "participacion_pct": 45 },
      { "estado": "Puebla", "participacion_pct": 33 },
      { "estado": "Sonora", "participacion_pct": 14 },
      { "estado": "Michoacán", "participacion_pct": 8 }
    ],
    "tip_ahorro": "Una planta bien cuidada en maceta grande puede rendir hasta 3 kg por ciclo, evitando los picos de precio de fin de año."
  },
  "fuentes": [
    "Manual de Huerto en Casa - Universidad Veracruzana (UV)",
    "Base de datos FAO ECOCROP"
  ]
}
