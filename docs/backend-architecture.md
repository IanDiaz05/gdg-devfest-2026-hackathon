# Arquitectura del Backend — QUESIEMBRO

> **Versión del contrato:** v3.1 (ver [`json-contracts.md`](json-contracts.md)).
> **Stack:** Python 3.11+ · FastAPI · SQLite (`aiosqlite`) · HTTPX · Pydantic v2
> Este documento es la única fuente de verdad de la estructura y el flujo del backend v3.1.

---

## 1. Estructura del Backend

El backend está desacoplado del frontend y organizado por responsabilidades:

```text
backend/
├── quesiembro.db                    # Base SQLite generada (ignorada en backend/.gitignore)
├── app/                             # API y lógica de negocio
│   ├── main.py                      # Instancia FastAPI; inicializa las tablas al arrancar
│   ├── core/
│   │   ├── config.py                # Settings, rutas de data/ y DB, TTL del pronóstico
│   │   └── database.py              # Conexión a SQLite y CRUD de las tablas
│   ├── schemas/
│   │   ├── recomendaciones.py       # Contratos de salida de GET /api/recomendaciones
│   │   └── cultivos.py              # Contratos de salida de GET /api/cultivos/{id}
│   ├── services/                    # Capa de I/O (peticiones HTTP y lectura de data/)
│   │   ├── open_meteo.py            # Resolución de ubicación, histórico (10 años, 2016-2025) y pronóstico
│   │   └── datos_locales.py         # Lectura de data/*.json (ciudades, SMN), con re-lectura por mtime
│   ├── engine/                      # Capa de procesamiento puro (sin red ni HTTP)
│   │   ├── clima_processor.py       # Conversión de clima diario (10 años) a resumen mensual
│   │   ├── reglas_siembra.py        # Evaluación de cultivos x clima (ventanas mensuales, filtros)
│   │   ├── alertas.py               # Alertas de 7 días a partir del pronóstico diario
│   │   └── lluvia_reciente.py       # Lluvia del mes más reciente del SMN-CONAGUA
│   └── api/
│       ├── routes.py                # Orquestación de los dos endpoints
│       └── errors.py                # Manejadores estándar de error (400/404/503)
├── data/                            # Datasets descargados (fuentes de verdad locales, en Git)
│   ├── ciudades.json                # 2781 ciudades (GeoNames + nombres de municipio del INEGI)
│   ├── smn_estaciones.json          # Estaciones SMN-CONAGUA con normales 2013-2025 y último mes
│   ├── cultivos_base.json           # Catálogo de cultivos (fallback de seed.py)
│   └── curacion/
│       ├── cultivos_curados.json    # Curación manual de cultivos
│       └── contenido_cultivos.json  # Contenido educativo de cultivos
├── scripts/
│   ├── seed.py                      # Carga cultivos a SQLite (auto-seed en startup de FastAPI)
│   ├── precarga_cache.py            # Pre-cachea clima histórico en celdas 0.1°
│   └── descargas/                   # Descargadores de datos origen (ciudades, SMN, ECOCROP, SIAP, Wikipedia, ...)
├── tests/                           # Tests de integración y contrato v3.1
└── requirements.txt, README.md
```

Otros archivos de `data/` (`ecocrop_cultivos.json`, `siap_municipio.json`, `wikipedia_resumenes.json`) son de interés de los scripts de descarga, no del código del backend.

---

## 2. Esquema de Base de Datos SQLite (`quesiembro.db`)

`app/core/database.py` crea tres tablas (la tabla heredada `sequia_municipios` de versiones anteriores ya no se crea ni se usa):

```sql
-- 1. Catálogo de cultivos curados
CREATE TABLE IF NOT EXISTS cultivos (
    id TEXT PRIMARY KEY,              -- slug, ej. "jitomate"
    nombre TEXT NOT NULL,
    icono TEXT NOT NULL,
    categoria TEXT NOT NULL,
    datos_json TEXT NOT NULL,         -- ficha completa: nombre científico, tutorial, compañeros, ...
    reglas_json TEXT NOT NULL         -- rangos térmicos, tolerancia a helada, maceta, ...
);

-- 2. Caché permanente de clima histórico (Open-Meteo Historical, 2016-2025)
CREATE TABLE IF NOT EXISTS clima_historico_cache (
    lat_grid REAL NOT NULL,           -- round(lat, 1)
    lon_grid REAL NOT NULL,           -- round(lon, 1)
    altitud_m INTEGER NOT NULL,
    periodo_referencia TEXT NOT NULL, -- "2016-2025"
    resumen_mensual_json TEXT NOT NULL, -- 12 resúmenes mensuales (JSON)
    created_at TEXT NOT NULL,
    PRIMARY KEY (lat_grid, lon_grid)
);

-- 3. Caché temporal de pronóstico de 7 días (Open-Meteo Forecast)
CREATE TABLE IF NOT EXISTS pronostico_7d_cache (
    lat_grid REAL NOT NULL,           -- round(lat, 1)
    lon_grid REAL NOT NULL,           -- round(lon, 1)
    alertas_json TEXT NOT NULL,       -- arreglo de alertas (JSON)
    expires_at INTEGER NOT NULL,      -- Timestamp Unix; si es menor a ahora, se rechaza
    PRIMARY KEY (lat_grid, lon_grid)
);
```

La clave de caché es la celda de ~0.1° (`round(lat, 1)`, `round(lon, 1)`). El pronóstico caduca (TTL `PRONOSTICO_TTL_SECONDS = 3600`); el clima histórico no caduca.

---

## 3. Flujo de Datos y Resiliencia ante Límites de Tasa (Rate Limits)

```text
GET /api/recomendaciones?lat=L&lon=LO&mes=M
 1. Resolución local
    open_meteo.resolver_coordenadas(lat, lon)  -> ciudad más cercana en data/ciudades.json
        (bounds 14.0-33.5 lat, -118.5..-86.0 lon; si está más lejos de 20 km -> "Tu ubicación")
    o  open_meteo.buscar_ubicacion(q)          -> búsqueda por texto en data/ciudades.json
        (acepta "Toluca" o "Toluca, Estado de México"; devuelve hasta 3 alternativas)
    Resultado: ubicacion {nombre, municipio, estado, lat, lon, altitud_m, alternativas}
 2. Caché de clima
    database.get_clima_cache(round(lat,1), round(lon,1))
        HIT  -> resumen mensual instantáneo (desde_cache = true)
        MISS -> open_meteo.obtener_clima_diario(lat, lon)
                    -> archive-api.open-meteo.com/v1/archive
                       (start 2016-01-01, end 2025-12-31;
                        daily: temperature_2m_mean, temperature_2m_min, temperature_2m_max,
                               precipitation_sum; timezone auto)
                clima_processor.procesar_clima_diario(diarios)
                    -> 12 resúmenes mensuales: temp_media_c, temp_min_promedio_c,
                       temp_max_promedio_c, anios_con_helada_pct, anios_con_helada_fuerte_pct,
                       lluvia_mm
                database.save_clima_cache(lat_grid, lon_grid, altitud_m, "2016-2025", resumen)
                (si falta algun mes: no se guarda en caché y se intenta el respaldo SMN)
 3. Alertas de 7 días
    database.get_pronostico_cache(lat_grid, lon_grid)
        HIT y no caducado -> usa el caché (TTL 1 hora)
        MISS -> open_meteo.obtener_pronostico_7d(lat, lon)
                    -> api.open-meteo.com/v1/forecast (daily: weather_code,
                       temperature_2m_min, temperature_2m_max, precipitation_sum,
                       wind_gusts_10m_max, uv_index_max; timezone auto)
                engine/alertas.py construir_alertas(diario) -> hasta una alerta por tipo
                database.save_pronostico_cache(lat_grid, lon_grid, alertas, TTL)
    (si el pronóstico falla, devuelve [] sin poner en caché)
 4. Lluvia reciente
    lluvia_reciente.obtener_lluvia_reciente(lat, lon)
        -> datos/smn_estaciones.json: estación más cercana dentro de 30 km con último mes
           publicado (ultimo_mes, ej. 2026-10) y lluvia_mm del último mes;
           anomalia_pct se calcula contra el promedio de ese mes en la estación (solo si
           normal >= 5 mm); null si no hay estación cerca.
 5. Evaluación de cultivos
    database.get_all_cultivos() -> engine/reglas_siembra.evaluar_cultivos(...)
    alertas añaden cultivos_afectados: engine/alertas.cultivos_afectados(tipo, cultivos)
```

### Respaldo ante Open-Meteo saturado (429 / 503)

Cuando `open_meteo._get` recibe `429` lanza `OpenMeteoRateLimitError` (subclase de
`ClimaNoDisponibleError`); con otros errores HTTP (5xx) lanza `ClimaNoDisponibleError`
directamente. En `routes.recomendaciones`, cuando el clima no está en caché y falla
Open-Meteo, se llama `clima_processor.resumen_smn_fallback(lat, lon)`:

1. `estacion_smn_cercana(lat, lon)`: estación SMN-CONAGUA más cercana con promedio
   completo de `tmed_c` (12 meses), dentro del radio máximo de 100 km.
2. `resumen_desde_estacion_smn(estacion)`: construye los 12 resúmenes desde las normales
   mensuales de la estación (`tmed_c`, `tmin_c`, `tmax_c`, `lluvia_mm`); para los meses
   sin lluvia se usa 0 mm, y `anios_con_helada_pct` / `anios_con_helada_fuerte_pct` se
   estiman desde `tmin_c` (estimación: tmin <= 0 °C -> 100% / 50%, tmin <= -2 °C -> 100% / 100%).
3. Si no hay estación cercana o el resumen no es completo, se propaga la excepción
   (`clima_no_disponible`, 503).
4. El respaldo no se guarda como `clima_historico_cache`, para reintentar cuando
   Open-Meteo se recupere.

`periodo_referencia` devuelto: `"2016-2025"` con Open-Meteo o
`"SMN-CONAGUA <periodo_normal>"` (ej. `SMN-CONAGUA 2013-2025`) con el respaldo.

### Pre-caché

`scripts/precarga_cache.py` (`backend/.venv/bin/python backend/scripts/precarga_cache.py
[--limit N] [--delay S]`):

1. Ordena las 2781 ciudades de `data/ciudades.json` por población descendente y queda una por celda 0.1°.
2. Omite las celdas ya presentes en `clima_historico_cache`.
3. Consulta Open-Meteo Historical por celda (misma petición que el backend).
4. Reintenta 429 con esperas aleatorias de 30-60 s (máx. 5 intentos por celda).

### Datos utilizados

- `ciudades.json`: GeoNames (geonames.org) + nombres de municipio del INEGI; campos usados: `nombre`, `busqueda`, `estado`, `municipio`, `lat`, `lon`, `altitud_m`, `poblacion`, `cvegeo`, `tipo`.
- `smn_estaciones.json`: generado mensualmente por `scripts/descargas/descargar_smn.py`;
  `ultimo_mes`, `periodo_normal`, `min_anios_normal` (5), y estaciones con `normal`
  (`tmed_c`, `tmin_c`, `tmax_c`, `lluvia_mm` de 12 meses) y `ultimo` (`lluvia_mm`, `tmin_c`,
  `tmax_c`, `tmed_c`).

---

## 4. Endpoints y Responsabilidad de Cada Módulo

| Endpoint | Responsable principal | Alta-nivel de respuesta |
| --- | --- | --- |
| `GET /api/recomendaciones?q=Q o lat+lon, mes?` | `app/api/routes.py` (orquestación) | ubicación, clima_zona, alertas_7_dias, cultivos. Detalle en [`json-contracts.md`](json-contracts.md#1-endpoint-1-get-apirecomendaciones). |
| `GET /api/cultivos/{id}` | `app/api/routes.py` + `app/engine/reglas_siembra.py` | ficha educativa y técnica completa del cultivo. Detalle en [`json-contracts.md`](json-contracts.md#2-endpoint-2-get-apicultivosid). |

### Responsabilidad por módulo

- **`app/api/routes.py`** — Orquestación: resuelve la ubicación, consulta el caché,
  activa el respaldo SMN, compone el pronóstico con `cultivos_afectados` y evalúa los
  cultivos contra el clima del mes.
- **`app/api/errors.py`** — Manejadores estándar: `ubicacion_invalida` (400),
  `ciudad_no_encontrada` (404), `cultivo_no_encontrado` (404), `clima_no_disponible` (503,
  con `reintentar_en_s: 60`).
- **`services/open_meteo.py`** — Todo I/O a Open-Meteo: geocodificación local
  (`buscar_ubicacion`, `resolver_coordenadas`), histórico de 10 años
  (`obtener_clima_diario`), pronóstico de 7 días (`obtener_pronostico_7d`).
  Constantes: `URL_HISTORICO`, `URL_PRONOSTICO`, `PERIODO_INICIO=2016-01-01`,
  `PERIODO_FIN=2025-12-31`, `PERIODO_REFERENCIA="2016-2025"`, `TIMEOUT_S=90`,
  `RADIO_GPS_KM=20`.
- **`services/datos_locales.py`** — Lectura pura de `data/*.json` (`ciudades()`, `smn()`);
  los archivos se recargan si cambian en disco (mtime).
- **`engine/clima_processor.py`** — Conversión de clima diario de 10 años a 12 resúmenes
  mensuales (medias, mínimas, máximas, % de años con helada y helada fuerte, lluvia
  mensual). Umbrales: helada `<= 2 °C`, helada fuerte `<= -2 °C`.
- **`engine/reglas_siembra.py`** — Evaluación de cultivos: estados `optimo` /
  `con_cuidados` / `no_ahora`, ventanas mensuales por ciclo de siembra,
  `meses_ideales`, `meses_posibles`, filtros rápidos, degradación por altitud.
- **`engine/alertas.py`** — Construcción de alertas de pronóstico (una por tipo):
  helada (mínima <= 2 °C; alta si <= 0 °C), calor (máxima >= 35 °C; alta si >= 38 °C),
  lluvia_fuerte (>= 25 mm; alta si >= 50 mm), tormenta (código WMO 95/96/99),
  viento (rachas >= 50 km/h; alta si >= 70 km/h), uv (indice >= 11). Mapeo de cultivos
  afectados por `sensible_a` y `tolera_helada`.
- **`engine/lluvia_reciente.py`** — Lluvia del último mes del SMN-CONAGUA (radio 30 km),
  comparada con el promedio de ese mes en la estación.
- **`app/core/database.py`** — CRUD de las tablas `cultivos`, `clima_historico_cache`,
  `pronostico_7d_cache`.
- **`app/core/config.py`** — `DATA_DIR` (`backend/data`), `DB_PATH`
  (`backend/quesiembro.db`), `PRONOSTICO_TTL_SECONDS = 3600`.
- **`scripts/seed.py`** — Carga los cultivos de `data/cultivos.json` o `data/cultivos_base.json`
  a la tabla `cultivos` (ejecutado automáticamente al arrancar FastAPI).
- **`scripts/descargas/*`** — Descargadores de datos origen (`descargar_ciudades.py`,
  `descargar_smn.py`, `descargar_ecocrop.py`, `descargar_siap.py`, `descargar_wikipedia.py`,
  `generar_cultivos_base.py`, `descargar_todo.py`, `comun.py`).

---

## 5. Notas de Calidad (v3.1)

- El contrato formal v3.1 (campos, tipos y ejemplos con datos reales) está en
  [`json-contracts.md`](json-contracts.md); este documento describe la implementación.
- `clima_zona.desde_cache`: `true` cuando el clima mensual viene de `clima_historico_cache`,
  `false` cuando viene de Open-Meteo o del respaldo SMN.
- Alertas afectan `cultivos_afectados`: según el `sensible_a` de cada cultivo
  (también los que no toleran helada para el tipo `helada`).
- Valores permitidos en `cultivos[].estado`: `optimo`, `con_cuidados`, `no_ahora`;
  semáforos: `verde`, `amarillo`, `rojo`.
