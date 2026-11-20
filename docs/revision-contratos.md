# Revisión de los contratos JSON: qué es viable y de dónde sale cada dato

Revisión de [`json-contracts.md`](json-contracts.md) y del [`README.md`](../README.md), comparada con **datos reales consultados el 20-nov-2026** (Open-Meteo, Monitor de Sequía, ECOCROP y SNIIM).

> ✅ **Estado:** las 6 correcciones ya están aplicadas en `json-contracts.md` (versión 2) y en el README. Este documento queda como registro de por qué se cambió cada cosa.

---

## Resumen

**Los dos contratos son viables.** Todos los campos se pueden llenar con datos que ya probamos. Hay que corregir **6 cosas** antes de que el frontend los use:

| # | Problema | Gravedad | Arreglo |
|---|---|---|---|
| 1 | `meses_recomendados` es ambiguo: la lechuga está "con cuidados" en diciembre, pero diciembre no aparece en su lista | 🔴 Alta | Separar en `meses_ideales` (✅) y `meses_posibles` (✅ + ⚠️) |
| 2 | Los números de SNIIM del ejemplo están inventados y no coinciden con los datos reales (jitomate: "octubre +42%" → en realidad **diciembre +33%**) | 🔴 Alta | Calcularlos de SNIIM (ver sección 5) |
| 3 | El cruce con la sequía no es directo: el buscador devuelve "Toluca de Lerdo" y el Monitor de Sequía dice "Toluca" | 🟠 Media | Cruzar por estado + nombre normalizado (ver sección 3) |
| 4 | `?q=Toluca` devuelve **5 lugares** en México (Edomex, Chiapas, Puebla, Michoacán…) | 🟠 Media | Elegir el de mayor población y devolver `alternativas` |
| 5 | 7 de los 28 cultivos **no están en SNIIM** (rábano, perejil, albahaca, romero, hierbabuena, frijol, amaranto) | 🟡 Baja | `finanzas_sniim: null` para esos cultivos |
| 6 | El README y los contratos usan **nombres de campos y endpoints distintos** | 🟡 Baja | Tomar `json-contracts.md` como la versión oficial y actualizar el README |

---

## 1. Leyenda: de dónde sale cada dato

| Icono | Origen | Qué significa |
|---|---|---|
| 🌐 | **API directa** | Sale tal cual de una API externa, en cada consulta (con caché) |
| ⚙️ | **Procesado** | Lo calcula nuestro backend a partir de datos de una API |
| 📦 | **Archivo precalculado** | Se descarga y procesa **antes de la demo** (SNIIM, sequía, ECOCROP) y se guarda en el backend |
| ✍️ | **Curado a mano** | Lo escribe o revisa el equipo en `cultivos.json` (con ayuda de IA, verificado) |
| 🧩 | **Derivado** | Se calcula a partir de otro campo del mismo JSON; podría hacerlo el frontend |

---

## 2. Contrato 1: `GET /api/recomendaciones`

### `ubicacion`

| Campo | Origen | Cómo se obtiene | ¿Viable? | Notas |
|---|---|---|---|---|
| `nombre` | 🌐 | Open-Meteo Geocoding → `name` | ✅ | Probado: "Toluca de Lerdo" |
| `estado` | 🌐 | Geocoding → `admin1` | ✅ | Viene como "Estado de México" |
| `lat`, `lon` | 🌐 | Geocoding, o el GPS del navegador | ✅ | Con GPS no hay nombre: hay que usar *reverse geocoding* o mostrar "Tu ubicación" |
| `altitud_m` | 🌐 | Geocoding → `elevation`, o la API Elevation | ✅ | Toluca: 2,671 m (geocoding) / 2,656 m (Elevation API) |
| `desde_cache` | ⚙️ | Bandera del backend | ✅ | Útil para depurar |
| *(nuevo)* `municipio` | 🌐 | Geocoding → `admin2` | ✅ | **Hace falta** para cruzar con la sequía |
| *(nuevo)* `alternativas` | 🌐 | Los otros resultados del geocoding | ✅ | Para "¿Quisiste decir Toluca, Chiapas?" |

### `clima_zona`

Todo sale de **30 años de clima diario** (Open-Meteo Historical, 1996-2025), con **una sola llamada por zona** que se guarda en caché.

| Campo | Origen | Cómo se calcula | ¿Viable? | Valor real para Toluca (dic) | Ejemplo del contrato |
|---|---|---|---|---|---|
| `mes_evaluado`, `mes_nombre` | 🧩 | Del parámetro `mes`, o el mes actual | ✅ | 12, Diciembre | ✔️ |
| `temp_media_c` | ⚙️ | Promedio de `temperature_2m_mean` en ese mes | ✅ | **11.1** | 11.0 ✔️ |
| `temp_min_promedio_c` | ⚙️ | Promedio de `temperature_2m_min` | ✅ | **5.8** | 2.8 ❌ inventado |
| `temp_max_promedio_c` | ⚙️ | Promedio de `temperature_2m_max` | ✅ | **17.9** | 19.2 ❌ inventado |
| `probabilidad_helada_pct` | ⚙️ | % de años con al menos 1 noche con mínima ≤ 2 °C en ese mes | ✅ | **57** | 57 ✔️ |
| `mes_mas_frio` | ⚙️ | Mes con menor temperatura media | ✅ | **Enero, 10.7** | Enero, 10.2 (aprox.) |
| `mes_mas_caluroso` | ⚙️ | Mes con mayor temperatura media | ✅ | **Mayo, 15.5** | Mayo, 16.5 (aprox.) |
| `sequia.activa` | 📦 | Monitor de Sequía: `true` si el nivel es D1 o más | ✅ | **true** (D1 al 15-nov-2026) | ✔️ |
| `sequia.nivel` | 📦 | Último valor del municipio: D0 a D4 | ✅ | **"D1"** | ✔️ |
| `sequia.consejo` | ✍️ | Texto fijo según el nivel (5 textos) | ✅ | — | ✔️ |

> ⚠️ **Hay que documentar qué significa `probabilidad_helada_pct`.** No es la "probabilidad de que hiele mañana", sino *"en qué % de los últimos 30 años ese mes tuvo al menos una noche con riesgo de helada"*. Sugerencia: renombrarlo a `anios_con_helada_pct` o explicarlo en un tooltip.

**Datos del Monitor de Sequía (revisados):**
- Un solo Excel de 2 MB, con una hoja `MUNICIPIOS` de 2,478 municipios.
- Tiene 448 columnas: 8 de datos del municipio y una por cada fecha de reporte (más de 400), hasta el **15-nov-2026**.
- Columnas clave: `CVE_ENT`, `CVE_MUN`, `NOMBRE_MUN`, `ENTIDAD`.
- Valores: vacío = sin sequía, `D0` = anormalmente seco (**todavía no es sequía**), `D1` a `D4` = de moderada a excepcional.
- En la última quincena: 1,170 municipios sin sequía, 787 en D0, 409 en D1 y 112 en D2.

**Cómo cruzarlo:** el geocoding no da la clave INEGI del municipio. Hay que cruzar por **estado + nombre del municipio normalizado** (sin acentos y en minúsculas), aceptando que uno contenga al otro ("toluca de lerdo" ⊃ "toluca"). Si no hay coincidencia, devolver `sequia: null` (el contrato ya lo contempla 👍).

### `alertas_7_dias`

| Campo | Origen | Cómo se calcula | ¿Viable? |
|---|---|---|---|
| `tipo` | ⚙️ | Open-Meteo Forecast (`temperature_2m_min` y `max`, 7 días): `"helada"` si la mínima ≤ 2 °C; `"calor"` si la máxima ≥ 35 °C | ✅ Probado |
| `severidad` | ⚙️ | `alta` si la mínima ≤ 0 °C; `media` si está entre 0 y 2 °C | ✅ |
| `titulo`, `mensaje` | ⚙️ + ✍️ | Plantilla de texto con el día y la temperatura | ✅ |

**Dato real:** del 20 al 26 de noviembre la mínima pronosticada en Toluca va de **6.7 a 9.5 °C**, así que hoy el arreglo vendría **vacío** (`[]`). Para la demo conviene tener un **modo demo** o una zona fría (por ejemplo, una ciudad de Chihuahua) para mostrar la alerta.

### `cultivos[]`

| Campo | Origen | Cómo se obtiene | ¿Viable? | Notas |
|---|---|---|---|---|
| `id`, `nombre`, `icono`, `categoria` | ✍️ | `cultivos.json` | ✅ | **No hay emoji** para epazote, chayote, nopal, amaranto, cilantro ni chícharo: el frontend necesitará íconos propios |
| `estado` | ⚙️ | Motor de reglas (README, sección 7): clima de la zona × requisitos del cultivo | ✅ | Ya probado en el prototipo con 3 ciudades |
| `semaforo` | 🧩 | Mapeo directo de `estado` | ✅ | Es redundante; el frontend lo puede derivar. Se puede dejar por comodidad |
| `razon_corta` | ⚙️ | Plantilla según la **regla que falló primero** (helada, temperatura baja o alta, altitud) | ✅ | Ejemplo real: *"en Dic hay heladas en 57% de los años y no las tolera"* |
| `etiqueta_clima` | ⚙️ | Texto corto según el tipo de regla | ✅ | |
| `meses_recomendados` | ⚙️ | Correr las reglas 12 veces (una por mes de siembra) | ✅ | 🔴 **Ambiguo** (ver sección 4.1) |
| `filtros_rapidos.maceta_min_litros` | ✍️ | `cultivos.json` | ✅ | ECOCROP no lo trae |
| `filtros_rapidos.espacio_tipo` | 🧩 | Del campo anterior: ≤ 8 L chica, 9-25 L grande, > 25 L patio | ✅ | |
| `filtros_rapidos.luz` | ✍️ | `cultivos.json` | ✅ | ECOCROP trae una luz aproximada ("very bright", "cloudy skies"), pero es mejor escribirla a mano |
| `filtros_rapidos.dias_cosecha_aprox` | ✍️ (de ECOCROP) | Partir de `GMIN`/`GMAX` de ECOCROP y ajustar a mano | ✅ | ECOCROP da rangos muy amplios (jitomate: 70-150 días) |
| `filtros_rapidos.dificultad` | ✍️ | `cultivos.json` | ✅ | |
| `finanzas_sniim.*` | 📦 + ⚙️ | Ver sección 5 | ✅ para 21 de 28 cultivos | 🔴 Los números del ejemplo están mal |

---

## 3. Contrato 2: `GET /api/cultivos/{id}`

Casi todo es **✍️ curado a mano** en `cultivos.json`. Solo las temperaturas vienen de ECOCROP y el contexto económico de SNIIM.

| Campo | Origen | ¿Viable? | Notas |
|---|---|---|---|
| `id`, `nombre`, `categoria`, `icono`, `resumen` | ✍️ | ✅ | |
| `nombre_cientifico` | ✍️ | ✅ | ECOCROP usa nombres viejos (jitomate = *Lycopersicon esculentum*). Agregar `ecocrop_nombre` para saber de dónde salieron los números |
| `ficha_tecnica.temp_ideal_c` | 📦 ECOCROP (`TOPMN`, `TOPMX`) | ✅ | Jitomate 20-27 °C ✔️ coincide con ECOCROP |
| `ficha_tecnica.temp_limite_c` | 📦 ECOCROP (`TMIN`, `TMAX`) | ✅ | Jitomate 7-35 °C ✔️ coincide |
| `ficha_tecnica.tolera_helada` | ✍️ | ✅ | **No usar el `KTMP` de ECOCROP**: falta en 55% de las especies y en el prototipo daba resultados absurdos |
| `ficha_tecnica.dias_a_cosecha` | 📦 ECOCROP (`GMIN`, `GMAX`) ajustado a mano | ✅ | El contrato dice 70-110 y ECOCROP 70-150: está bien ajustarlo, pero hay que anotarlo |
| `maceta_min_litros`, `profundidad_min_cm`, `luz`, `riego`, `sustrato_recomendado` | ✍️ | ✅ | Contenido propio, apoyado en los manuales de la UV y de Puebla |
| `tutorial[]` | ✍️ | ✅ | Es lo que más tiempo toma: unos 10 minutos por cultivo |
| `companeros_cultivo` | ✍️ | ✅ | Mucho es **conocimiento popular**, con poca evidencia científica (por ejemplo, "la albahaca ahuyenta la mosca blanca"). La de papa-jitomate y el tizón tardío sí es cierta. Sugerencia: campo `evidencia: "popular" \| "comprobada"` |
| `curiosidades[]` | ✍️ | ✅ | Verificar cada una. *Xitomatl* = "tomate de ombligo" es la etimología más citada ✔️ |
| `contexto_economico_sniim.mes_mas_caro` / `mes_mas_barato` | 📦 + ⚙️ SNIIM | ✅ | 🔴 **Mal en el ejemplo** (ver sección 5) |
| `contexto_economico_sniim.estados_productores` | 📦 + ⚙️ SNIIM (columna `origen`) | ✅ | 🔴 **Mal en el ejemplo**: el real es Sinaloa 45%, Puebla 33%, Sonora 14%, Michoacán 8%. San Luis Potosí no aparece |
| `contexto_economico_sniim.tip_ahorro` | ✍️ | ⚠️ | "3 a 5 kg por planta" es razonable en suelo, pero en maceta suele ser menos. Citar la fuente o suavizarlo ("hasta…") |
| *(nuevo)* `fuentes[]` | ✍️ | ✅ | De dónde salió el tutorial y las curiosidades |
| *(nuevo)* `ojo[]` | ✍️ | ✅ | Avisos de seguridad: papa verde, savia del mango, etc. |

---

## 4. Errores e inconsistencias encontrados

### 4.1 🔴 `meses_recomendados` no dice qué significa

En el ejemplo, la lechuga en Toluca:
- `estado: "con_cuidados"` en **diciembre**,
- pero `meses_recomendados: [2..10]` **no incluye diciembre**.

El frontend no puede saber si "recomendado" significa "solo ✅" o "✅ + ⚠️". Además, el prototipo dio que en Toluca la lechuga está **⚠️ todo el año** y **nunca ✅** (el clima siempre está un poco por debajo de su ideal). Con la definición "solo ✅", el calendario de la lechuga saldría **vacío**.

**Propuesta:** dos listas.
```json
"meses_ideales":  [],
"meses_posibles": [1,2,3,4,5,6,7,8,9,10,11,12]
```

### 4.2 🔴 Los datos de SNIIM del ejemplo no coinciden con los reales

Perfil real del **jitomate (Tomate Saladette)** en la Central de Abasto de CDMX, 2021-2026, comparado con el promedio de cada año:

| Ene | Feb | Mar | Abr | May | Jun | Jul | Ago | Sep | Oct | Nov | Dic |
|---|---|---|---|---|---|---|---|---|---|---|---|
| +16% | **−28%** | −16% | −3% | +1% | −15% | −13% | −6% | +5% | +9% | +29% | **+33%** |

| Campo del ejemplo | Dice | Dato real |
|---|---|---|
| Contrato 2 `mes_mas_caro` | Octubre (+42%) | **Diciembre (+33%)**; octubre solo +9% |
| Contrato 2 `mes_mas_barato` | Marzo (−28%) | **Febrero (−28%)** |
| Contrato 1 jitomate `mes_cosecha_estimado` | Marzo | No cuadra: en Toluca se siembra de marzo a julio y tarda ~90 días, así que se cosecha **de junio a octubre** |
| Contrato 1 jitomate `variacion_precio_pct` | +34 | Si se siembra en julio y se cosecha en octubre: **+9%** |

Perfil real de la **lechuga (Romanita)**: Ene −12%, Feb −12%, Jul **+24%**, Nov +12%, Dic +12%. El ejemplo dice `variacion_precio_pct: 8` para una cosecha en febrero; el real es **−12%** (`destacar_ahorro: false` sí es correcto).

> No es grave, porque son datos de ejemplo. Pero **si el frontend los usa como datos de prueba, la demo mostraría números falsos**. Mejor generar los datos de prueba con el script real.

### 4.3 🟠 El ahorro se calcula con precios de CDMX

SNIIM es de la **Central de Abasto de CDMX**. Para alguien en Mérida, la temporada de precios puede ser distinta. **Propuesta:** agregar `"mercado_referencia": "Central de Abasto CDMX"` y mostrarlo en pantalla.

### 4.4 🟡 El README y los contratos no coinciden

| Tema | README | `json-contracts.md` |
|---|---|---|
| Endpoints | `/zona`, `/recomendaciones`, `/cultivos/{id}`, `/alertas` (4) | `/api/recomendaciones` (incluye zona y alertas) y `/api/cultivos/{id}` (2) |
| Campos de `cultivos.json` | `cientifico`, `seccion`, `temp_ideal`, `compañeros` | `nombre_cientifico`, `categoria`, `temp_ideal_c`, `companeros_cultivo` |

**Propuesta:** `json-contracts.md` es la versión oficial. Actualizar las secciones 6 y 9 del README. Evitar la `ñ` en los nombres de campos (`compañeros` → `companeros`) ✔️, como ya hace el contrato.

### 4.5 🟡 Faltan respuestas de error

No está definido qué pasa si:
- La ciudad no existe → `404 { "error": "ciudad_no_encontrada" }`
- Open-Meteo responde 429 y no hay caché → `503 { "error": "clima_no_disponible", "reintentar_en_s": 60 }`
- El `id` del cultivo no existe → `404`

---

## 5. Cómo se calculan los campos de SNIIM (📦 + ⚙️)

Se calcula **una vez, antes de la demo**, y se guarda en `sniim_perfiles.json`:

1. Descargar 2021-2026 de la Central de Abasto de CDMX (ya está hecho: 108,745 filas).
2. Para cada cultivo, tomar **una variante fija** (por ejemplo, "Tomate Saladette", "Lechuga Romanita grande", "Chile Serrano").
3. Calcular el precio mediano de cada mes, dividirlo entre el promedio de su año y promediar por mes del año. Así se obtiene el **% sobre o bajo el promedio**.
4. Calcular los `estados_productores` como el % de registros por `origen`.

En cada consulta, el backend solo hace:
- `mes_cosecha_estimado` = mes de siembra + `dias_cosecha_aprox` / 30
- `variacion_precio_pct` = el perfil en ese mes
- `destacar_ahorro` = `variacion_precio_pct ≥ 15`
- `mensaje_ahorro` = plantilla de texto

**Cobertura del catálogo en SNIIM:**
- ✅ **21 sí:** jitomate, tomate verde, chile (usar Serrano o Jalapeño), lechuga, espinaca, acelga, zanahoria, cebolla, ajo, calabacita, pepino, chícharo, papa, cilantro, epazote, elote, chayote, nopal, fresa, papaya, plátano.
- ❌ **7 no:** rábano, perejil, albahaca, romero, hierbabuena, amaranto y frijol. El frijol está en otra sección de SNIIM (granos), que no hemos probado. Para estos 7, `finanzas_sniim: null`.

---

## 6. Qué corre antes de la demo y qué en cada consulta

| Momento | Qué se hace | Fuente | Tiempo aprox. |
|---|---|---|---|
| **Antes** (una vez) | `cultivos.json`: requisitos de ECOCROP + curación + contenido | 📦 ✍️ | Horas de trabajo del equipo |
| **Antes** (una vez) | `sniim_perfiles.json` | 📦 | ~5 min de descarga + cálculo |
| **Antes** (una vez) | `sequia.json` (último nivel por municipio) | 📦 | Segundos |
| **Antes** (recomendado) | Clima de 30 años de las ciudades de la demo, en caché | 🌐 | ~5 s por ciudad |
| **En cada consulta** | Geocoding | 🌐 | < 1 s |
| **En cada consulta** (si no está en caché) | Clima de 30 años de la zona | 🌐 | 2-5 s. ⚠️ Una consulta así cuenta como varias llamadas para Open-Meteo; con ~13 seguidas ya nos dio error 429 |
| **En cada consulta** | Pronóstico de 7 días | 🌐 | < 1 s (caché de 1 hora) |
| **En cada consulta** | Reglas × 28 cultivos × 12 meses | ⚙️ | Milisegundos |

**Llave de caché recomendada:** `lat` y `lon` redondeados a 0.1° (~10 km), que es la misma resolución que el dato de clima.

---

## 7. Contrato 1 corregido (con datos reales de Toluca, diciembre)

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
```

**Cambios respecto al original:**
- `ubicacion`: se agregan `municipio` y `alternativas`.
- `clima_zona`:
  - Se agrega `periodo_referencia`.
  - `probabilidad_helada_pct` se renombra a `anios_con_helada_pct`.
  - Los valores son los reales.
  - En `sequia`: `nivel` va solo con el código (`D1`), y se agregan `nivel_nombre` y `fecha_dato`.
- `cultivos[]`:
  - `meses_recomendados` se reemplaza por `meses_ideales` + `meses_posibles`.
  - `finanzas_sniim`:
    - Se agregan `mercado_referencia` y `producto_sniim`.
    - `mes_cosecha_estimado` pasa a número.
    - Los valores son los reales.
    - Es `null` cuando el cultivo no está en SNIIM.
- `alertas_7_dias` va vacío, que es lo real hoy para Toluca.

> En Toluca, el jitomate y la lechuga nunca salen ✅, porque el clima siempre queda un poco por debajo de su ideal. Por eso `meses_ideales` está vacío. Eso es correcto para una zona fría; en Mérida sí saldrían meses ideales.

---

## 8. Checklist por rol

**Backend 1: cultivos y contenido**
- [ ] `cultivos.json` con los nombres de campos del contrato 2 (sin `ñ`)
- [ ] `ecocrop_nombre`, `tolera_helada` (a mano), `dias_cosecha_aprox` (a mano)
- [ ] `producto_sniim` para los 21 cultivos que están en SNIIM
- [ ] `fuentes[]` y `ojo[]` en cada ficha

**Backend 2: clima y datos**
- [ ] Servicio de clima de 30 años con caché por `lat`/`lon` redondeados a 0.1°
- [ ] `sequia.json` desde el Excel del Monitor, con cruce por estado + nombre normalizado
- [ ] `sniim_perfiles.json` (perfil mensual y estados de origen)
- [ ] Precargar en caché las ciudades de la demo

**Backend 3: API y reglas**
- [ ] Motor de reglas → `estado`, `razon_corta`, `etiqueta_clima`, `meses_ideales`, `meses_posibles`
- [ ] Elegir el resultado de geocoding con más población y devolver `alternativas`
- [ ] Respuestas de error (404 / 503)
- [ ] Generar los **datos de prueba para el frontend con el código real**, no a mano

**Frontend**
- [ ] Íconos propios para los cultivos sin emoji (epazote, chayote, nopal, amaranto, cilantro, chícharo)
- [ ] Tooltip que explique "% de años con helada"
- [ ] Mostrar "Precios de referencia: Central de Abasto CDMX"
- [ ] Estado vacío para `alertas_7_dias: []` y `sequia: null`
