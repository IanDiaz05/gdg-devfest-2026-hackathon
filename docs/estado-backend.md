# Estado del backend — QUESIEMBRO

> Fecha: 20-nov-2026 · Rama: `backend`
> Resumen de **qué cambió**, **qué ya funciona**, **qué falta** y **qué se propone** para que la app no se caiga por los límites de Open-Meteo.

---

## 1. Resumen rápido

| | Estado |
|---|---|
| Buscar ciudad (texto o GPS) | ✅ Funciona, sin API (`data/ciudades.json`) |
| Clima típico de 10 años (2016-2025) | ✅ Funciona con **Open-Meteo en vivo** (con caché). ⚠️ Riesgo de límite en la demo (sección 5) |
| Pronóstico y alertas de 7 días | ✅ Funciona con **Open-Meteo en vivo** (ligero, con caché de 1 hora) |
| Lluvia del mes pasado (oficial) | ✅ Funciona con **SMN-CONAGUA** descargado |
| Recomendación ✅ ⚠️ ❌ y "cuándo sí" | ✅ Funciona |
| Ficha de los 28 cultivos | ✅ Completa, pero el contenido es un **borrador por revisar** |
| Docker | ❌ No está en este repo: lo hace otra persona del equipo |

---

## 2. Qué se cambió (para subir a GitHub)

### 2.1 Arreglos

- **`backend/requirements.txt` y `backend/.gitignore`** tenían marcas de conflicto de Git (`<<<<<<< HEAD`) que se subieron por error. Se resolvieron:
  - Un solo `requirements.txt` con todas las dependencias y versiones fijas.
  - `.gitignore` combinado: `.venv/`, `*.db`, `data/raw/`, cachés.
- **Textos sin acentos** en la API ("heladas en 57% de los **anos**", "Mexico", "catalogo") → corregidos.
- **Dificultad y días de cosecha:** salían mal (todos "media" y días promediados). Ya se leen bien.

### 2.2 Contrato JSON → v3.1 (`docs/json-contracts.md`)

| Antes | Ahora |
|---|---|
| `luz` (texto) | `luz_nivel` (1-4) |
| `profundidad_min_cm` | `profundidad_maceta_cm` |
| — | `riego_frecuencia_dias`, `consumo_hidrico`, `pet_safe`, `atrae_polinizadores`, `es_nativa_region`, `guia_rapida.error_comun` |
| `finanzas_sniim`, `contexto_economico_sniim` (precios) | **Eliminados** |
| `clima_zona.sequia` (Monitor de Sequía) | `clima_zona.lluvia_reciente` (SMN-CONAGUA) |
| — | `clima_zona.lluvia_mes_mm` |
| Alertas: `helada`, `calor` | + `lluvia_fuerte`, `tormenta`, `viento`, `uv`, con `fecha` y `cultivos_afectados` |
| Razón del ❌ sin fecha | *"…Mejor siémbralo entre marzo y julio."* |

### 2.3 Archivos

**Nuevos**

| Archivo | Qué hace |
|---|---|
| `backend/app/services/datos_locales.py` | Lee `ciudades.json` y `smn_estaciones.json` (se recargan solos si cambian) |
| `backend/app/engine/alertas.py` | Convierte el pronóstico en alertas para macetas y calcula qué cultivos afecta cada una |
| `backend/app/engine/lluvia_reciente.py` | Lluvia del último mes del SMN en la estación más cercana, comparada con lo normal |
| `backend/scripts/descargas/descargar_smn.py` | Descarga incremental de los resúmenes mensuales del SMN (2013 al mes pasado) |
| `backend/data/smn_estaciones.json` | 2,260 estaciones del SMN con su promedio mensual y el último mes |
| `backend/data/curacion/contenido_cultivos.json` | Borrador de resumen, riego, sustrato, tutorial, compañeros, curiosidades y avisos de los 28 cultivos |

**Modificados**

| Archivo | Cambio |
|---|---|
| `backend/app/services/open_meteo.py` | Ya no devuelve Toluca fijo: busca en `ciudades.json`, usa el GPS y consulta Open-Meteo real (histórico y pronóstico) |
| `backend/app/engine/clima_processor.py` | Calcula de verdad los 12 meses: temperaturas, % de heladas (≤ 2 °C), % de heladas fuertes (≤ −2 °C) y lluvia |
| `backend/app/engine/reglas_siembra.py` | Campos nuevos, heladas fuertes, "cuándo sí", sin precios, acentos |
| `backend/app/api/routes.py` | Conecta todo lo anterior; agrega la lluvia del SMN y los cultivos afectados por cada alerta |
| `backend/app/schemas/*.py` | Contrato v3.1 |
| `backend/app/core/database.py`, `backend/scripts/seed.py` | Sin precios ni sequía; `seed.py` usa `cultivos_base.json` si no existe `cultivos.json` |
| `backend/app/api/errors.py` | Mensajes con acentos |
| `backend/scripts/descargas/descargar_ciudades.py` | Agrega el nombre oficial del municipio (catálogo del INEGI) |
| `backend/scripts/descargas/generar_cultivos_base.py` | Junta curación + contenido + ECOCROP + Wikipedia con la forma del contrato v3.1 |
| `backend/scripts/descargas/descargar_todo.py` | Incluye el paso del SMN |
| `backend/data/*.json` | Regenerados |
| `backend/README.md`, `docs/json-contracts.md` | Documentación al día |

**Eliminados**

| Archivo | Por qué |
|---|---|
| `backend/app/engine/sequia_matcher.py` y la tabla `sequia_municipios` | El equipo decidió no usar el Monitor de Sequía |
| Todo lo de SNIIM (precios) | El equipo decidió no mostrar precios |
| `docker-compose.yml`, `Dockerfile`, `.dockerignore`, `requirements-api.txt` | Docker lo hace otra persona |

---

## 3. Qué ya hay: datos y fuentes

### En vivo (cada consulta, con caché)

| API | Para qué | Peso |
|---|---|---|
| Open-Meteo Historical | Clima típico de 10 años (2016-2025) | **Pesada**: cuenta como cientos de llamadas por ciudad nueva. Se guarda para siempre en SQLite (por celda de ~10 km) |
| Open-Meteo Forecast | Pronóstico y alertas de 7 días | Ligera (≈ 1 llamada), caché de 1 hora |

### Descargados (en `backend/data/`, sin límites)

| Archivo | Fuente | Se actualiza |
|---|---|---|
| `ciudades.json` | GeoNames + INEGI | Una vez |
| `ecocrop_cultivos.json` | FAO ECOCROP | Una vez |
| `wikipedia_resumenes.json` | Wikipedia | Una vez |
| `siap_municipio.json` | SIAP (2024) | Una vez al año |
| `smn_estaciones.json` | SMN-CONAGUA | **Una vez al mes** (ver `backend/README.md` para programarlo) |
| `curacion/*.json` | Escritos por el equipo | A mano |

### Cómo correr todo (siempre con el `.venv`)

```powershell
backend\.venv\Scripts\python -m pip install -r backend\requirements.txt
```

```powershell
backend\.venv\Scripts\python backend\scripts\descargas\descargar_todo.py
```

```powershell
cd backend; .\.venv\Scripts\python scripts\seed.py; .\.venv\Scripts\python -m uvicorn app.main:app --reload
```

---

## 4. Qué falta

| Pendiente | Quién / cómo |
|---|---|
| **Revisar el contenido** de los 28 cultivos (`contenido_cultivos.json`): es un borrador escrito con IA y no tiene fuentes citadas | Equipo, con los manuales de la UV, SEDEMA CDMX y FAO. Anotar las fuentes en `fuentes` |
| **Verificar `pet_safe`** de los 28 cultivos (se pusieron valores conservadores) | A mano, con la lista de plantas tóxicas de la ASPCA |
| **Compañeros de cultivo** de pepino, cilantro, epazote, hierbabuena, orégano, verdolaga, nopal y papa | Están vacíos a propósito: no hay una asociación confiable |
| **Rangos de temperatura del nopal y la hierbabuena** | ECOCROP tiene datos dudosos (nopal) o de otra especie (hierbabuena). Corregir a mano |
| **Íconos** de 11 cultivos sin emoji (rábano, hierbas, verdolaga, amaranto) | Frontend |
| **Protecciones contra el límite de Open-Meteo** | Ver sección 5 |
| **Actualizar `docs/backend/arquitectura.md`** | Todavía menciona geocoding, sequía y SNIIM |
| **Probar el GPS y más ciudades nuevas** | No se pudo terminar de probar porque Open-Meteo limitó las pruebas de ese día |

---

## 5. Propuesta: que no se caiga por el límite de Open-Meteo

### El problema

- El plan gratis de Open-Meteo permite **10,000 llamadas al día, 5,000 por hora y 600 por minuto**, **para todo el servidor** (no por usuario).
- Una consulta de **10 años de clima cuenta como unas 100 llamadas** (antes eran 30 años; se redujo por el límite).
- Durante las pruebas se hicieron muchas seguidas y se rebasó el límite.

### ¿Pasaría en producción?

| Situación | ¿Falla? |
|---|---|
| Ciudad ya consultada | No: sale de la caché |
| Ciudad nueva, de vez en cuando | No |
| Pronóstico | No: es ligero |
| **Varias ciudades nuevas en el mismo minuto** (por ejemplo, jueces probando en la demo) | ⚠️ **Puede fallar** (error 503) |

### Solución propuesta (3 pasos, sin cambiar de fuente)

1. **Precargar la caché** antes de la demo con las ~100 ciudades más pobladas, con pausas para no rebasar el límite. Casi todas las búsquedas saldrían de la caché.
2. **Consulta más ligera:** pedir **10 años en lugar de 30** (pesa unas 3 veces menos; para decidir qué sembrar es suficiente).
3. **Respaldo de CONAGUA:** si Open-Meteo responde "límite alcanzado", usar la estación del SMN más cercana en lugar de mostrar un error.

### Extra opcional: fuentes de CONAGUA sin límite (ya verificadas)

| Fuente | Qué trae | Podría reemplazar a |
|---|---|---|
| Pronóstico por municipio (`smn.conagua.gob.mx/tools/GUI/webservices/?method=1`) | Un solo archivo (330 KB) con **4 días** de pronóstico para **2,463 municipios**, con claves INEGI. Se actualiza varias veces al día | Open-Meteo Forecast (se pierden los días 5 a 7 y el índice UV) |
| Catálogo de estaciones (`…/estaciones-climatologicas/data/estaciones_climatologicas.geojson`) | 5,526 estaciones con links a sus datos | — |
| Normales 1991-2020 por estación | Temperatura máxima, mínima, media y lluvia de cada mes (1,792 estaciones) | Clima típico de Open-Meteo |
| Registro diario por estación (desde 1961) | Mínima diaria, para calcular el % de heladas (~0.5 MB por estación) | Heladas de Open-Meteo |

Con esto, la app usaría **CONAGUA para casi todo** (oficial y sin límite) y **Open-Meteo solo como respaldo**.

---

## 6. Antes de subir a GitHub

1. Revisar que no quede ningún conflicto:

```powershell
git grep -n "<<<<<<<"
```

2. Agregar y hacer commit:

```powershell
git add backend docs
```

```powershell
git commit -m "feat(backend): contrato v3.1, Open-Meteo real, lluvia del SMN, contenido de cultivos"
```

3. Subir la rama:

```powershell
git push origin backend
```

> `backend/.venv/`, `backend/quesiembro.db` y `backend/data/raw/` están en `.gitignore`: no se suben.
