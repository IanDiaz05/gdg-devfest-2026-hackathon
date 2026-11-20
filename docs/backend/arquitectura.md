# Arquitectura del Backend — QUESIEMBRO

> **Stack:** Python 3.11+ · FastAPI · SQLite (`aiosqlite` / `sqlite3`) · HTTPX · Pydantic v2  
> **Enfoque:** Arquitectura híbrida (archivos fuente curados en Git $\rightarrow$ carga automática a SQLite $\rightarrow$ API de solo lectura con caché climático).

---

## 1. Estructura del Monorepo y Carpetas

El backend está completamente desacoplado del frontend y organizado por responsabilidades para que los 3 integrantes del equipo trabajen en paralelo sin conflictos de Git:

```text
quesiembro/
├── docs/
│   ├── README.md
│   ├── json-contracts.md            # Contratos oficiales v2
│   ├── revision-contratos.md        # Registro de validación con datos reales
│   └── backend-architecture.md      # Este documento
├── frontend/                        # App web (aislada)
└── backend/
    ├── pyproject.toml               # Dependencias (fastapi, uvicorn, httpx, pydantic)
    ├── quesiembro.db                # Base SQLite generada (ignorada en .gitignore)
    ├── data/                        # Archivos fuente editables en Git
    │   ├── cultivos.json            # 25-30 cultivos curados (ECOCROP + contenido)
    │   ├── sniim_perfiles.json      # Variación mensual y estados origen (precalculado)
    │   └── sequia.json              # Último corte CONAGUA por municipio (precalculado)
    ├── scripts/
    │   ├── seed.py                  # Carga data/*.json hacia quesiembro.db
    │   └── precarga_demo.py         # Pre-cachea clima 30 años de 20 ciudades clave
    └── app/
        ├── main.py                  # Instancia FastAPI, CORS y evento startup (auto-seed)
        ├── core/
        │   ├── config.py            # Variables de entorno, umbrales y constantes
        │   └── database.py          # Conexión y creación de tablas SQLite
        ├── schemas/
        │   ├── recomendaciones.py   # Contratos Pydantic de salida para /recomendaciones
        │   └── cultivos.py          # Contratos Pydantic de salida para /cultivos/{id}
        ├── services/                # Capa de I/O externo (solo peticiones HTTP)
        │   └── open_meteo.py        # Geocoding, Historical (30 años) y Forecast (7 días)
        ├── engine/                  # Capa de procesamiento puro (sin red ni HTTP)
        │   ├── clima_processor.py   # Agrega 30 años diarios a estadísticas mensuales
        │   ├── sequia_matcher.py    # Normaliza texto y cruza estado + municipio
        │   └── reglas_siembra.py    # Evalúa clima × cultivo (12 meses) + ahorro SNIIM
        └── api/
            ├── routes.py            # Endpoints GET /api/recomendaciones y /api/cultivos/{id}
            └── errors.py            # Manejadores estándar para 404 y 503

```

---

## 2. Flujo de Datos: Pre-procesamiento vs. Tiempo Real

Para evitar bloqueos por límite de peticiones de Open-Meteo (`HTTP 429`) y garantizar respuestas en milisegundos durante la demo, el procesamiento se divide en dos fases:

```text
[FASE 1: ANTES DE ARRANCAR / BUILD]
data/cultivos.json       ─┐
data/sniim_perfiles.json ─┼──► scripts/seed.py ──────► [ quesiembro.db (SQLite) ]
data/sequia.json         ─┘                                      ▲
                                                                 │
Open-Meteo Historical (20 ciudades) ──► scripts/precarga_demo.py ┘

[FASE 2: EN CADA PETICIÓN DEL USUARIO]
GET /api/recomendaciones?q=Toluca&mes=12
   │
   ├─► 1. services/open_meteo.py: Geocoding (?q=Toluca) -> ordena por población, extrae alternativas
   ├─► 2. database.py: Busca clima 30 años en caché por (round(lat, 1), round(lon, 1))
   │       ├─► HIT: Devuelve estadísticas mensuales al instante (< 2 ms)
   │       └─► MISS: Consulta Open-Meteo Historical -> engine/clima_processor.py -> guarda en SQLite
   ├─► 3. database.py + open_meteo.py: Consulta pronóstico 7 días (caché con TTL de 1 hora)
   ├─► 4. engine/sequia_matcher.py: Busca nivel de sequía en SQLite por estado + municipio
   └─► 5. engine/reglas_siembra.py: Evalúa todos los cultivos × 12 meses + cruce SNIIM -> JSON

```

---

## 3. Esquema de Base de Datos SQLite (`quesiembro.db`)

SQLite funciona como almacén unificado tanto para los catálogos curados como para el caché dinámico de APIs externas:

```sql
-- 1. Catálogo curado de cultivos y su perfil económico SNIIM
CREATE TABLE IF NOT EXISTS cultivos (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    icono TEXT NOT NULL,
    categoria TEXT NOT NULL,
    datos_json TEXT NOT NULL,       -- Ficha completa para GET /api/cultivos/{id}
    reglas_json TEXT NOT NULL,      -- Rangos térmicos, tolerancia helada, altitud, maceta
    sniim_json TEXT                 -- Perfil mensual SNIIM o NULL (para los 7 cultivos sin dato)
);

-- 2. Corte más reciente del Monitor de Sequía (CONAGUA)
CREATE TABLE IF NOT EXISTS sequia_municipios (
    clave_normalizada TEXT PRIMARY KEY, -- Ej. "estado de mexico|toluca"
    estado TEXT NOT NULL,
    municipio TEXT NOT NULL,
    nivel TEXT NOT NULL,                -- "D0", "D1", "D2", "D3", "D4"
    nivel_nombre TEXT NOT NULL,
    fecha_dato TEXT NOT NULL
);

-- 3. Caché permanente de clima histórico (1996-2025) por celda de ~10 km
CREATE TABLE IF NOT EXISTS clima_historico_cache (
    lat_grid REAL NOT NULL,             -- round(lat, 1)
    lon_grid REAL NOT NULL,             -- round(lon, 1)
    altitud_m INTEGER NOT NULL,
    periodo_referencia TEXT NOT NULL,   -- "1996-2025"
    resumen_mensual_json TEXT NOT NULL, -- Array de 12 objetos (medias, mínimas, máximas, % helada)
    created_at TEXT NOT NULL,
    PRIMARY KEY (lat_grid, lon_grid)
);

-- 4. Caché temporal de pronóstico a 7 días (TTL: 1 hora)
CREATE TABLE IF NOT EXISTS pronostico_7d_cache (
    lat_grid REAL NOT NULL,
    lon_grid REAL NOT NULL,
    alertas_json TEXT NOT NULL,
    expires_at INTEGER NOT NULL,        -- Timestamp Unix
    PRIMARY KEY (lat_grid, lon_grid)
);

```

---

## 4. Responsabilidad de Cada Módulo

### A. Capa de Servicios Externos (`app/services/open_meteo.py`)

* **Geocoding (`buscar_ubicacion(q)`):** Consulta Open-Meteo Geocoding filtrando `countryCode=MX` y `language=es`. Ordena los resultados por `population` descendente: el primero se toma como ubicación principal y los siguientes (hasta 3) se devuelven en `ubicacion.alternativas`. Si no hay resultados, lanza `CiudadNoEncontradaError` (`404`).
* **Soporte GPS (`resolver_coordenadas(lat, lon)`):** Si el frontend envía `lat` y `lon` directamente, consulta Open-Meteo Elevation y usa *reverse geocoding* ligero (o etiqueta `"Tu ubicación"`) para armar el objeto `ubicacion`.
* **Clima Histórico (`obtener_diario_30_anios(lat, lon)`):** Descarga `temperature_2m_mean`, `temperature_2m_min` y `temperature_2m_max` de `1996-01-01` a `2025-12-31`. Si Open-Meteo devuelve `429` y la celda no está en SQLite, lanza `ClimaNoDisponibleError` (`503`).
* **Pronóstico 7 días (`obtener_pronostico_7d(lat, lon)`):** Obtiene máximas y mínimas de los próximos 7 días para detectar heladas ($\le 2\text{ }^\circ\text{C}$) o calor extremo ($\ge 35\text{ }^\circ\text{C}$).

### B. Capa de Procesamiento y Reglas (`app/engine/`)

* **`clima_processor.py`:** Transforma los ~10,957 registros diarios de 30 años en 12 resúmenes mensuales (`temp_media_c`, `temp_min_promedio_c`, `temp_max_promedio_c`, `anios_con_helada_pct`) e identifica `mes_mas_frio` y `mes_mas_caluroso`.
* **`sequia_matcher.py`:** Elimina acentos, convierte a minúsculas y remueve sufijos comunes (`" de lerdo"`, etc.) para cruzar `admin1` + `admin2`/`name` contra `sequia_municipios`. Marca `activa: true` únicamente si el nivel es `D1` a `D4` (`D0` se reporta como `activa: false`). Si no hay coincidencia, devuelve `null`.
* **`reglas_siembra.py`:**
1. Evalúa cada cultivo en los **12 meses del año** considerando la duración de su ciclo (`dias_cosecha_aprox`, tope 6 meses; 12 meses para perennes).
2. Clasifica cada mes en `optimo` (✅), `con_cuidados` (⚠️) o `no_ahora` (❌) revisando en orden de prioridad:
* **Heladas:** Si `tolera_helada == false`, evalúa noches $\le 2\text{ }^\circ\text{C}$ ($\ge 20\%$ $\rightarrow$ `no_ahora`; $5\%-20\%$ $\rightarrow$ `con_cuidados`). Si `tolera_helada == true`, evalúa heladas fuertes ($\le -2\text{ }^\circ\text{C}$).
* **Temperatura límite e ideal:** Compara la media mensual contra `temp_limite_c` y `temp_ideal_c`.
* **Altitud:** Si `altitud_m > altitud_max_m`, degrada `optimo` a `con_cuidados`.


3. Construye `meses_ideales` (solo meses `optimo`) y `meses_posibles` (meses `optimo` + `con_cuidados`).
4. Calcula `finanzas_sniim`: suma `round(dias_cosecha_aprox / 30)` al `mes_evaluado` para obtener `mes_cosecha_estimado`, extrae `variacion_precio_pct` del perfil SNIIM y marca `destacar_ahorro: true` si es $\ge 15\%$.



---

## 5. Endpoints Expuestos

La especificación completa de campos, tipos y ejemplos con datos reales se encuentra en [`docs/json-contracts.md`](https://www.google.com/search?q=json-contracts.md):

| Método | Ruta | Parámetros | Propósito |
| --- | --- | --- | --- |
| `GET` | `/api/recomendaciones` | `q` o (`lat`, `lon`), `mes` (opcional) | Devuelve ubicación, clima histórico de 30 años, sequía, alertas a 7 días y evaluación de todos los cultivos. |
| `GET` | `/api/cultivos/{id}` | `id` (slug del cultivo) | Devuelve la ficha educativa, tutorial paso a paso, compañeros de cultivo y contexto económico SNIIM. |

---

## 6. División de Trabajo para los 3 Backend Devs

| Rol | Archivos asignados | Entregable clave |
| --- | --- | --- |
| **Backend 1 (Datos y Curación)** | `data/cultivos.json`, `data/sniim_perfiles.json`, `data/sequia.json`, `scripts/seed.py` | Generar los 3 JSON reales (con SNIIM y CONAGUA reales) y el script que puebla `quesiembro.db`. |
| **Backend 2 (Servicios y Caché)** | `app/core/database.py`, `app/services/open_meteo.py`, `app/engine/clima_processor.py`, `scripts/precarga_demo.py` | Conexión a Open-Meteo, cálculo de estadísticas de 30 años, caché SQLite por celda `0.1°` y precarga de ciudades demo. |
| **Backend 3 (Motor de Reglas y API)** | `app/engine/reglas_siembra.py`, `app/engine/sequia_matcher.py`, `app/schemas/*.py`, `app/api/routes.py` | Motor de reglas de los 12 meses, cruce con SNIIM/sequía, endpoints FastAPI y exportación de *mocks* reales para el frontend. |
