# Contratos JSON Oficiales (v3) — QUESIEMBRO

> **Estado:** Oficial (v3.1). La v3 agrega los campos de maceta, cuidado e impacto ambiental (`luz_nivel`, `pet_safe`, `atrae_polinizadores`, `es_nativa_region`, `consumo_hidrico`, `riego_frecuencia_dias`, `guia_rapida.error_comun`, `profundidad_maceta_cm`) y **quita los precios de SNIIM** (`finanzas_sniim` y `contexto_economico_sniim`). La v3.1 cambia `sequia` por `lluvia_reciente` (SMN-CONAGUA), agrega `lluvia_mes_mm` y amplía las alertas (lluvia fuerte, tormenta, viento y UV, con `fecha` y `cultivos_afectados`).
> **Convención:** Ningún campo usa caracteres especiales ni `ñ` (`companeros_cultivo`, `anios_con_helada_pct`).
> **Implementación:** `backend/app/schemas/` sigue exactamente este contrato; los ejemplos salen de la API real.

---

## Cambios de v2 a v3

| Antes (v2) | Ahora (v3) | Dónde |
| --- | --- | --- |
| `luz` (`pleno_sol`, `media_sombra`, `sombra`) | `luz_nivel` (1 a 4) | `filtros_rapidos` y `ficha_tecnica` |
| `profundidad_min_cm` | `profundidad_maceta_cm` | `ficha_tecnica` (y nuevo en `filtros_rapidos`) |
| — | `riego_frecuencia_dias` | `filtros_rapidos` y `ficha_tecnica` |
| — | `consumo_hidrico`, `pet_safe`, `atrae_polinizadores`, `es_nativa_region` | `filtros_rapidos` |
| — | `es_nativa_region`, `restricciones`, `impacto_ambiental`, `guia_rapida` | Ficha del cultivo |
| `finanzas_sniim`, `contexto_economico_sniim` | **Eliminados** | — |
| `clima_zona.sequia` (Monitor de Sequía) | `clima_zona.lluvia_reciente` (SMN-CONAGUA, estación más cercana) | `clima_zona` |
| — | `clima_zona.lluvia_mes_mm` | `clima_zona` |
| `alertas_7_dias[].tipo`: `helada`, `calor` | + `lluvia_fuerte`, `tormenta`, `viento`, `uv`; nuevos `fecha` y `cultivos_afectados` | `alertas_7_dias` |

---

## 1. Endpoint 1: `GET /api/recomendaciones`

Devuelve la información climática de la zona y la evaluación de todos los cultivos del catálogo para el mes consultado, incluyendo sus ventanas anuales (`meses_ideales` y `meses_posibles`) y filtros rápidos para evitar peticiones adicionales desde el frontend.

### Parámetros de Consulta (`Query Params`)

| Parámetro | Tipo | Requerido | Descripción |
| :--- | :--- | :--- | :--- |
| `q` | `string` | Condicional* | Nombre de la ciudad o municipio en México (ej. `Toluca`). |
| `lat` | `float` | Condicional* | Latitud obtenida por GPS del navegador (ej. `19.288`). |
| `lon` | `float` | Condicional* | Longitud obtenida por GPS del navegador (ej. `-99.653`). |
| `mes` | `int` (`1..12`) | No | Mes de siembra a evaluar. Si se omite, el backend usa el mes actual. |

*Se debe enviar* `q` *o el par* `lat` *+* `lon`*. Si se envían ambos, tiene prioridad* `lat` *+* `lon`*.*

### Respuesta `200 OK` (Toluca de Lerdo, Diciembre)

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
    "lluvia_mes_mm": 15.0,
    "mes_mas_frio": { "mes": 1, "nombre": "Enero", "temp_media_c": 10.7 },
    "mes_mas_caluroso": { "mes": 5, "nombre": "Mayo", "temp_media_c": 15.5 },
    "lluvia_reciente": {
      "fuente": "SMN - CONAGUA",
      "estacion": "Observatorio de Toluca, Méx.",
      "distancia_km": 6.4,
      "mes": "2026-10",
      "lluvia_mm": 71.0,
      "normal_mm": 52.4,
      "anomalia_pct": 35,
      "temp_min_c": 9.0,
      "temp_max_c": 21.7,
      "mensaje": "En octubre de 2026 llovieron 71 mm en Observatorio de Toluca, Méx. (6 km): 35% más de lo normal.",
      "consejo": "Ha llovido más de lo normal: revisa que tus macetas drenen bien y no dejes agua en los platos."
    }
  },
  "alertas_7_dias": [
    {
      "tipo": "tormenta",
      "severidad": "media",
      "fecha": "2026-11-22",
      "titulo": "Tormenta eléctrica en el pronóstico",
      "mensaje": "Hay pronóstico de tormenta el domingo. Asegura las macetas altas, amarra los tutores y cosecha los frutos maduros antes.",
      "cultivos_afectados": ["jitomate", "pepino", "chicharo", "lechuga"]
    }
  ],
  "cultivos": [
    {
      "id": "lechuga",
      "nombre": "Lechuga",
      "icono": "🥬",
      "categoria": "Hortalizas de hoja",
      "estado": "con_cuidados",
      "semaforo": "amarillo",
      "razon_corta": "Diciembre es algo frío (11.1 °C; lo ideal es 12-21 °C).",
      "etiqueta_clima": "Algo frío",
      "meses_ideales": [],
      "meses_posibles": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      "filtros_rapidos": {
        "maceta_min_litros": 5,
        "espacio_tipo": "maceta_chica",
        "profundidad_maceta_cm": 15,
        "luz_nivel": 3,
        "riego_frecuencia_dias": 2,
        "consumo_hidrico": "alto",
        "pet_safe": true,
        "atrae_polinizadores": false,
        "es_nativa_region": false,
        "dias_cosecha_aprox": 55,
        "dificultad": "facil"
      }
    },
    {
      "id": "jitomate",
      "nombre": "Jitomate",
      "icono": "🍅",
      "categoria": "Frutos",
      "estado": "no_ahora",
      "semaforo": "rojo",
      "razon_corta": "En diciembre hay heladas en 57% de los años y no las aguanta. Mejor siémbralo entre marzo y julio.",
      "etiqueta_clima": "Riesgo alto de helada",
      "meses_ideales": [],
      "meses_posibles": [3, 4, 5, 6, 7],
      "filtros_rapidos": {
        "maceta_min_litros": 20,
        "espacio_tipo": "maceta_grande",
        "profundidad_maceta_cm": 30,
        "luz_nivel": 4,
        "riego_frecuencia_dias": 2,
        "consumo_hidrico": "alto",
        "pet_safe": false,
        "atrae_polinizadores": true,
        "es_nativa_region": true,
        "dias_cosecha_aprox": 90,
        "dificultad": "media"
      }
    }
  ]
}
```

### Notas de Implementación para `GET /api/recomendaciones`

* `clima_zona.lluvia_reciente`**:** Lluvia del **último mes publicado por el SMN** (CONAGUA) en la estación más cercana (máximo 30 km), comparada con el promedio de ese mes en la misma estación (2013 al año pasado). Es `null` si no hay estación cerca. `anomalia_pct` es `null` cuando lo normal del mes es menor a 5 mm.
* `clima_zona.lluvia_mes_mm`**:** Lluvia típica del mes evaluado según 30 años de Open-Meteo.
* `alertas_7_dias`**:** Arreglo con **una alerta por tipo como máximo** (la del peor día de los próximos 7). `[]` cuando no hay riesgo. `cultivos_afectados` son los `id` de los cultivos sensibles a esa alerta (campo `sensible_a` de la curación, más los que no toleran helada).

* `meses_ideales` **vs.** `meses_posibles`**:** `meses_ideales` lista únicamente los meses donde el cultivo obtiene `optimo` (✅). `meses_posibles` incluye tanto los meses `optimo` (✅) como `con_cuidados` (⚠️).
* `filtros_rapidos`**:** Trae todo lo necesario para filtrar en el frontend sin pedir la ficha: espacio, profundidad, luz, riego, consumo de agua, si es segura para mascotas, si atrae polinizadores y si es nativa de México.
* `riego_frecuencia_dias`**:** Es un valor **base para clima templado**. Más adelante la API puede ajustarlo por zona y mes con la evapotranspiración de Open-Meteo.

---

## 2. Endpoint 2: `GET /api/cultivos/{id}`

Devuelve la ficha educativa y técnica completa de un cultivo específico a partir del catálogo curado.

### Parámetro de Ruta (`Path Param`)

* `id` (`string`): Identificador único (*slug*, con guion bajo) del cultivo (ej. `jitomate`, `tomate_verde`, `epazote`).

### Respuesta `200 OK` (`GET /api/cultivos/jitomate`)

```json
{
  "id": "jitomate",
  "nombre": "Jitomate",
  "nombre_cientifico": "Solanum lycopersicum",
  "ecocrop_nombre": "Lycopersicon esculentum",
  "categoria": "Frutos",
  "icono": "🍅",
  "resumen": "El cultivo estrella del huerto en casa; requiere sol directo y soporte para crecer vertical.",
  "es_nativa_region": true,
  "ficha_tecnica": {
    "temp_ideal_c": [20, 27],
    "temp_limite_c": [7, 35],
    "tolera_helada": false,
    "altitud_max_m": 2400,
    "dias_a_cosecha": [70, 150],
    "maceta_min_litros": 20,
    "profundidad_maceta_cm": 30,
    "luz_nivel": 4,
    "riego_frecuencia_dias": 2,
    "riego": "Constante en la base, sin mojar las hojas ni encharcar",
    "sustrato_recomendado": "50% tierra negra, 30% composta o humus de lombriz, 20% perlita o tepojal"
  },
  "restricciones": {
    "pet_safe": false,
    "dificultad": "media"
  },
  "impacto_ambiental": {
    "consumo_hidrico": "alto",
    "atrae_polinizadores": true
  },
  "guia_rapida": {
    "error_comun": "Regar de forma irregular: el fruto se raja y aparecen hongos."
  },
  "tutorial": [
    "Siembra 2 semillas a 0.5 cm de profundidad en un semillero húmedo.",
    "Cuando la plántula mida 10-15 cm y tenga 4 hojas verdaderas, trasplántala a una maceta de al menos 20 litros.",
    "Coloca un tutor o vara desde el inicio para sostener el tallo conforme crezca.",
    "Cosecha cuando el fruto tenga color rojo uniforme."
  ],
  "companeros_cultivo": [
    {
      "id": "albahaca",
      "nombre": "Albahaca",
      "beneficio": "Ayuda a repeler mosca blanca y pulgones.",
      "evidencia": "popular"
    }
  ],
  "curiosidades": [
    "Su nombre viene del náhuatl xictomatl, que significa 'tomate con ombligo'."
  ],
  "ojo": [
    "Las hojas y los tallos no se comen y son tóxicos para perros y gatos."
  ],
  "fuentes": [
    "FAO ECOCROP: Lycopersicon esculentum",
    "Wikipedia: https://es.wikipedia.org/wiki/Solanum_lycopersicum"
  ]
}
```

### De dónde sale cada campo nuevo

| Campo | Origen |
| --- | --- |
| `luz_nivel`, `profundidad_maceta_cm`, `riego_frecuencia_dias`, `consumo_hidrico`, `pet_safe`, `atrae_polinizadores`, `es_nativa_region`, `guia_rapida.error_comun` | Escritos a mano en `backend/data/curacion/cultivos_curados.json` y copiados a la ficha por `generar_cultivos_base.py` |
| `pet_safe` | Valores conservadores: **verificar** con la lista de plantas tóxicas de la ASPCA |
| `consumo_hidrico` | Se escribe a mano: derivarlo de la lluvia ideal de ECOCROP da resultados absurdos en maceta (por ejemplo, romero "alto") |

---

## 3. Respuestas de Error Estándar

| Código HTTP | Error (`error`) | Payload JSON | Cuándo ocurre |
| --- | --- | --- | --- |
| `400 Bad Request` | `ubicacion_invalida` | `{"error": "ubicacion_invalida", "detail": "Debes enviar el parametro 'q' o el par 'lat' y 'lon'."}` | No se envió `q` ni el par `lat` + `lon`. |
| `404 Not Found` | `ciudad_no_encontrada` | `{"error": "ciudad_no_encontrada", "detail": "No encontramos esa ubicación en México."}` | La búsqueda en `data/ciudades.json` no devuelve resultados para `q`. |
| `404 Not Found` | `cultivo_no_encontrado` | `{"error": "cultivo_no_encontrado", "detail": "El cultivo solicitado no existe en el catálogo."}` | El `id` recibido en `/api/cultivos/{id}` no está en el catálogo. |
| `503 Service Unavailable` | `clima_no_disponible` | `{"error": "clima_no_disponible", "detail": "El servicio meteorológico está saturado.", "reintentar_en_s": 60}` | Open-Meteo responde `429` y la celda `0.1°` aún no está en SQLite. |

---

## 4. Diccionario de Valores Permitidos (`Enums`)

| Campo | Valores exactos | Regla / Significado |
| --- | --- | --- |
| `cultivos[].estado` | `"optimo"`, `"con_cuidados"`, `"no_ahora"` | Resultado principal del motor de reglas para el mes consultado. |
| `cultivos[].semaforo` | `"verde"`, `"amarillo"`, `"rojo"` | Mapeo visual directo de `estado`. |
| `filtros_rapidos.espacio_tipo` | `"maceta_chica"`, `"maceta_grande"`, `"patio"` | Derivado de `maceta_min_litros`: ≤ 8 L, 9–25 L, > 25 L. |
| `luz_nivel` | `1`, `2`, `3`, `4` | 1 sombra, 2 luz indirecta brillante, 3 sol parcial (media sombra), 4 pleno sol. |
| `riego_frecuencia_dias` | Entero ≥ 1 | Cada cuántos días regar en clima templado. |
| `consumo_hidrico` | `"bajo"`, `"medio"`, `"alto"` | Agua que pide en maceta. |
| `pet_safe` | `true`, `false` | `true` = no es tóxica para perros y gatos. |
| `atrae_polinizadores` | `true`, `false` | Sus flores atraen abejas u otros polinizadores. |
| `es_nativa_region` | `true`, `false` | Nativa o domesticada en México. |
| `dificultad` | `"facil"`, `"media"`, `"dificil"` | Nivel de experiencia recomendado. |
| `companeros_cultivo[].evidencia` | `"comprobada"`, `"popular"` | Sustento agronómico de la asociación de cultivos. |
| `alertas_7_dias[].tipo` | `"helada"`, `"calor"`, `"lluvia_fuerte"`, `"tormenta"`, `"viento"`, `"uv"` | Helada: mínima ≤ 2 °C. Calor: máxima ≥ 35 °C. Lluvia fuerte: ≥ 25 mm en el día (escala del SMN). Tormenta: código WMO 95, 96 o 99. Viento: rachas ≥ 50 km/h. UV: índice ≥ 11. |
| `alertas_7_dias[].severidad` | `"media"`, `"alta"` | `alta` si mínima ≤ 0 °C, máxima ≥ 38 °C, lluvia ≥ 50 mm o rachas ≥ 70 km/h. |
