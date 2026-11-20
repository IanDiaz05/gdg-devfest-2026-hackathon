# Contratos de Datos

1. `GET /api/recomendaciones`: Un único contrato maestro que alimenta **4 de las 5 pantallas** (Tu zona, Qué sembrar este mes, Alertas de 7 días y el Calendario anual).
2. `GET /api/cultivos/{id}`: Un contrato de detalle bajo demanda para la pantalla de la **Ficha del cultivo** (tutorial, compañeros y curiosidades).

---

### Contrato 1: Diagnóstico y Recomendaciones

**Petición:** `GET /api/recomendaciones?q=Toluca&mes=12` (o usando `?lat=19.28&lon=-99.65&mes=12` si usan GPS del navegador).

Este JSON ya incluye `meses_recomendados` y `espacio_tipo` dentro de cada cultivo para que el frontend pueda renderizar el **calendario anual** y filtrar por **tamaño de maceta** localmente sin volver a consultar al servidor.21

```json
{
  "ubicacion": {
    "nombre": "Toluca de Lerdo",
    "estado": "Estado de México",
    "lat": 19.2826,
    "lon": -99.6557,
    "altitud_m": 2667,
    "desde_cache": true
  },
  "clima_zona": {
    "mes_evaluado": 12,
    "mes_nombre": "Diciembre",
    "temp_media_c": 11.0,
    "temp_min_promedio_c": 2.8,
    "temp_max_promedio_c": 19.2,
    "probabilidad_helada_pct": 57,
    "mes_mas_frio": {
      "mes": 1,
      "nombre": "Enero",
      "temp_media_c": 10.2
    },
    "mes_mas_caluroso": {
      "mes": 5,
      "nombre": "Mayo",
      "temp_media_c": 16.5
    },
    "sequia": {
      "activa": true,
      "nivel": "D1 - Sequía Moderada",
      "consejo": "Usa acolchado (hojas secas) en tus macetas para evitar que se evapore el agua."
    }
  },
  "alertas_7_dias": [
    {
      "tipo": "helada",
      "severidad": "alta",
      "titulo": "Alerta de helada esta semana",
      "mensaje": "Se pronostican mínimas de 1 °C este jueves. Mete tus macetas o cúbrelas por la noche."
    }
  ],
  "cultivos": [
    {
      "id": "lechuga",
      "nombre": "Lechuga",
      "icono": "🥬",
      "categoria": "Hortalizas",
      "estado": "con_cuidados",
      "semaforo": "amarillo",
      "razon_corta": "Tolera frío ligero, pero debes cubrirla en las noches más heladas de diciembre y enero.",
      "etiqueta_clima": "Proteger de heladas fuertes",
      "meses_recomendados": [2, 3, 4, 5, 6, 7, 8, 9, 10],
      "filtros_rapidos": {
        "maceta_min_litros": 5,
        "espacio_tipo": "maceta_chica",
        "luz": "media_sombra",
        "dias_cosecha_aprox": 55,
        "dificultad": "facil"
      },
      "finanzas_sniim": {
        "destacar_ahorro": false,
        "mes_cosecha_estimado": "Febrero",
        "variacion_precio_pct": 8,
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
      "razon_corta": "En diciembre hay heladas en el 57% de los años y no las aguanta. Mejor siémbralo entre marzo y julio.",
      "etiqueta_clima": "Riesgo alto de helada",
      "meses_recomendados": [3, 4, 5, 6, 7],
      "filtros_rapidos": {
        "maceta_min_litros": 20,
        "espacio_tipo": "maceta_grande",
        "luz": "pleno_sol",
        "dias_cosecha_aprox": 90,
        "dificultad": "media"
      },
      "finanzas_sniim": {
        "destacar_ahorro": true,
        "mes_cosecha_estimado": "Marzo",
        "variacion_precio_pct": 34,
        "mensaje_ahorro": "Si lo siembras en su temporada ideal, cosechas cuando sube +34% en central de abasto."
      }
    }
  ]
}

```

#### Notas clave de diseño para este contrato:

* `estado` **y** `semaforo` **separados:** El backend manda valores estrictos (`siembra_ahora`, `con_cuidados`, `no_ahora`) para que el frontend agrupe las pestañas o tarjetas sin tener que adivinar textos.
* `espacio_tipo` **precalculado:** Clasificado desde el backend en tres categorías (`maceta_chica` $\le$ 8L, `maceta_grande` 9-25L, `patio` > 25L) para que los botones de filtro en pantalla funcionen al instante.
* `sequia` **y** `alertas_7_dias` **opcionales:** Si en las últimas horas no alcanzan a conectar CONAGUA o no hay alertas activas en los próximos 7 días, el backend simplemente devuelve `"sequia": null` y `"alertas_7_dias": []` sin romper la interfaz.

---

### Contrato 2: Ficha Detallada del Cultivo

**Petición:** `GET /api/cultivos/{id}` (ej. `/api/cultivos/jitomate`).

Este contrato sale directamente de su archivo curado `cultivos.json`, por lo que responde en <10 ms y alimenta la vista educativa y práctica del huerto.

```json
{
  "id": "jitomate",
  "nombre": "Jitomate",
  "nombre_cientifico": "Solanum lycopersicum",
  "categoria": "Hortalizas",
  "icono": "🍅",
  "resumen": "El rey del huerto urbano. Requiere buen sol y soporte conforme crece, pero produce varios kilos por planta.",
  "ficha_tecnica": {
    "temp_ideal_c": [20, 27],
    "temp_limite_c": [7, 35],
    "tolera_helada": false,
    "dias_a_cosecha": [70, 110],
    "maceta_min_litros": 20,
    "profundidad_min_cm": 30,
    "luz": "Pleno sol (6 a 8 horas diarias)",
    "riego": "Constante sin encharcar; riega directo a la tierra, no a las hojas.",
    "sustrato_recomendado": "50% tierra negra, 30% composta o humus de lombriz, 20% perlita o tepojal."
  },
  "tutorial": [
    {
      "paso": 1,
      "titulo": "Germinación en semillero",
      "detalle": "Siembra las semillas a 0.5 cm de profundidad en un vaso con tierra húmeda. Germinan en 6 a 10 días."
    },
    {
      "paso": 2,
      "titulo": "Trasplante a maceta definitiva",
      "detalle": "Cuando la planta mida 15 cm y tenga 4 hojas verdaderas, pásala a su maceta de al menos 20 litros."
    },
    {
      "paso": 3,
      "titulo": "Tutorado y poda",
      "detalle": "Coloca un palo o guía para que no se quiebre con el peso y quita los brotes ('chupones') entre el tallo y las ramas."
    },
    {
      "paso": 4,
      "titulo": "Cosecha",
      "detalle": "Corta los frutos cuando tengan color rojo uniforme pero sigan firmes al tacto."
    }
  ],
  "companeros_cultivo": {
    "aliados": [
      {
        "id": "albahaca",
        "nombre": "Albahaca",
        "motivo": "Ahuyenta mosca blanca y pulgones, además de mejorar el sabor del fruto."
      },
      {
        "id": "zanahoria",
        "nombre": "Zanahoria",
        "motivo": "Aprovecha la parte profunda de la maceta sin competir por luz."
      }
    ],
    "evitar": [
      {
        "id": "papa",
        "nombre": "Papa",
        "motivo": "Son de la misma familia y se contagian plagas como el tizón tardío."
      }
    ]
  },
  "curiosidades": [
    "Su nombre viene del náhuatl 'xitomatl', que significa fruto con ombligo.",
    "Aunque en la cocina se usa como verdura, botánicamente es una fruta."
  ],
  "contexto_economico_sniim": {
    "mes_mas_caro": "Octubre (+42% sobre el promedio anual)",
    "mes_mas_barato": "Marzo (-28% sobre el promedio anual)",
    "estados_productores": ["Sinaloa", "San Luis Potosí", "Michoacán"],
    "tip_ahorro": "Una sola planta bien cuidada en azotea puede dar entre 3 y 5 kg de jitomate por ciclo."
  }
}

```