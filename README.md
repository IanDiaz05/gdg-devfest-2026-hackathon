# QUESIEMBRO 🌱🌽🌶️

> **Pon tu zona y te decimos qué puedes sembrar este mes, qué no y por qué.**
> Una web app para personas que quieren tener su propio huerto en casa (patio, azotea o macetas) en México, usando el clima real de su zona.

**Tracks:** Medio Ambiente (principal) + Finanzas / Economía
**Equipo:** 5 personas: 3 backend/datos, 2 frontend
**Duración:** ~24 horas

---

## Índice

1. [La idea en 30 segundos](#1-la-idea-en-30-segundos)
2. [¿Ya existen apps así?](#2-ya-existen-apps-así)
3. [Qué SÍ vamos a hacer](#3-qué-sí-vamos-a-hacer)
4. [Qué NO vamos a hacer](#4-qué-no-vamos-a-hacer)
5. [¿Solo necesitamos datos del clima?](#5-solo-necesitamos-datos-del-clima)
6. [Datos que vamos a necesitar](#6-datos-que-vamos-a-necesitar)
7. [Cómo decide la app (reglas)](#7-cómo-decide-la-app-reglas)
8. [Prueba con datos reales: Toluca, Monterrey y Mérida](#8-prueba-con-datos-reales-toluca-monterrey-y-mérida)
9. [Arquitectura y roles](#9-arquitectura-y-roles)
10. [Riesgos y cómo evitarlos](#10-riesgos-y-cómo-evitarlos)
11. [Historial: la idea anterior](#11-historial-la-idea-anterior)

---

## 1. La idea en 30 segundos

1. Escribes tu ciudad o compartes tu ubicación.
2. La app revisa **30 años de clima de tu zona** y te da una lista de cultivos:
   - ✅ **Siémbralo ahora:** *"Diciembre en Mérida está en el rango ideal del jitomate (20-27 °C)."*
   - ⚠️ **Con cuidados:** *"Puedes sembrar lechuga, pero cúbrela en las noches de enero."*
   - ❌ **No ahora:** *"No siembres jitomate en Toluca en diciembre: hay heladas en más de la mitad de los años y no las aguanta. Mejor siémbralo entre marzo y julio."*
3. Cada cultivo tiene un **tutorial** (cómo sembrarlo paso a paso, riego, luz, maceta, cuándo cosechar) y **curiosidades** (por ejemplo, de dónde viene y su historia en México).
4. **Extras:** alerta de helada para los próximos días ("esta semana cubre tus plantas") y cuánto podrías ahorrar sembrando en lugar de comprar.

**Por qué importa:**
- **Medio ambiente:** autoconsumo, huertos urbanos, menos transporte y adaptación al clima de cada zona.
- **Finanzas:** cosechar en casa lo que en el mercado está caro.

---

## 2. ¿Ya existen apps así?

**Sí existen apps de siembra, pero ninguna cubre lo que queremos para México.**

| App | Qué hace | Qué le falta |
|---|---|---|
| Inzones, SimpleGrow, SowEasy, Patch, Garden.org | Calendario de siembra según zona y fechas de helada | EE. UU., Canadá y Reino Unido (zonas USDA), en inglés |
| Garden Planner | Fechas de siembra por zona de heladas | No es para México y usa promedios de zona |
| Gardenize | Diario de tu jardín (fotos, notas, rotación) | No te dice qué sembrar según tu clima |
| Tu Huerto en Casa, Veggie Grower | Fichas de cuidados por planta | Pocos cultivos y no usa el clima de tu zona |
| Moon & Garden | Calendario lunar de siembra | No se basa en datos de clima |
| Plantix | Detecta plagas y enfermedades con foto | Está pensada para agricultores |
| Produce (app mexicana, era SAGARPA) | Sugería cultivos con GPS y datos de clima y suelo | Para productores; no es claro si sigue activa |
| Calendarios de SADER y Meteored | Qué sembrar cada mes en México | Igual para todo el país; no considera tu zona |

**Nuestra diferencia:**
- En **español** y para **México**.
- Usa el **clima real de tu zona** (30 años de datos), no un promedio nacional.
- **Explica por qué** sí o por qué no, y **cuándo sí**.
- Incluye **cultivos mexicanos** (tomate verde, epazote, chayote, nopal, amaranto, milpa) con tutorial y curiosidades.

---

## 3. Qué SÍ vamos a hacer

**Producto:** web app que funcione bien en celular.

**Pantallas**
1. **Inicio:** buscador de ciudad o botón "usar mi ubicación".
2. **Tu zona:** resumen del clima (mes más frío y más caliente, riesgo de helada, si es zona con sequía).
3. **Qué sembrar este mes:** lista ✅ / ⚠️ / ❌ con la razón en una frase y los meses en que sí conviene.
4. **Ficha del cultivo:** tutorial paso a paso, días a cosecha, maceta mínima, luz, riego, compañeros de cultivo y curiosidades.
5. **Calendario anual de tu zona:** para cada cultivo, en qué meses sí se puede sembrar.

**Catálogo inicial: 25 a 30 cultivos fáciles para casa**

| Sección | Cultivos |
|---|---|
| Hortalizas | Jitomate, tomate verde, chile, lechuga, espinaca, acelga, zanahoria, rábano, cebolla, ajo, calabacita, pepino, chícharo, papa |
| Hierbas | Cilantro, perejil, albahaca, epazote, romero, hierbabuena (no está en ECOCROP: sus datos van a mano) |
| Milpa y cultivos mexicanos | Maíz (elote), frijol, amaranto, chayote, nopal |
| Frutales sencillos | Fresa, papaya, plátano |

**Extras si hay tiempo**
- **Alerta de helada** en los próximos 7 días con el pronóstico de Open-Meteo.
- **Modo milpa:** sembrar maíz, frijol y calabaza juntos.
- **"¿Cuánto ahorro?":** usando los precios de SNIIM que ya descargamos (ver sección 11).
- **Aviso de sequía** con el Monitor de Sequía: "en tu municipio hay sequía, usa riego por goteo o capta agua de lluvia".

---

## 4. Qué NO vamos a hacer

- ❌ **Agricultura comercial** ni recomendaciones para productores. Es para huertos en casa.
- ❌ **Detectar plagas por foto.** Ya lo hace Plantix.
- ❌ **Sensores ni IoT.**
- ❌ **Análisis de suelo.** En macetas no hace falta; solo daremos consejos generales de sustrato.
- ❌ **Machine learning.** Usamos reglas claras con datos de clima y requisitos de cada cultivo.
- ❌ **Plantas de ornato o de interior.** Solo comestibles.
- ❌ **App nativa.** Solo web que se adapta al celular.
- ❌ **Todas las especies.** Solo 25 a 30 cultivos revisados a mano.

---

## 5. ¿Solo necesitamos datos del clima?

**No.** El clima solo dice cómo es tu zona. Para decidir qué sembrar hacen falta **tres tipos de datos**:

| Tipo | Pregunta que responde | Ejemplo |
|---|---|---|
| 🌡️ **Clima de tu zona** | ¿Cómo es el clima aquí en cada mes? | "En Toluca, diciembre promedia 11 °C y hay heladas en 57% de los años." |
| 🌱 **Requisitos de cada cultivo** | ¿Qué clima necesita esta planta? | "El jitomate necesita 20-27 °C (ideal), mínimo 7 °C, y no aguanta heladas. Tarda 70-150 días." |
| 📖 **Contenido** | ¿Cómo lo siembro y qué es interesante? | Tutorial paso a paso, maceta mínima, riego, curiosidades |

La recomendación sale de **cruzar el clima con los requisitos**. El contenido lo escribimos nosotros (con ayuda de IA) y lo revisamos.

---

## 6. Datos que vamos a necesitar

✅ = probado por nosotros el 20-nov-2026

### Indispensables

| Dato | Fuente | Estado | Notas |
|---|---|---|---|
| Ciudad → coordenadas | [Open-Meteo Geocoding](https://open-meteo.com/en/docs/geocoding-api) | ✅ | Sin clave. `?name=Toluca&countryCode=MX&language=es`. Devuelve estado y altitud. También sirve la ubicación del navegador. |
| Altitud | [Open-Meteo Elevation](https://open-meteo.com/en/docs/elevation-api) | ✅ | Sin clave |
| Clima de 30 años (temp. media, mínima, máxima diaria) | [Open-Meteo Historical](https://open-meteo.com/en/docs/historical-weather-api) | ✅ | Sin clave. De aquí calculamos el clima típico de cada mes y el **riesgo de helada**. ⚠️ Si se piden muchas seguidas responde error 429: hay que guardar los resultados (caché). |
| Requisitos de cada cultivo | [FAO ECOCROP](https://www.fao.org/geospatial/data-and-tools/data-portals/ecocrop/en) (CSV en [GitHub de OpenCLIM](https://github.com/OpenCLIM/ecocrop)) | ✅ | **2,568 especies.** Trae temperatura ideal y límite, días de ciclo, altitud máxima, lluvia y pH. ⚠️ **Hay que revisarlo a mano** (ver sección 10). |
| Tutoriales y curiosidades | Escritos por el equipo, con apoyo de manuales públicos | Por hacer | Por ejemplo: [Manual de huerto en casa (UV)](https://www.uv.mx/hab/files/2021/02/Manual-de-huerto-en-casa_HAB_DIF_2020.pdf), [Manual de agricultura urbana (Puebla)](https://smadsot.puebla.gob.mx/images/2.%20Manual%20Agricultura%20Urbana_VF.pdf). Escribir con nuestras palabras y citar la fuente. |

### Opcionales (suman puntos)

| Dato | Fuente | Estado | Para qué |
|---|---|---|---|
| Pronóstico de 7-16 días | Open-Meteo Forecast | Misma API | Alerta: "viene helada esta semana" |
| Pronóstico de 6 meses | [Open-Meteo Seasonal](https://open-meteo.com/en/docs/seasonal-forecast-api) | ✅ | "Este invierno viene más cálido de lo normal" (El Niño 2026-27) |
| Horas de luz y radiación solar | Open-Meteo (`daylight_duration`, `shortwave_radiation`) | Misma API | Consejos de luz |
| Sequía por municipio | [Monitor de Sequía, CONAGUA](https://smn.conagua.gob.mx/tools/RESOURCES/Monitor%20de%20Sequia%20en%20Mexico/MunicipiosSequia.xlsx) | ✅ | Consejos de riego y captación de lluvia |
| Qué se siembra en tu municipio | SIAP (cierre agrícola) | Sin probar | "En tu municipio sí se cultiva frijol" |
| Precios de mercado | SNIIM (ya descargado) | ✅ | "¿Cuánto ahorro?" |

### Archivo de cultivos que vamos a armar (`cultivos.json`)

Toma los números de ECOCROP y los completa a mano. Usa **los mismos nombres de campos que el contrato 2** de [`docs/json-contracts.md`](docs/json-contracts.md) (`nombre_cientifico`, `categoria`, `ficha_tecnica.temp_ideal_c`, `companeros_cultivo`, sin `ñ`), más los campos internos que necesita el motor de reglas:

| Campo interno | Origen | Para qué |
|---|---|---|
| `ecocrop_nombre` | ECOCROP | Saber de dónde salieron las temperaturas |
| `altitud_max_m` | ECOCROP (`ALTMX`) | Regla de altitud |
| `perenne` | ECOCROP (`LISPA`), revisado a mano | Revisar 12 meses en lugar del ciclo |
| `producto_sniim` | A mano | Variante de SNIIM para el perfil de precios (`null` si no está) |

---

## 7. Cómo decide la app (reglas)

Sin machine learning, solo reglas que se pueden explicar:

1. **Ciclo:** a partir del mes de siembra, tomamos los meses que dura el cultivo (máximo 6). Para los perennes revisamos los 12 meses.
2. **Temperatura:** en cada uno de esos meses, comparamos la temperatura media de tu zona con lo que necesita el cultivo:
   - Fuera del límite → ❌ *"en enero la media es 11 °C y necesita al menos 12 °C"*.
   - Dentro del límite pero fuera de lo ideal → ⚠️ *"enero es algo frío"*.
3. **Heladas:** calculamos el % de años en que ese mes tuvo al menos una noche de riesgo.
   - **Cultivos que no toleran heladas** (jitomate, chile, calabaza, frijol, maíz…): cuenta cualquier noche con mínima ≤ 2 °C. Con 20% o más → ❌; entre 5 y 20% → ⚠️.
   - **Cultivos que toleran heladas ligeras** (lechuga, espinaca, ajo, cebolla, zanahoria, cilantro…): solo cuentan las heladas fuertes (≤ −2 °C).
4. **Altitud:** si tu zona está más alta de lo normal para ese cultivo → ⚠️.
5. **Resultado:** ✅ / ⚠️ / ❌ y la razón principal en una frase.
6. **Calendario:** corremos las reglas para los 12 meses de siembra. Los meses ✅ son `meses_ideales` y los ✅ + ⚠️ son `meses_posibles`.

> Usamos 2 °C y no 0 °C porque el dato es la temperatura del aire a 2 m de altura en una zona de unos 10 km: cuando el aire está a 2 °C, a ras de suelo ya puede helar.

---

## 8. Prueba con datos reales: Toluca, Monterrey y Mérida

Corrimos un prototipo de las reglas con **30 años de clima (1996-2025)** de Open-Meteo y los requisitos de ECOCROP, para **sembrar en diciembre**.

| Zona | Clima en diciembre | ✅ Siembra ahora | ⚠️ Con cuidados | ❌ No ahora (y cuándo sí) |
|---|---|---|---|---|
| **Toluca** (2,670 m) | 11 °C de media; heladas en **57%** de los años | — | Lechuga, espinaca, acelga, zanahoria, rábano, cebolla, ajo, cilantro, perejil, chícharo, fresa | Jitomate, chile, tomate verde, frijol, maíz, calabacita, pepino, papa, albahaca → **marzo a julio** |
| **Monterrey** | 15 °C de media; heladas en **23%** de los años | — | Las mismas hojas y raíces, con protección de noche | Jitomate, chile, frijol, maíz, calabacita, pepino → **marzo a septiembre/octubre** |
| **Mérida** | 24 °C de media; sin heladas | **Jitomate, chile, tomate verde, frijol, maíz, calabacita, pepino, cilantro, cebolla, zanahoria, rábano, papa, albahaca** | Lechuga, espinaca (algo caluroso) | Perejil, fresa (abril pasa de 28 °C) |

**Esto coincide con la práctica real:**
- En el **altiplano frío** (Toluca) el invierno es para hojas y raíces, y la milpa se siembra en primavera.
- En **Yucatán**, el "invierno" (de octubre a enero) es la mejor época para el jitomate y las hortalizas, porque el verano es demasiado caluroso.

**Lo que aprendimos al probar**
- Con las reglas de helada "al pie de la letra", la primera versión decía que **nada** se podía sembrar en Toluca. **Hubo que separar a mano los cultivos que toleran heladas ligeras**, porque ECOCROP no tiene ese dato en 55% de las especies.
- ECOCROP tiene algunos datos raros. Por ejemplo, el nopal sale como sensible al frío, pero se cultiva en Milpa Alta, a 2,400 m. **Hay que revisar a mano cada uno de los 25 a 30 cultivos.**
- Todavía no consideramos la **lluvia** ni el **calor extremo de verano** (por ejemplo, Mérida en mayo). Se pueden agregar como avisos ⚠️.

---

## 9. Arquitectura y roles

```
[Usuario]
   │ ciudad o ubicación
   ▼
[Frontend web] ──► [API FastAPI] ──► Open-Meteo (geocoding, 30 años de clima, pronóstico 7 días)
                        │                └─ guardado en caché por zona (evita el error 429)
                        ├─► cultivos.json      (ECOCROP + curación manual + tutoriales + curiosidades)
                        ├─► sniim_perfiles.json (temporada de precios, CDMX 2021-2026)
                        ├─► sequia.json         (Monitor de Sequía, último reporte por municipio)
                        └─► motor de reglas (sección 7)
```

**Endpoints** (detalle, origen de cada campo y errores en [`docs/json-contracts.md`](docs/json-contracts.md))
- `GET /api/recomendaciones?q=Toluca&mes=12` (o `?lat=&lon=&mes=`) → zona, clima típico, sequía, alertas de 7 días y la lista ✅ / ⚠️ / ❌ con razón, calendario y datos de ahorro. Alimenta 4 de las 5 pantallas.
- `GET /api/cultivos/{id}` → ficha: tutorial, compañeros de cultivo, curiosidades, avisos y contexto de precios.

**¿Hace falta backend?** Aquí **sí conviene**:
- Guarda el clima en caché para no pedir 30 años en cada consulta.
- Evita el límite de Open-Meteo durante la demo.
- Deja las reglas en un solo lugar.

**Regla clave:** acordar el formato del JSON en la primera hora para que el frontend avance con datos de prueba.

| Rol | Persona | Tareas |
|---|---|---|
| Cultivos y contenido | Backend 1 | `cultivos.json`: ECOCROP + revisión manual + tutoriales + curiosidades |
| Clima | Backend 2 | Servicio de Open-Meteo, caché, clima típico por mes, riesgo de helada, alertas |
| API y reglas | Backend 3 | Endpoints, motor de reglas, textos de "por qué" |
| Diseño UX/UI | Frontend 1 | Pantallas, iconos de cultivos, colores ✅ ⚠️ ❌ |
| Web app | Frontend 2 | Interfaz, ubicación del navegador, conexión a la API |

---

## 10. Riesgos y cómo evitarlos

| Riesgo | Qué hacer |
|---|---|
| Open-Meteo responde 429 en la demo | Guardar en caché el clima de las ciudades de la demo desde antes |
| ECOCROP tiene datos raros o incompletos | Revisar a mano los 25 a 30 cultivos (unos 5 minutos cada uno) |
| Un consejo mal dado puede matar una planta | Mostrar "recomendación basada en el clima típico de tu zona" y avisar de los microclimas (azotea, sombra, interior) |
| Tutoriales copiados de otros sitios | Escribirlos con nuestras palabras y citar la fuente |
| La celda de clima (~10 km) no ve tu microclima | Usar el umbral de helada de 2 °C y avisarlo en la app |
| El contenido toma más tiempo del esperado | Empezar con 10 cultivos completos y agregar más después |

---

## 11. Historial: la idea anterior

Empezamos con un **monitor de precios de temporada** (qué fruta o verdura está barata y por qué sube). La cambiamos por esta idea, pero lo que aprendimos sirve para los extras:

- **SNIIM** se puede descargar fácil: 108,745 precios diarios de la Central de Abasto de CDMX (2021-2026), con estado de origen.
- La **temporada** mueve mucho el precio: la cebolla va de −50% en mayo a +60% en octubre, y el chile serrano de −32% en febrero a +54% en noviembre.
- El **calor fuera de lo normal** en las zonas productoras se relaciona con alzas de precio 1 a 3 meses después (correlación moderada).

**Cómo reusarlo:** *"El chile serrano sube 54% en noviembre. Si lo siembras en tu zona en julio, lo cosechas justo cuando está caro."*

El README completo de la idea anterior está en el historial de git (commit `244190e`).

---

**Documentos**
- [`docs/json-contracts.md`](docs/json-contracts.md): contratos oficiales de la API.
- [`docs/revision-contratos.md`](docs/revision-contratos.md): revisión de los contratos con datos reales y de dónde sale cada campo.

*Scripts de exploración (descarga de SNIIM, clima, análisis de correlación y prototipo de recomendador de siembra): disponibles localmente, pendiente subirlos al repo.*
