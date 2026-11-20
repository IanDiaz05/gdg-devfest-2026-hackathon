# Contratos JSON Oficiales (v2) — QUESIEMBRO

> **Estado:** Oficial (incluye las correcciones validadas en [`revision-contratos.md`](revision-contratos.md) con datos reales de Open-Meteo, CONAGUA, ECOCROP y SNIIM).  
> **Convención:** Ningún campo usa caracteres especiales ni `ñ` (`companeros_cultivo`, `anios_con_helada_pct`).

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

### Respuesta `200 OK` (Datos reales: Toluca de Lerdo, Diciembre)

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

### Notas de Implementación para `GET /api/recomendaciones`

* `clima_zona.sequia`**:** Puede ser `null` si el municipio no coincide en el padrón de CONAGUA o no presenta sequía. Cuando el nivel es `D0` ("Anormalmente seco"), `activa` es `false`.
* `alertas_7_dias`**:** Es un arreglo de objetos (`[]` cuando no hay riesgo). Cada alerta sigue el esquema:

```json
{
  "tipo": "helada",
  "severidad": "alta",
  "titulo": "Riesgo de helada esta semana",
  "mensaje": "Se pronostican 0.5 °C el jueves por la madrugada. Resguarda tus macetas."
}
```

* `meses_ideales` **vs.** `meses_posibles`**:** `meses_ideales` lista únicamente los meses donde el cultivo obtiene `optimo` (✅). `meses_posibles` incluye tanto los meses `optimo` (✅) como `con_cuidados` (⚠️).
* `finanzas_sniim`**:** Es `null` para los 7 cultivos sin cobertura en SNIIM (rábano, perejil, albahaca, romero, hierbabuena, frijol y amaranto). Cuando `variacion_precio_pct >= 15`, `destacar_ahorro` es `true` y `mensaje_ahorro` contiene el texto explicativo.

---

## 2. Endpoint 2: `GET /api/cultivos/{id}`

Devuelve la ficha educativa, técnica y económica completa de un cultivo específico a partir del catálogo curado.

### Parámetro de Ruta (`Path Param`)

* `id` (`string`): Identificador único (*slug*) del cultivo (ej. `jitomate`, `lechuga`, `epazote`).

### Respuesta `200 OK` (Ejemplo real: `GET /api/cultivos/jitomate`)

```json
{
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
```

*(Nota: Para los 7 cultivos que no cotizan en SNIIM,* `contexto_economico_sniim` *se devuelve como* `null`*).*

---

## 3. Respuestas de Error Estándar

| Código HTTP | Error (`error`) | Payload JSON | Cuándo ocurre |
| --- | --- | --- | --- |
| `404 Not Found` | `ciudad_no_encontrada` | `{"error": "ciudad_no_encontrada", "detail": "No encontramos esa ubicación en México."}` | Open-Meteo Geocoding no devuelve resultados en `MX` para `q`. |
| `404 Not Found` | `cultivo_no_encontrado` | `{"error": "cultivo_no_encontrado", "detail": "El cultivo solicitado no existe en el catálogo."}` | El `id` recibido en `/api/cultivos/{id}` no está en `cultivos.json`. |
| `503 Service Unavailable` | `clima_no_disponible` | `{"error": "clima_no_disponible", "detail": "El servicio meteorológico está saturado.", "reintentar_en_s": 60}` | Open-Meteo responde `429` y la celda `0.1°` aún no está en SQLite. |

---

## 4. Diccionario de Valores Permitidos (`Enums`)

| Campo | Valores exactos | Regla / Significado |
| --- | --- | --- |
| `cultivos[].estado` | `"optimo"`, `"con_cuidados"`, `"no_ahora"` | Resultado principal del motor de reglas para el mes consultado. |
| `cultivos[].semaforo` | `"verde"`, `"amarillo"`, `"rojo"` | Mapeo visual directo de `estado`. |
| `filtros_rapidos.espacio_tipo` | `"maceta_chica"`, `"maceta_grande"`, `"patio"` | Derivado de `maceta_min_litros`: $\le 8\text{ L}$, $9\text{–}25\text{ L}$, $> 25\text{ L}$. |
| `filtros_rapidos.luz` / `ficha_tecnica.luz` | `"pleno_sol"`, `"media_sombra"`, `"sombra"` | Requerimiento lumínico del cultivo. |
| `filtros_rapidos.dificultad` | `"facil"`, `"media"`, `"dificil"` | Nivel de experiencia recomendado. |
| `companeros_cultivo[].evidencia` | `"comprobada"`, `"popular"` | Sustento agronómico de la asociación de cultivos. |
| `alertas_7_dias[].tipo` | `"helada"`, `"calor"` | Helada si mínima $\le 2\text{ }^\circ\text{C}$; calor si máxima $\ge 35\text{ }^\circ\text{C}$. |
| `alertas_7_dias[].severidad` | `"media"`, `"alta"` | `alta` si mínima $\le 0\text{ }^\circ\text{C}$ o máxima $\ge 38\text{ }^\circ\text{C}$. |
