# Backend QUESIEMBRO

API (FastAPI + SQLite) y scripts que descargan y preparan sus datos. **Todo se corre con el Python de `backend/.venv`**; los scripts de descarga se niegan a correr con otro Python.

## 1. Preparar el entorno (una sola vez)

Desde la raíz del repo, en PowerShell:

```powershell
python -m venv backend\.venv
```

```powershell
backend\.venv\Scripts\python -m pip install -r backend\requirements.txt
```

> El primer comando es el único que usa el Python del sistema (para crear el `.venv`). A partir de ahí, todo va con `backend\.venv\Scripts\python`.

## 2. Correr la API

```powershell
cd backend; .\.venv\Scripts\python scripts\seed.py; .\.venv\Scripts\python -m uvicorn app.main:app --reload
```

- API en `http://localhost:8000`, documentación interactiva en `http://localhost:8000/docs`.
- `seed.py` carga los cultivos en `quesiembro.db` (usa `data/cultivos.json` y, si no existe, `data/cultivos_base.json`).
- La primera consulta de una ciudad tarda de 5 a 20 s (30 años de clima de Open-Meteo); después sale de la caché en milisegundos.
- Si Open-Meteo limita las peticiones (error 429), la API responde **503 `clima_no_disponible`** y no guarda nada en la caché.

## 3. Descargar y generar los datos

```powershell
backend\.venv\Scripts\python backend\scripts\descargas\descargar_todo.py
```

- La primera vez tarda **~5 minutos** (el SMN es lo más lento). Después, ~1 minuto.
- Lo ya descargado en `data/raw/` se reutiliza. Para volver a bajar todo, agrega `--forzar`.
- Para saltar un paso: `--sin-smn`, `--sin-siap`, `--sin-wikipedia`, etc.

| Script | Fuente | Genera |
|---|---|---|
| `descargar_ciudades.py` | GeoNames (CC BY 4.0) + catálogo de municipios del INEGI | `data/ciudades.json`: 2,781 lugares con estado, municipio, clave INEGI, coordenadas, altitud y población. **Reemplaza a la API de geocoding** |
| `descargar_ecocrop.py` | FAO ECOCROP | `data/ecocrop_cultivos.json`: temperaturas, ciclo, altitud, lluvia y pH de los 28 cultivos |
| `descargar_wikipedia.py` | Wikipedia en español (CC BY-SA 4.0) | `data/wikipedia_resumenes.json`: resumen e imagen de los 28 cultivos |
| `descargar_siap.py` | SIAP, cierre agrícola municipal 2024 | `data/siap_municipio.json`: qué cultivos se siembran en cada municipio y en qué ciclo |
| `descargar_smn.py` | **SMN, CONAGUA**: resúmenes mensuales por estación | `data/smn_estaciones.json`: ~2,260 estaciones con su promedio por mes (2013 al año pasado) y el dato del último mes publicado. **Incremental** |
| `generar_cultivos_base.py` | Todo lo anterior + `data/curacion/*.json` | `data/cultivos_base.json`: los 28 cultivos con la forma del contrato v3 |
| `descargar_todo.py` | — | Corre todos los anteriores en orden |

### Precargar el clima de las ciudades (caché en `quesiembro.db`)

| Script | Qué hace |
|---|---|
| `scripts/precarga_cache.py --limit 40` | Pide a **Open-Meteo** las zonas más pobladas que todavía no tienen su dato (incluye las que solo tienen dato de CONAGUA, para reemplazarlo). Cada zona pesa ~100 llamadas: el límite es de ~5,000 por hora y 10,000 al día por red |
| `scripts/precarga_conagua.py` | Llena **todas las zonas vacías** con la estación del SMN más cercana **que cumpla el criterio de calidad** (ver abajo), sin red y sin límite. Guarda `origen = "conagua"`. Opciones: `--limit 100`, `--estado Yucatán` |
| `scripts/ajustar_cobertura.py` | Aplica el criterio de calidad a todo: recalcula o borra las zonas de CONAGUA que no cumplen, saca del buscador las localidades que se quedan sin clima confiable y agrega la localidad principal de los municipios del INEGI que faltaban (si tienen estación adecuada). `--simular` solo cuenta. Necesita `data/raw/` de `descargar_ciudades.py` |

Orden recomendado: primero `precarga_cache.py` hasta donde deje el límite y después `precarga_conagua.py` para que ninguna ciudad se quede sin datos.

**Criterio de calidad de una estación** (`estacion_adecuada` en `app/engine/clima_processor.py`): a **30 km o menos** y a **no más de 150 m de diferencia de altura** con la zona; si no se conoce la altura de la estación, solo a 15 km o menos. Se midió contra Open-Meteo en 145 zonas con ambas fuentes: hasta 30 km el error de la temperatura media es de 1.2-1.5 °C; entre 30 y 50 km sube a 3 °C y con más de 100 m de diferencia de altura, a 2.7-4.2 °C. La altura de las estaciones sale del catálogo oficial del SMN (`descargar_smn.py` la agrega; `--solo-altitudes` para solo eso). Con este criterio el buscador tiene **1,694 de los 2,478 municipios**; los demás no tienen estación adecuada ni clima de Open-Meteo guardado.

**Qué tan bueno es el dato de CONAGUA:** comparado con Open-Meteo en las 144 zonas que tienen ambos, la temperatura media difiere ±1.5 °C (las estaciones salen +1.3 °C más cálidas en promedio), el % de heladas ±6 puntos, y el ✅ ⚠️ ❌ de los cultivos coincide en el 77 % de los casos (solo 1.6 % pasa de ✅ a ❌ o al revés). El % de heladas es **estimado** con la mínima promedio del mes (curva ajustada en `app/engine/clima_processor.py`).

## 4. Actualizar el SMN cada mes

El SMN publica cada mes 4 archivos CSV (lluvia, temperatura media, máxima y mínima de ~1,400 estaciones). No tiene API, pero cada archivo tiene una dirección fija:

```text
https://smn.conagua.gob.mx/tools/RESOURCES/com_archivo_datos_resumenes/{AAAA}{MM}010000{Lluv|TMed|TMax|TMin}.csv
```

Hay archivos **desde enero de 2013** hasta el mes pasado. `descargar_smn.py` solo baja los meses nuevos (tarda segundos) y la API vuelve a leer `smn_estaciones.json` sola cuando cambia: **no hay que reiniciarla**.

Para que se actualice solo, programa una tarea mensual en Windows (cambia `<repo>` por la ruta completa del repo):

```powershell
schtasks /Create /SC MONTHLY /D 10 /ST 09:00 /TN "QueSiembro SMN" /TR "<repo>\backend\.venv\Scripts\python.exe <repo>\backend\scripts\descargas\descargar_smn.py"
```

En un servidor Linux, el equivalente con `cron` (el día 10 de cada mes a las 9:00):

```text
0 9 10 * * <repo>/backend/.venv/bin/python <repo>/backend/scripts/descargas/descargar_smn.py
```

## 5. Carpeta `data/`

```text
backend/data/
├── curacion/
│   ├── cultivos_curados.json   ← A MANO: los 28 cultivos para maceta (maceta, luz, riego, mascotas, polinizadores…)
│   └── contenido_cultivos.json ← A MANO (borrador): resumen, riego, sustrato, tutorial, compañeros, curiosidades, ojo
├── ciudades.json               ← buscador de ciudades (sin API)
├── smn_estaciones.json         ← lluvia y temperatura del SMN por estación (se actualiza cada mes)
├── ecocrop_cultivos.json
├── wikipedia_resumenes.json
├── siap_municipio.json
├── cultivos_base.json          ← generado: copiar a cultivos.json para editarlo a mano
└── raw/                        ← descargas originales (ignorado en Git)
```

- **`curacion/` es la fuente de verdad.** Si se agrega o cambia un cultivo, se edita ahí y se vuelve a correr `generar_cultivos_base.py` y `seed.py`.
- **`contenido_cultivos.json` es un borrador escrito con IA:** hay que revisarlo con los manuales de huerto antes de la demo.

## 6. De dónde sale cada parte de la API

| Parte | Fuente |
|---|---|
| Búsqueda de ciudad y GPS | `data/ciudades.json` (sin red) |
| Clima típico (temperaturas, % de heladas, lluvia del mes) | **Open-Meteo Historical**, 10 años (en vivo, con caché en SQLite por celda de 0.1°). Si Open-Meteo no responde: **estación del SMN más cercana que cumpla el criterio de calidad** (≤ 30 km y ≤ 150 m de diferencia de altura). La respuesta lo indica en `clima_zona.origen` (`open-meteo` o `conagua`) |
| Alertas de 7 días: helada, calor, lluvia fuerte, tormenta, viento y UV | **Open-Meteo Forecast** (en vivo, caché de 1 hora) |
| Lluvia del último mes y su comparación con lo normal | **SMN-CONAGUA**, estación más cercana (≤ 30 km) en `data/smn_estaciones.json` |
| Estado ✅ ⚠️ ❌, razón y meses buenos | Motor de reglas (`app/engine/reglas_siembra.py`) |
| Ficha del cultivo | `data/cultivos_base.json` (o `cultivos.json`) |

Créditos que hay que mostrar en la app: *"Datos del clima: Open-Meteo.com"*, *"Lluvia observada: SMN-CONAGUA"* y *"Ciudades: GeoNames"*.

## 7. Diferencias con `docs/backend/arquitectura.md`

- **Sin geocoding en vivo:** la búsqueda usa `data/ciudades.json`.
- **Sin Monitor de Sequía:** se quitaron `sequia.json`, la tabla `sequia_municipios` y `sequia_matcher.py`. En su lugar está `clima_zona.lluvia_reciente` con datos del SMN.
- **Sin precios:** se quitó SNIIM del código y del contrato.
- **Contrato v3** (`docs/json-contracts.md`): campos de maceta, cuidado e impacto ambiental, alertas de tormenta y lluvia del SMN.
- **28 cultivos pensados para maceta** (sin maíz, chayote, papaya ni plátano).
