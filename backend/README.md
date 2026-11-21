# Backend QUESIEMBRO: datos

Scripts que descargan y preparan los datos que usa la API. **Todo se corre con el Python de `backend/.venv`**; los scripts se niegan a correr con otro Python.

## 1. Preparar el entorno (una sola vez)

Desde la raíz del repo, en PowerShell:

```powershell
python -m venv backend\.venv
```

```powershell
backend\.venv\Scripts\python -m pip install -r backend\requirements.txt
```

> El primer comando es el único que usa el Python del sistema (para crear el `.venv`). A partir de ahí, todo va con `backend\.venv\Scripts\python`.

## 2. Descargar y generar todos los datos

```powershell
backend\.venv\Scripts\python backend\scripts\descargas\descargar_todo.py
```

- La primera vez tarda **~2 minutos**.
- Lo ya descargado en `data/raw/` se reutiliza. Para volver a bajar todo, agrega `--forzar`.
- Para saltar un paso: `--sin-siap`, `--sin-wikipedia`, etc.

## 3. Qué hace cada script

| Script | Fuente | Genera | Tiempo |
|---|---|---|---|
| `descargar_ciudades.py` | GeoNames México (CC BY 4.0) | `data/ciudades.json`: 2,781 lugares con estado, clave INEGI, coordenadas, altitud y población. **Reemplaza a la API de geocoding** | ~40 s |
| `descargar_ecocrop.py` | FAO ECOCROP | `data/ecocrop_cultivos.json`: temperaturas, ciclo, altitud, lluvia y pH de los 28 cultivos | ~5 s |
| `descargar_wikipedia.py` | Wikipedia en español (CC BY-SA 4.0) | `data/wikipedia_resumenes.json`: resumen e imagen de los 28 cultivos, como base para escribir el contenido | ~1 min |
| `descargar_siap.py` | SIAP, cierre agrícola municipal 2024 | `data/siap_municipio.json`: qué cultivos se siembran en cada municipio y en qué ciclo | ~15 s |
| `generar_cultivos_base.py` | Todo lo anterior + `data/curacion/cultivos_curados.json` | `data/cultivos_base.json`: los 28 cultivos con la forma del contrato 2. Los campos de contenido quedan vacíos y listados en `_pendiente` | ~1 s |
| `descargar_todo.py` | — | Corre todos los anteriores en orden | ~2 min |

## 4. Carpeta `data/`

```text
backend/data/
├── curacion/
│   └── cultivos_curados.json   ← A MANO: lista de los 28 cultivos para maceta (maceta, luz, tolerancia, sensibilidad…)
├── ciudades.json               ← buscador de ciudades (sin API)
├── ecocrop_cultivos.json
├── wikipedia_resumenes.json
├── siap_municipio.json
├── cultivos_base.json          ← generado: copiar a cultivos.json y completar a mano
└── raw/                        ← descargas originales (ignorado en Git)
```

- **`curacion/cultivos_curados.json` es la fuente de verdad** de qué cultivos hay y cómo se llaman en cada fuente. Si se agrega o quita un cultivo, se cambia ahí y se vuelve a correr `descargar_todo.py`.
- **`cultivos_base.json` no sobrescribe `cultivos.json`**: así no se pierde el contenido escrito a mano.

## 5. APIs en vivo (no se descargan)

Solo **Open-Meteo**, desde `app/services/open_meteo.py`:

| API | Para qué |
|---|---|
| Historical (`archive-api.open-meteo.com/v1/archive`) | Clima típico de 30 años, heladas, lluvia, sol y lluvia de los últimos 90 días |
| Forecast (`api.open-meteo.com/v1/forecast`) | Alertas de 7 días: helada, calor, lluvia fuerte, tormenta, viento y UV |

Créditos que hay que mostrar en la app: *"Datos del clima: Open-Meteo.com"* y *"Ciudades: GeoNames"*.

## 6. Diferencias con `docs/backend/arquitectura.md`

Este backend sigue las últimas decisiones del equipo, que todavía no están en ese documento:

- **Sin geocoding en vivo:** la búsqueda usa `data/ciudades.json`.
- **Sin Monitor de Sequía:** no se genera `sequia.json`. En su lugar se puede usar la lluvia de los últimos 90 días contra lo normal (sale de Open-Meteo Historical).
- **Archivos nuevos:** `ciudades.json`, `ecocrop_cultivos.json`, `wikipedia_resumenes.json`, `siap_municipio.json` y `cultivos_base.json`.
- **28 cultivos pensados para maceta** (sin maíz, chayote, papaya ni plátano).
- **Sin precios:** se quitó SNIIM. Los campos `finanzas_sniim` y `contexto_economico_sniim` del contrato ya no tienen de dónde salir.
