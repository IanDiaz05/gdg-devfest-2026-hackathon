# Contratos de Datos

> Versión 2 (20-nov-2026). Corregida según [`revision-contratos.md`](revision-contratos.md). **Este archivo es la versión oficial** de los contratos; si algo no coincide con el README, manda este.

Son dos endpoints:

1. `GET /api/recomendaciones`: un único contrato maestro que alimenta **4 de las 5 pantallas** (Tu zona, Qué sembrar este mes, Alertas de 7 días y Calendario anual).
2. `GET /api/cultivos/{id}`: un contrato de detalle, bajo demanda, para la pantalla **Ficha del cultivo** (tutorial, compañeros de cultivo, curiosidades y contexto de precios).

**Leyenda de origen de cada dato**

| Icono | Origen |
|---|---|
| 🌐 | API externa (Open-Meteo), con caché |
| ⚙️ | Calculado por nuestro backend |
| 📦 | Archivo preparado antes de la demo (ECOCROP, SNIIM, Monitor de Sequía) |
| ✍️ | Escrito o curado a mano en `cultivos.json` |
| 🧩 | Derivado de otro campo del mismo JSON |

---

## Contrato 1: Diagnóstico y recomendaciones

**Petición**

```
GET /api/recomendaciones?q=Toluca&mes=12
GET /api/recomendaciones?lat=19.288&lon=-99.653&mes=12      (GPS del navegador)
```

| Parámetro | Obligatorio | Notas |
|---|---|---|
| `q` | `q` **o** `lat`+`lon` | Nombre de ciudad. Se busca solo en México (`countryCode=MX`) |
| `lat`, `lon` | `q` **o** `lat`+`lon` | Con GPS no hay nombre de lugar ni municipio: `ubicacion.nombre = "Tu ubicación"` y `sequia = null` |
| `mes` | No | 1-12. Si no se manda, se usa el mes actual |

El JSON ya incluye `meses_ideales`, `meses_posibles` y `espacio_tipo` dentro de cada cultivo, para que el frontend pueda dibujar el **calendario anual** y filtrar por **tamaño de maceta** sin volver a consultar el servidor.

**Respuesta** (datos reales de Toluca para diciembre)

```json
{
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
      { "nombre": "Toluca", "estado": "Estado de Puebla", "lat": 18.893, "lon": -97.25 }
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
```

> En Toluca el jitomate y la lechuga nunca salen ✅ porque el clima siempre queda un poco por debajo de su ideal; por eso `meses_ideales` está vacío. Es lo correcto para una zona fría. En Mérida sí saldrían meses ideales.

### Ejemplo de alerta (cuando sí hay)

Hoy `alertas_7_dias` viene vacío para Toluca: la mínima pronosticada del 20 al 26 de noviembre va de 6.7 a 9.5 °C. Cuando hay alerta, se ve así:

```json
{
  "tipo": "helada",
  "severidad": "alta",
  "fecha": "2026-12-10",
  "temp_c": -1.0,
  "titulo": "Alerta de helada esta semana",
  "mensaje": "Se pronostica una mínima de -1 °C el miércoles. Mete tus macetas o cúbrelas por la noche."
}
```

### De dónde sale cada campo

| Campo | Origen | Cómo se obtiene |
|---|---|---|
| `ubicacion.nombre`, `municipio`, `estado`, `lat`, `lon`, `altitud_m` | 🌐 | Open-Meteo Geocoding (`name`, `admin2`, `admin1`, `latitude`, `longitude`, `elevation`). Si hay varios resultados, se elige el de **mayor población** |
| `ubicacion.alternativas` | 🌐 | Los demás resultados del geocoding (máximo 4) |
| `ubicacion.desde_cache` | ⚙️ | Bandera del backend |
| `clima_zona.temp_*`, `mes_mas_frio`, `mes_mas_caluroso` | ⚙️ | Promedios por mes de 30 años de clima diario (Open-Meteo Historical, 1996-2025) |
| `clima_zona.anios_con_helada_pct` | ⚙️ | % de años en que ese mes tuvo **al menos una noche con mínima ≤ 2 °C**. No es la probabilidad de que hiele mañana |
| `clima_zona.sequia` | 📦 | Monitor de Sequía (CONAGUA), último reporte del municipio. Cruce por estado + nombre normalizado ("toluca de lerdo" ⊃ "toluca"). `activa = true` solo con D1 o más (D0 = anormalmente seco). Si no se encuentra el municipio → `null` |
| `clima_zona.sequia.consejo` | ✍️ | Un texto fijo por nivel (D0 a D4) |
| `alertas_7_dias` | ⚙️ | Open-Meteo Forecast, 7 días. Helada: mínima ≤ 2 °C (`alta` si ≤ 0 °C, `media` si está entre 0 y 2 °C). Calor: máxima ≥ 35 °C |
| `cultivos[].id`, `nombre`, `icono`, `categoria` | ✍️ | `cultivos.json` |
| `cultivos[].estado`, `razon_corta`, `etiqueta_clima` | ⚙️ | Motor de reglas (README, sección 7). La razón es la de la **primera regla que no se cumple** |
| `cultivos[].semaforo` | 🧩 | `siembra_ahora` → `verde`, `con_cuidados` → `amarillo`, `no_ahora` → `rojo` |
| `cultivos[].meses_ideales` | ⚙️ | Meses de siembra en los que el cultivo sale `siembra_ahora` (las reglas corren 12 veces) |
| `cultivos[].meses_posibles` | ⚙️ | Meses en los que sale `siembra_ahora` **o** `con_cuidados` |
| `filtros_rapidos.maceta_min_litros`, `luz`, `dificultad` | ✍️ | `cultivos.json` |
| `filtros_rapidos.dias_cosecha_aprox` | ✍️ | Parte de `GMIN`/`GMAX` de ECOCROP, ajustado a mano |
| `filtros_rapidos.espacio_tipo` | 🧩 | De `maceta_min_litros` |
| `finanzas_sniim` | 📦 + ⚙️ | `sniim_perfiles.json` (ver abajo). `null` si el cultivo no está en SNIIM |

### Valores permitidos

| Campo | Valores |
|---|---|
| `estado` | `siembra_ahora`, `con_cuidados`, `no_ahora` |
| `semaforo` | `verde`, `amarillo`, `rojo` |
| `espacio_tipo` | `maceta_chica` (≤ 8 L), `maceta_grande` (9-25 L), `patio` (> 25 L) |
| `luz` | `pleno_sol`, `media_sombra`, `sombra` |
| `dificultad` | `facil`, `media`, `dificil` |
| `sequia.nivel` | `D0`, `D1`, `D2`, `D3`, `D4` |
| `alertas_7_dias[].tipo` | `helada`, `calor` |
| `alertas_7_dias[].severidad` | `alta`, `media` |
| Meses (`mes_*`, `meses_*`) | Números del 1 al 12 |

### Cómo se calcula `finanzas_sniim`

**Antes de la demo** se genera `sniim_perfiles.json` con los precios de la Central de Abasto CDMX de 2021-2026. Para cada cultivo, con una variante fija (`producto_sniim`), se calcula el **% sobre o bajo el promedio de cada año, por mes**.

En cada consulta:
- `mes_cosecha_estimado` = mes de siembra + `dias_cosecha_aprox` / 30 (redondeado).
- `variacion_precio_pct` = el valor del perfil en ese mes.
- `destacar_ahorro` = `variacion_precio_pct >= 15`.
- `mensaje_ahorro` = plantilla, solo si `destacar_ahorro`. Ejemplo: *"Si lo siembras en agosto, lo cosechas en noviembre, cuando en la Central de Abasto cuesta 29% más que el promedio."*

**Cultivos sin datos en SNIIM** (`finanzas_sniim: null`): rábano, perejil, albahaca, romero, hierbabuena, amaranto y frijol. El frijol está en otra sección de SNIIM (granos) que todavía no probamos.

### Notas de diseño

- **`estado` y `semaforo` separados:** el backend manda valores fijos (`siembra_ahora`, `con_cuidados`, `no_ahora`) para que el frontend agrupe las pestañas o tarjetas sin interpretar textos.
- **`espacio_tipo` precalculado:** clasificado en el backend para que los botones de filtro respondan al instante.
- **`sequia` y `alertas_7_dias` opcionales:** si no hay datos de CONAGUA para el municipio, o no hay alertas en los próximos 7 días, el backend devuelve `"sequia": null` y `"alertas_7_dias": []` sin romper la interfaz.
- **`meses_ideales` y `meses_posibles` separados:** con una sola lista no se sabía si "recomendado" incluía los meses "con cuidados".
- **Precios de referencia:** SNIIM es de la Central de Abasto de CDMX. El frontend debe mostrar `mercado_referencia`.

---

## Contrato 2: Ficha detallada del cultivo

**Petición:** `GET /api/cultivos/{id}` (por ejemplo, `/api/cultivos/jitomate`).

Sale directamente de `cultivos.json` (✍️) más `sniim_perfiles.json` (📦), así que responde en menos de 10 ms.

```json
{
  "id": "jitomate",
  "nombre": "Jitomate",
  "nombre_cientifico": "Solanum lycopersicum",
  "ecocrop_nombre": "Lycopersicon esculentum",
  "categoria": "Hortalizas",
  "icono": "🍅",
  "resumen": "El rey del huerto urbano. Requiere buen sol y un soporte conforme crece, pero produce varios kilos por planta.",
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
        "motivo": "Se dice que ahuyenta la mosca blanca y los pulgones.",
        "evidencia": "popular"
      },
      {
        "id": "zanahoria",
        "nombre": "Zanahoria",
        "motivo": "Aprovecha la parte profunda de la maceta sin competir por luz.",
        "evidencia": "popular"
      }
    ],
    "evitar": [
      {
        "id": "papa",
        "nombre": "Papa",
        "motivo": "Son de la misma familia y se contagian enfermedades como el tizón tardío.",
        "evidencia": "comprobada"
      }
    ]
  },
  "curiosidades": [
    "Su nombre viene del náhuatl 'xitomatl', que suele traducirse como 'tomate de ombligo'.",
    "Aunque en la cocina se usa como verdura, botánicamente es una fruta."
  ],
  "ojo": [
    "Las hojas y los tallos no se comen y son tóxicos para perros y gatos."
  ],
  "fuentes": [
    "Manual de huerto en casa, Universidad Veracruzana (2020)",
    "FAO ECOCROP: Lycopersicon esculentum"
  ],
  "contexto_economico_sniim": {
    "mercado_referencia": "Central de Abasto CDMX",
    "producto_sniim": "Tomate Saladette",
    "periodo": "2021-2026",
    "perfil_mensual_pct": [16, -28, -16, -3, 1, -15, -13, -6, 5, 9, 29, 33],
    "mes_mas_caro": { "mes": 12, "nombre": "Diciembre", "pct": 33 },
    "mes_mas_barato": { "mes": 2, "nombre": "Febrero", "pct": -28 },
    "estados_productores": [
      { "estado": "Sinaloa", "pct": 45 },
      { "estado": "Puebla", "pct": 33 },
      { "estado": "Sonora", "pct": 14 },
      { "estado": "Michoacán", "pct": 8 }
    ],
    "tip_ahorro": "Una planta bien cuidada en maceta grande puede darte varios kilos por temporada, justo cuando el jitomate se encarece."
  }
}
```

### De dónde sale cada campo

| Campo | Origen | Notas |
|---|---|---|
| `id`, `nombre`, `nombre_cientifico`, `categoria`, `icono`, `resumen` | ✍️ | |
| `ecocrop_nombre` | 📦 | Nombre en ECOCROP, que a veces usa nombres antiguos. Sirve para rastrear de dónde salieron los números |
| `ficha_tecnica.temp_ideal_c` | 📦 | ECOCROP `TOPMN`, `TOPMX` |
| `ficha_tecnica.temp_limite_c` | 📦 | ECOCROP `TMIN`, `TMAX` |
| `ficha_tecnica.tolera_helada` | ✍️ | **No** usar el `KTMP` de ECOCROP: falta en 55% de las especies |
| `ficha_tecnica.dias_a_cosecha` | ✍️ | Parte de ECOCROP `GMIN`/`GMAX` (jitomate: 70-150), ajustado a mano |
| `maceta_min_litros`, `profundidad_min_cm`, `luz`, `riego`, `sustrato_recomendado` | ✍️ | |
| `tutorial[]`, `curiosidades[]`, `ojo[]`, `fuentes[]` | ✍️ | Escritos con nuestras palabras y verificados |
| `companeros_cultivo[].evidencia` | ✍️ | `popular` (conocimiento tradicional) o `comprobada` (hay respaldo técnico) |
| `contexto_economico_sniim` | 📦 | `sniim_perfiles.json`. `perfil_mensual_pct` va de enero (índice 0) a diciembre (índice 11). `null` si el cultivo no está en SNIIM |

---

## Errores

Todas las respuestas de error usan el mismo formato:

```json
{
  "error": {
    "codigo": "ciudad_no_encontrada",
    "mensaje": "No encontramos 'Tolucaa' en México. Revisa el nombre o usa tu ubicación."
  }
}
```

| HTTP | `codigo` | Cuándo |
|---|---|---|
| 400 | `parametros_invalidos` | Falta `q` y también `lat`/`lon`, o `mes` no está entre 1 y 12 |
| 404 | `ciudad_no_encontrada` | El geocoding no devuelve resultados en México |
| 404 | `cultivo_no_encontrado` | El `id` no existe en `cultivos.json` |
| 503 | `clima_no_disponible` | Open-Meteo respondió 429 o no responde, y no hay caché para esa zona. Se agrega `"reintentar_en_s": 60` |
