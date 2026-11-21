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
| Clima típico de 30 años (temperaturas, % de heladas, lluvia del mes) | **Open-Meteo Historical** (en vivo, con caché en SQLite por celda de 0.1°) |
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
