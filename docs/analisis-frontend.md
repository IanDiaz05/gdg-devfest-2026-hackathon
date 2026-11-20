# Análisis de frontend: diseño `QueSiembro.pdf`

Revisión de las 3 pantallas del diseño (Inicio, Tu zona y Ficha del cultivo), comparadas con los [contratos de la API](json-contracts.md) y con **datos reales de Mérida** consultados el 20-nov-2026.

---

## Resumen

El diseño es limpio, se entiende en segundos y sigue bien la idea de *"sin cuentas, solo cultivar"*.

| | Qué hacer |
|---|---|
| 🔴 **Falta** | La sección **"Recomendaciones del mes"**, el **filtro de espacio** (maceta chica, maceta grande, patio) y el **mini calendario** de cada cultivo |
| 🟠 **Corregir** | Etiquetas que no coinciden entre pantallas, días de cosecha distintos, "Sequía: baja" (no existe), nombre científico viejo |
| 🟡 **Sobra** | La altitud en grande y el icono de guardar (si no hay pantalla "Mi huerto") |
| ➕ **Agregar** | Gráfica "¿Por qué sí?" en la ficha, curiosidades, avisos ("Ojo"), precio en el mercado y alertas |

---

## Prioridades

| Prioridad | Qué | Pantalla | ¿Está en el contrato v2? |
|---|---|---|---|
| **P1** | Mismas 3 etiquetas en todas partes (Siembra ahora / Con cuidados / No ahora) | 2 y 3 | ✅ `estado` |
| **P1** | Filtro "¿Qué espacio tienes?" | 2 | ✅ `filtros_rapidos.espacio_tipo` |
| **P1** | Mini calendario de 12 meses en cada tarjeta | 2 | ✅ `meses_ideales`, `meses_posibles` |
| **P1** | Razón + qué hacer, en dos líneas | 2 | ✅ `razon_corta` (falta el consejo, ver abajo) |
| **P1** | Corregir datos del diseño (sequía, días de cosecha, nombre científico) | 2 y 3 | ✅ |
| **P2** | Sección "Recomendaciones del mes" | 2 | ❌ **Hay que agregarla** |
| **P2** | Gráfica "¿Por qué sí?" (temperatura de tu zona contra el rango ideal) | 3 | ⚠️ Falta la temperatura de los 12 meses |
| **P2** | Curiosidades, "Ojo" y fuentes | 3 | ✅ |
| **P2** | Aviso de alerta de helada o calor | 2 | ✅ `alertas_7_dias` |
| **P3** | Precio en el mercado (barra de 12 meses) | 3 | ✅ `perfil_mensual_pct` |
| **P3** | Etiqueta de ahorro en la tarjeta | 2 | ✅ `finanzas_sniim.destacar_ahorro` |
| **P3** | "Mi huerto" (guardar en el navegador) | Nueva | — No hace falta backend |

---

## Pantalla 1: Inicio

### Qué funciona ✅
- El buscador de ciudad o municipio y el botón "Usar mi ubicación actual".
- Los accesos rápidos **Toluca, Monterrey y Mérida**. Además, conviene tener esas 3 ciudades en caché para la demo.
- *"Sin cuentas. Sin registro. Solo cultivar."*: deja clara la propuesta.

### Búsqueda sin login: ¿por estado o por ciudad?

**No conviene buscar solo por estado.** El clima cambia demasiado dentro de un mismo estado: en Chihuahua hay desierto y sierra, y en el Estado de México está Toluca (2,670 m) y también zonas templadas más bajas. La recomendación tiene que ser por **ciudad o municipio**.

| Opción | Cómo funciona | Ventajas | Desventajas |
|---|---|---|---|
| **A. Buscador con autocompletado** (recomendada para la demo) | Mientras el usuario escribe, se muestran resultados del geocoding de Open-Meteo con su estado: "Toluca, Estado de México", "Toluca, Chiapas" | Ya está probado y funciona igual que el diseño | El cruce con la sequía es por nombre, así que puede fallar en algunos municipios |
| **B. Estado → municipio** | Dos listas: primero el estado y luego el municipio, con el catálogo de municipios del INEGI | Usa la **misma clave de municipio que el Monitor de Sequía**, así que el cruce es exacto. No hay ambigüedad | Hay que descargar y preparar el catálogo (**todavía sin probar**). Son dos pasos para el usuario |

**Sin login:**
- Guardar la última ubicación y el espacio elegido en el navegador (`localStorage`).
- URL que se pueda compartir, por ejemplo `/zona/merida?mes=11`.

### Qué agregar
- **"¿Qué espacio tienes?"** como pregunta opcional después de elegir la ubicación: maceta chica / maceta grande / patio. Se guarda en el navegador y filtra la lista.
- **Selector de mes** opcional ("¿Cuándo quieres sembrar?"). El mes actual va por defecto. Sirve para planear y para la demo.

---

## Pantalla 2: Tu zona y lista de cultivos

### Qué funciona ✅
- La tarjeta de clima, arriba y fácil de leer.
- Los filtros por estado del cultivo y por categoría.
- Las tarjetas con icono, días, dificultad y etiqueta de color **con icono** (✓ △ ×). Que no dependan solo del color es bueno para accesibilidad.

### Qué corregir 🟠

| En el diseño | Problema | Cambiar por |
|---|---|---|
| "24 °C · Promedio mensual" | El dato real de Mérida en noviembre es **24.7 °C** | Usar el valor de la API, sin redondear a mano |
| "Sequía: baja" | Esa categoría no existe. Mérida está **sin sequía** (Monitor de Sequía, 15-nov-2026) | *Sin sequía / Anormalmente seco / Sequía moderada / severa / extrema / excepcional* |
| Filtro "Siembra ahora" y etiqueta "Ideal" | Dos nombres para lo mismo | Las mismas 3 etiquetas en filtros, tarjetas y ficha |
| Jitomate "70–90 días" en la tarjeta y "70 a 150 días" en la ficha | Dos datos distintos | Un solo dato: `dias_cosecha_aprox` (90) en la tarjeta y `dias_a_cosecha` (70–110) en la ficha |
| "Rango ideal: 20–27 C en este mes en tu zona" | Confuso, y falta el ° | *"Noviembre en Mérida: 25 °C, dentro de su rango ideal (20–27 °C)"* |
| "Para tu huerto · 3 cultivos" | En el prototipo, Mérida en diciembre dio **19 cultivos ✅** de 27 | Diseñar para listas largas: ordenar ✅ → ⚠️ → ❌ y, dentro de cada grupo, por dificultad |

### Qué sobra 🟡
- **"9 m de altitud" en grande.** Es un dato correcto, pero al usuario no le dice nada. Ponerlo en texto pequeño y usar ese espacio para **lluvia del mes** u **horas de sol**.
- **Icono de guardar 🔖.** Sin login, solo puede guardar en el navegador. O se hace una pantalla "Mi huerto" (P3) o se quita.

### Qué falta 🔴

**1. Filtro de espacio.** Una fila de chips: *Maceta chica · Maceta grande · Patio*. Es el filtro más útil para quien vive en departamento. Ya viene en el contrato (`espacio_tipo`).

**2. Mini calendario en cada tarjeta.** 12 puntos o letras (E F M A M J J A S O N D):
- verde = `meses_ideales`
- amarillo = `meses_posibles` que no son ideales
- gris = no conviene

Es clave en las tarjetas ❌, para decir **cuándo sí**.

**3. Razón + qué hacer, en dos líneas.** Ejemplo para el epazote en Mérida:
> *Noviembre es algo caluroso para el epazote (25 °C; lo ideal es 15–22 °C).*
> *Ponlo en media sombra y mantén la tierra húmeda.*

Hoy el diseño muestra solo el consejo ("Conserva la humedad y protege del sol intenso"), sin decir por qué.

**4. Aviso de alerta** arriba de la tarjeta de clima, solo cuando `alertas_7_dias` no está vacío: *"❄️ Helada el jueves: cubre tus macetas en la noche"*.

**5. Etiqueta de ahorro** en la tarjeta, solo cuando `destacar_ahorro = true`: *"💰 Lo cosechas cuando está caro"*.

**6. ⭐ Sección "Recomendaciones del mes"** (ver la siguiente sección).

---

## Nueva sección: "Recomendaciones para noviembre en Mérida"

Va **entre la tarjeta de clima y la lista de cultivos**: 4 a 6 tarjetas pequeñas, deslizables de lado en el celular. **Todo sale de datos que ya tenemos**; solo hacen falta plantillas de texto en el backend.

| Tarjeta | Ejemplo (datos reales de Mérida) | Regla | Datos |
|---|---|---|---|
| 🌱 **Para empezar** | "Rábano, cilantro y albahaca: fáciles y caben en maceta chica" | ✅ + `dificultad = facil` + espacio del usuario, máximo 3 | Contrato actual |
| 📅 **Tu mejor temporada** | "De octubre a enero es la mejor época del año para hortalizas en tu zona" | Los meses con más cultivos ✅ | Contrato actual |
| 🔥 **Lo que viene** | "En abril y mayo hay unos 20 días arriba de 35 °C: siembra ahora para cosechar antes del calor" | Si en los próximos 3 meses hay ≥ 5 días con máxima ≥ 35 °C | **Nuevo:** días ≥ 35 °C por mes |
| ❄️ **Lo que viene** (zonas frías) | Toluca: "En diciembre hay heladas en 57% de los años: siembra hojas y raíces" | Si en los próximos 3 meses `anios_con_helada_pct ≥ 20` | Contrato actual |
| 💧 **Riego** | "En noviembre llueven ~37 mm: riega cada 2 o 3 días, temprano" | Lluvia del mes + evapotranspiración | **Nuevo** |
| ☀️ **Sol** | "10 horas de sol al día: ideal para jitomate y chile" | Horas de sol del mes | **Nuevo** |
| 🌧️ **Lluvias** | "Las lluvias empiezan en junio: buen momento para la milpa de temporal" | Primer mes con > 80 mm | **Nuevo** |
| 💰 **Ahorro** | "Si siembras jitomate en agosto, lo cosechas en noviembre, cuando sube +29%" | Solo si algún cultivo tiene `destacar_ahorro` | Contrato actual |

> ⚠️ **Cuidado con la tarjeta de ahorro.** Si se siembra jitomate en Mérida en noviembre, se cosecha en febrero, que es justo cuando está **más barato** (−28%). Esa tarjeta solo debe aparecer si la cosecha cae en un mes caro; si no, se omite.

### Datos nuevos (comprobados: salen en la misma llamada a Open-Meteo)

Se agregan a la petición de 30 años que ya hace el backend, sin llamadas extra. Valores reales de **Mérida, promedio 1996-2025**:

| Variable de Open-Meteo | Ene | Mar | Abr | May | Jun | Sep | Nov | Dic | Uso |
|---|---|---|---|---|---|---|---|---|---|
| `precipitation_sum` (mm/mes) | 21 | 13 | 21 | 49 | **130** | 125 | 37 | 23 | Riego, temporada de lluvias |
| `sunshine_duration` (h/día) | 9.4 | 11.2 | 11.7 | 11.8 | 11.0 | 10.9 | 10.1 | 9.4 | Consejos de luz |
| `et0_fao_evapotranspiration` (mm/día) | 3.6 | 5.6 | **6.4** | 6.3 | 5.3 | 4.5 | 3.6 | 3.4 | Cuánta agua dar |
| `relative_humidity_2m_mean` (%) | 71 | 62 | 60 | 63 | 73 | **80** | 75 | 73 | Aviso de hongos |
| Días con `temperature_2m_max` ≥ 35 °C | 0 | 9.5 | 18.5 | **20.8** | 10.5 | 4.2 | 0.1 | 0 | Regla de calor extremo |

**Cálculo aproximado de riego para una maceta:** evapotranspiración (mm/día) × superficie de la maceta (m²) = litros por día. Una maceta de 20 L tiene ~0.1 m² de superficie: en noviembre en Mérida, 3.6 × 0.1 ≈ **0.35 L/día ≈ 2.5 L por semana**. Es una guía; hay que mostrarla como *"aproximado"*.

### Propuesta de contrato (pendiente de aprobar)

Agregar a `clima_zona` y un arreglo nuevo `recomendaciones_mes` en el contrato 1:

```json
{
  "clima_zona": {
    "lluvia_mes_mm": 37,
    "horas_sol_dia": 10.1,
    "evapotranspiracion_mm_dia": 3.6,
    "humedad_pct": 75,
    "dias_calor_35": 0.1,
    "temp_media_12_meses_c": [23.1, 24.4, 26.2, 28.1, 29.2, 28.3, 28.4, 28.3, 27.6, 26.3, 24.7, 23.7]
  },
  "recomendaciones_mes": [
    {
      "tipo": "para_empezar",
      "icono": "🌱",
      "titulo": "Para empezar",
      "mensaje": "Rábano, cilantro y albahaca: fáciles y caben en maceta chica.",
      "cultivos": ["rabano", "cilantro", "albahaca"]
    },
    {
      "tipo": "lo_que_viene",
      "icono": "🔥",
      "titulo": "Lo que viene",
      "mensaje": "En abril y mayo hay unos 20 días arriba de 35 °C: siembra ahora para cosechar antes del calor.",
      "cultivos": []
    },
    {
      "tipo": "riego",
      "icono": "💧",
      "titulo": "Riego",
      "mensaje": "En noviembre llueven ~37 mm: riega cada 2 o 3 días, temprano.",
      "cultivos": []
    }
  ]
}
```

- `temp_media_12_meses_c` también alimenta la gráfica "¿Por qué sí?" de la ficha.
- Valores de `tipo`: `para_empezar`, `mejor_temporada`, `lo_que_viene`, `riego`, `sol`, `lluvias`, `ahorro`.

---

## Pantalla 3: Ficha del cultivo

### Qué funciona ✅
- El encabezado verde "Siémbralo ahora este mes · Noviembre · Mérida".
- Las 4 tarjetas: Luz, Maceta, Riego y Cosecha.
- El tutorial en acordeón ("De semilla a cosecha").
- El botón de compartir, que funciona sin login con el menú de compartir del celular.

### Qué corregir 🟠

| En el diseño | Cambiar por |
|---|---|
| *Lycopersicon esculentum* | ***Solanum lycopersicum*** (`nombre_cientifico`). El otro es el nombre viejo de ECOCROP y solo se usa internamente |
| Cosecha "70 a 150 días" | **70 a 110 días** (`ficha_tecnica.dias_a_cosecha`) |
| Compañeros "+ Albahaca", "+ Zanahoria" | El "+" parece un botón de agregar. Hacerlos **links** a sus fichas y agregar **"Evitar: papa"** (`companeros_cultivo.evitar`) |
| Encabezado sin razón | Agregar la razón: *"Noviembre en Mérida (25 °C) está en su rango ideal"* |

### Qué falta (orden sugerido en la pantalla)

1. **Encabezado** + razón *(ya existe; agregar la razón)*.
2. **Luz / Maceta / Riego / Cosecha** *(ya existe)*. En Riego se puede agregar *"~2.5 L por semana en noviembre"* (aproximado).
3. **¿Por qué sí? (P2)**: una gráfica de línea con la temperatura media de tu zona en los 12 meses, una franja verde con el rango ideal del cultivo (20–27 °C) y los meses posibles marcados. Es la gráfica que explica toda la app de un vistazo.
4. **De semilla a cosecha** *(ya existe)*.
5. **Compañeros**: aliados y "evitar" *(corregir)*.
6. **¿Sabías que…? (P2)**: `curiosidades[]`, en una tarjeta con gancho.
7. **Ojo (P2)**: `ojo[]`, por ejemplo *"Las hojas no se comen y son tóxicas para perros y gatos"*.
8. **Precio en el mercado (P3)**: barra de 12 meses con `perfil_mensual_pct`. Texto: *"En la Central de Abasto CDMX es más caro en diciembre (+33%) y más barato en febrero (−28%)"*. Mostrar siempre `mercado_referencia`.
9. **Fuentes**: texto pequeño al final.

---

## Estados que faltan en el diseño

| Estado | Dónde | Qué mostrar |
|---|---|---|
| **Cargando** | Pantalla 2 | Tarjetas "esqueleto" grises. La primera consulta de una zona nueva tarda de 2 a 5 s (30 años de clima) |
| **Ciudad no encontrada** | Pantalla 1 | *"No encontramos 'Tolucaa' en México. Revisa el nombre o usa tu ubicación."* (error 404 del contrato) |
| **Varias ciudades con el mismo nombre** | Pantalla 1 o 2 | *"¿Quisiste decir Toluca, Chiapas?"* con `ubicacion.alternativas` |
| **Clima no disponible** | Pantalla 2 | *"El servicio de clima está saturado. Intenta en un minuto."* (error 503) |
| **Sin sequía o sin dato** | Tarjeta de clima | Si `sequia` es `null`, ocultar la etiqueta; no mostrar "baja" |
| **Sin alertas** | Pantalla 2 | No mostrar nada (`alertas_7_dias: []`) |
| **Ningún cultivo ✅** | Pantalla 2 | Pasa en zonas frías en invierno, como Toluca en diciembre. Mostrar los ⚠️ primero con *"En tu zona, este mes conviene sembrar con cuidados"* |
| **Cultivo sin precios** | Ficha | Si `contexto_economico_sniim` es `null`, ocultar la sección |
| **Sin emoji** | Tarjetas | Epazote, chayote, nopal, amaranto, cilantro y chícharo no tienen emoji: hacen falta íconos propios |
| **Ubicación por GPS** | Pantalla 2 | No hay nombre de lugar: mostrar *"Tu ubicación"* y ocultar la sequía |

---

## Más contenido que se puede agregar (escrito a mano, no viene de una API)

| Contenido | Dónde | Prioridad |
|---|---|---|
| 2 o 3 **plagas comunes** por cultivo y remedios caseros | Ficha | P3 |
| **Dónde conseguir semillas**: viveros, semillas criollas, bancos de semillas | Tarjeta general | P3 |
| **Compost casero** en una tarjeta | Recomendaciones | P3 |
| **"Siembra desde tu cocina"**: ajo, cebollín, jengibre, hueso de aguacate | Recomendaciones o ficha | P3 |

---

## Checklist para el frontend

**Pantalla 1**
- [ ] Autocompletado con estado en cada resultado
- [ ] Guardar ubicación y espacio en `localStorage`
- [ ] URL que se pueda compartir (`/zona/{lugar}?mes=`)
- [ ] Estado de error "ciudad no encontrada"

**Pantalla 2**
- [ ] Mismas 3 etiquetas en filtros y tarjetas
- [ ] Filtro de espacio
- [ ] Mini calendario de 12 meses en cada tarjeta
- [ ] Razón + qué hacer en dos líneas
- [ ] Sección "Recomendaciones del mes"
- [ ] Aviso de alerta (solo si hay)
- [ ] Altitud en texto pequeño; lluvia u horas de sol en su lugar
- [ ] Sequía con las categorías reales del Monitor
- [ ] Estados: cargando, sin ✅, sin sequía

**Pantalla 3**
- [ ] *Solanum lycopersicum* y 70–110 días
- [ ] Compañeros como links + "Evitar"
- [ ] Gráfica "¿Por qué sí?"
- [ ] ¿Sabías que…?, Ojo y Fuentes
- [ ] Precio en el mercado (se oculta si es `null`)
