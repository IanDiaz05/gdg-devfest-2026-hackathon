# Rama `cambiosrafael`: qué cambia respecto a `backend`

> Compara esta rama con `origin/backend` (último commit del equipo: `1d95903 feat: fallbacks temporales para datos`).
> Sirve como descripción del Pull Request. El detalle completo, con lo que falta y la propuesta contra el límite de Open-Meteo, está en [`docs/estado-backend.md`](docs/estado-backend.md).

---

## En pocas palabras

La API del equipo devolvía **datos fijos de Toluca** para cualquier ciudad. Con esta rama:

- ✅ **La búsqueda funciona de verdad** con un archivo local de 2,781 ciudades y municipios (sin API de geocoding).
- ✅ **El clima es real:** 30 años de Open-Meteo para cada zona, con caché en SQLite.
- ✅ **Las alertas son reales:** pronóstico de 7 días con helada, calor, lluvia fuerte, tormenta, viento y UV, más qué cultivos afecta cada una.
- ✅ **Dato oficial de lluvia:** lluvia del último mes del SMN-CONAGUA en la estación más cercana, comparada con lo normal.
- ✅ **Contrato v3.1:** campos de maceta, cuidado e impacto ambiental; sin precios y sin sequía.
- ✅ **28 cultivos para maceta** con ficha completa (el contenido es un borrador por revisar).
- ✅ **Scripts de descarga** de todos los datos, que se corren con `backend/.venv`.

---

## Commits

| Commit | Qué trae |
|---|---|
| `c466a9f backend` | Scripts de descarga (`backend/scripts/descargas/`) y los datos generados en `backend/data/` |
| `a62a5eb añadido` | Unión con el backend del equipo. ⚠️ Dejó marcas de conflicto en `requirements.txt` y `.gitignore`, que se corrigen en el siguiente commit |
| `700480a feat(backend): contrato v3.1…` | Conexión real de la API, contrato v3.1, SMN, contenido de cultivos y documentación |

---

## Archivos (34)

### API (`backend/app/`)

| Archivo | Estado | Cambio |
|---|---|---|
| `services/open_meteo.py` | Modificado | Busca en `ciudades.json` (texto y GPS) y consulta Open-Meteo real: histórico de 30 años y pronóstico de 7 días |
| `services/datos_locales.py` | **Nuevo** | Lee `ciudades.json` y `smn_estaciones.json`; los recarga solo si cambian |
| `engine/clima_processor.py` | Modificado | Calcula los 12 meses de verdad: temperaturas, % de años con helada (≤ 2 °C) y con helada fuerte (≤ −2 °C), y lluvia |
| `engine/alertas.py` | **Nuevo** | Convierte el pronóstico en alertas con consejo para macetas y lista de cultivos afectados |
| `engine/lluvia_reciente.py` | **Nuevo** | Lluvia del último mes del SMN en la estación más cercana (≤ 30 km) |
| `engine/reglas_siembra.py` | Modificado | Campos v3, heladas fuertes, "Mejor siémbralo entre X y Y", sin precios; arregla dificultad y días de cosecha; textos con acentos |
| `engine/sequia_matcher.py` | **Eliminado** | Se decidió no usar el Monitor de Sequía |
| `api/routes.py` | Modificado | Conecta todo; cambia `sequia` por `lluvia_reciente`; agrega `cultivos_afectados` a las alertas |
| `api/errors.py` | Modificado | Mensajes con acentos |
| `schemas/recomendaciones.py`, `schemas/cultivos.py` | Modificado | Contrato v3.1 |
| `core/database.py` | Modificado | Sin columna de precios ni tabla de sequía |

### Datos (`backend/data/`)

| Archivo | Fuente |
|---|---|
| `ciudades.json` | GeoNames + nombres de municipio del INEGI (2,781 lugares) |
| `ecocrop_cultivos.json` | FAO ECOCROP (temperaturas y ciclo de los 28 cultivos) |
| `wikipedia_resumenes.json` | Wikipedia en español (resumen e imagen) |
| `siap_municipio.json` | SIAP 2024 (qué se siembra en cada municipio) |
| `smn_estaciones.json` | **SMN-CONAGUA**: 2,260 estaciones con promedio mensual 2013-2025 y el último mes |
| `curacion/cultivos_curados.json` | **A mano:** los 28 cultivos con maceta, luz, riego, mascotas, polinizadores, nativa, error común |
| `curacion/contenido_cultivos.json` | **A mano (borrador con IA):** resumen, riego, sustrato, tutorial, compañeros, curiosidades y avisos |
| `cultivos_base.json` | Generado: todo lo anterior junto, con la forma del contrato |

### Scripts (`backend/scripts/`)

| Archivo | Estado | Qué hace |
|---|---|---|
| `descargas/descargar_todo.py` | **Nuevo** | Corre todas las descargas en orden |
| `descargas/descargar_ciudades.py` | **Nuevo** | GeoNames + INEGI → `ciudades.json` |
| `descargas/descargar_ecocrop.py` | **Nuevo** | ECOCROP → `ecocrop_cultivos.json` |
| `descargas/descargar_wikipedia.py` | **Nuevo** | Wikipedia → `wikipedia_resumenes.json` |
| `descargas/descargar_siap.py` | **Nuevo** | SIAP → `siap_municipio.json` |
| `descargas/descargar_smn.py` | **Nuevo** | SMN mensual (incremental, se programa una vez al mes) → `smn_estaciones.json` |
| `descargas/generar_cultivos_base.py` | **Nuevo** | Junta todo en `cultivos_base.json` |
| `descargas/comun.py` | **Nuevo** | Utilidades; obliga a usar `backend/.venv` |
| `seed.py` | Modificado | Sin precios ni sequía; usa `cultivos_base.json` si no existe `cultivos.json` |

### Configuración y documentación

| Archivo | Cambio |
|---|---|
| `backend/requirements.txt` | Un solo archivo con versiones fijas: API (fastapi, uvicorn, pydantic, pydantic-settings, httpx, aiosqlite) + datos (requests, pandas) |
| `backend/.gitignore` | Combinado: `.venv/`, `*.db`, `data/raw/`, cachés |
| `backend/README.md` | **Nuevo:** cómo instalar, correr la API, descargar los datos y programar el SMN cada mes |
| `docs/json-contracts.md` | Contrato **v3.1** |
| `docs/estado-backend.md` | **Nuevo:** qué hay, qué falta y propuesta contra el límite de Open-Meteo |

---

## Cambios en el contrato (v2 → v3.1)

| Antes | Ahora |
|---|---|
| `luz` (texto) | `luz_nivel` (1-4) |
| `profundidad_min_cm` | `profundidad_maceta_cm` |
| — | `riego_frecuencia_dias`, `consumo_hidrico`, `pet_safe`, `atrae_polinizadores`, `es_nativa_region`, `guia_rapida.error_comun` |
| `finanzas_sniim`, `contexto_economico_sniim` | **Eliminados** |
| `clima_zona.sequia` | `clima_zona.lluvia_reciente` (SMN-CONAGUA) |
| — | `clima_zona.lluvia_mes_mm` |
| Alertas `helada`, `calor` | + `lluvia_fuerte`, `tormenta`, `viento`, `uv`, con `fecha` y `cultivos_afectados` |

⚠️ **Para el frontend:** cambian nombres de campos (`luz` → `luz_nivel`, `profundidad_min_cm` → `profundidad_maceta_cm`, `sequia` → `lluvia_reciente`) y desaparecen los de precios.

---

## Cómo probarla

```powershell
python -m venv backend\.venv
```

```powershell
backend\.venv\Scripts\python -m pip install -r backend\requirements.txt
```

```powershell
cd backend; .\.venv\Scripts\python scripts\seed.py; .\.venv\Scripts\python -m uvicorn app.main:app --reload
```

Abrir `http://localhost:8000/docs` y probar `GET /api/recomendaciones?q=Toluca&mes=12` y `GET /api/cultivos/jitomate`.

> Los datos de `backend/data/` ya vienen generados: no hace falta correr las descargas para probar.

---

## Pendientes conocidos

- Revisar el **contenido de los 28 cultivos** (`contenido_cultivos.json` es un borrador con IA, sin fuentes citadas).
- Verificar **`pet_safe`** con la lista de la ASPCA.
- Corregir a mano los rangos de temperatura del **nopal** y la **hierbabuena**.
- **Límite de Open-Meteo:** si varias ciudades nuevas se consultan en el mismo minuto, la API responde 503. La propuesta para evitarlo (precargar caché, consulta de 10 años, respaldo de CONAGUA) está en `docs/estado-backend.md`.
- Actualizar `docs/backend/arquitectura.md` (todavía menciona geocoding, sequía y precios).
