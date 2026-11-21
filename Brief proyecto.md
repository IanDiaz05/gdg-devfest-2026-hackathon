# Project Brief: Monitor de Precios de Temporada y Factores Agrícolas (MVP)

## 1. Visión General del Proyecto
Aplicación web intuitiva tipo **Dashboard** dirigida al consumidor doméstico, diseñada para ayudar en la planeación del gasto en despensa y finanzas personales. La plataforma analiza el comportamiento histórico de precios de productos agrícolas básicos (frutas, verduras, especias, café) y explica de forma visual y sencilla **cuándo conviene comprarlos** y **por qué fluctúan sus precios**, cruzando datos históricos de mercado con variables climáticas y logísticas (como el precio del combustible).

---

## 2. Objetivos del Proyecto
* **Objetivo Principal:** Empoderar al usuario doméstico con información clara y accionable sobre la estacionalidad de alimentos básicos para optimizar su presupuesto semanal/mensual.
* **Objetivos Específicos:**
  1. **Identificar ventanas de compra:** Mostrar de forma visual los meses o semanas históricamente más baratos y más caros para cada producto.
  2. **Explicar el "Porqué" (Data Storytelling):** Correlacionar las subidas o bajadas de precios con eventos climáticos en las zonas productoras (sequías, heladas, lluvias excesivas) y costos de transporte (precio de la gasolina/diésel).
  3. **Centralizar métricas clave en una interfaz amigable:** Traducir datos económicos y meteorológicos complejos en indicadores simples (semáforos de compra, alertas de temporada, gráficas comparativas) sin jerga técnica.

---

## 3. Usuario Objetivo (Target)
* **Perfil:** Consumidor doméstico / responsable de las compras del hogar.
* **Necesidades:** Tiene poco tiempo para investigar, busca ahorrar en el súper o mercado, quiere entender por qué subió el precio de un ingrediente básico (ej. jitomate, limón, aguacate, café) y saber qué alternativas comprar en esa temporada.
* **Nivel técnico:** Básico/Intermedio (requiere una UX limpia, visual, directa y fácil de interpretar en segundos).

---

## 4. Alcance del Proyecto (Scope)

### Lo que SÍ abarca (In-Scope - Fase MVP)
* **Catálogo de productos genéricos:** Frutas, verduras, hortalizas, especias y granos básicos derivados de cosechas (ej. tomate/jitomate, cebolla, limón, aguacate, chile, café, plátano, papa).
* **Análisis Histórico Descriptivo:** Recopilación y limpieza de series de tiempo (idealmente de los últimos 3 a 5 años) para detectar patrones estacionales recurrentes.
* **Cruce de Variables Externas:**
  * *Clima:* Temperatura, precipitación y anomalías climáticas en las principales regiones productoras de cada insumo.
  * *Logística/Economía:* Precio histórico de combustibles (gasolina regular/diésel) e inflación alimentaria general como contexto de transporte.
* **Dashboard Interactivo:**
  * Buscador/selector de productos.
  * Indicador visual de "Momento de Compra" (ej. *Óptimo / Precio Normal / Temporada Alta - Caro*).
  * Gráfica histórica de precios por mes con anotaciones de eventos climáticos/económicos.
  * Tarjetas de "Hallazgos clave" (ej. *"El tomate sube un 35% entre diciembre y febrero debido a heladas en el norte y mayor costo de flete"*).

### Lo que NO abarca (Out-of-Scope - Fase MVP)
* **Productos procesados o de marcas comerciales:** No se compararán marcas específicas (ej. no se comparará "Café marca X vs. Marca Y", sino el grano/producto genérico).
* **Comparador de precios en tiempo real por supermercado:** No se hará *web scraping* diario de tiendas minoristas (Walmart, Soriana, Chedraui, etc.) ni geolocalización de ofertas por sucursal.
* **Algoritmos Predictivos / Machine Learning:** Debido a limitaciones de tiempo, no se entrenarán modelos de predicción a futuro (*forecasting*). Las recomendaciones se basarán estrictamente en **estadística histórica y estacionalidad comprobada** *(queda documentado como posible Fase 2)*.
* **App móvil nativa:** El desarrollo se centrará en una aplicación web responsiva (Web App / Dashboard).

---

## 5. Fuentes de Datos Recomendadas (Enfoque México / Referencia Internacional)

Para alimentar el backend y la base de datos, se sugieren las siguientes fuentes abiertas y gratuitas (con opción de descarga CSV o API):

### A. Precios Históricos de Productos Agrícolas
1. **SNIIM (Sistema Nacional de Información e Integración de Mercados - Secretaría de Economía):**
   * *Qué aporta:* Precios históricos diarios/semanales al mayoreo en Centrales de Abasto de todo México. Es la mejor fuente para ver el comportamiento real del campo al mercado.
2. **INEGI (Índice Nacional de Precios al Consumidor - INPC):**
   * *Qué aporta:* Variación porcentual histórica de precios al consumidor final por producto genérico (útil para validar el impacto real en el bolsillo doméstico).
3. **SIAP (Servicio de Información Agroalimentaria y Pesquera):**
   * *Qué aporta:* Calendarios de siembra y cosecha por estado (indispensable para saber **qué estado produce qué producto** y en qué meses).

### B. Datos Climáticos (Variables de Producción)
1. **Open-Meteo API (Historical Weather API):**
   * *Qué aporta:* API gratuita, rápida y sin necesidad de API Key para obtener datos históricos diarios (temperatura máx/mín, precipitación, radiación) filtrados por coordenadas de las zonas agrícolas.
2. **CONAGUA / SMN (Servicio Meteorológico Nacional) o Monitor de Sequía en México:**
   * *Qué aporta:* Reportes históricos de sequías, heladas o huracanes por estado para etiquetar anomalías en las gráficas.
3. **NASA POWER API:**
   * *Qué aporta:* Datos agroclimáticos globales (humedad del suelo, temperaturas, lluvias) ideales para análisis agrícolas.

### C. Factores Logísticos y Económicos (El "Porqué" externo)
1. **CRE (Comisión Reguladora de Energía) / Datos Abiertos Gob.mx:**
   * *Qué aporta:* Precios históricos promedio de gasolina regular y diésel en México (impacto directo en el costo de transporte/flete).
2. **Banxico (Sistema de Información Económica - SIE):**
   * *Qué aporta:* Inflación subyacente y no subyacente (agropecuarios) para contextualizar subidas generalizadas de precios.

---

## 6. Arquitectura y División de Roles Sugerida

| Área / Rol | Responsabilidades Clave en el Proyecto |
| :--- | :--- |
| **Data / ETL & Análisis** | • Definir la lista final de 10-15 productos clave.<br>• Extraer, limpiar y normalizar los datos históricos (SNIIM, Open-Meteo, CRE).<br>• Mapear cada producto con su estado principal productor.<br>• Calcular promedios mensuales, variaciones y redactar los "hallazgos" (insights) que explican las subidas/bajadas. |
| **Base de Datos** | • Diseñar el esquema relacional o documental (Productos, Regiones, Histórico_Precios, Histórico_Clima, Factores_Externos, Hallazgos).<br>• Cargar los datasets limpios y optimizar consultas por producto y mes. |
| **Backend (API)** | • Desarrollar endpoints RESTful para servir los datos al frontend (ej. `GET /productos`, `GET /productos/{id}/historico`, `GET /recomendaciones-mes`).<br>• Implementar lógica de cálculo para el "Semáforo de Compra" (comparar el mes actual/seleccionado vs. el promedio histórico). |
| **Diseño UX/UI** | • Diseñar wireframes centrados en el usuario doméstico (evitar saturación de datos).<br>• Definir paleta de colores, iconografía de productos y componentes visuales (tarjetas de recomendación, semáforos, tooltips explicativos). |
| **Frontend (Dashboard)** | • Construir la interfaz web responsiva.<br>• Integrar librerías de visualización de datos (ej. Chart.js, Recharts, ApexCharts) para mostrar precios vs. clima.<br>• Conectar con los endpoints del Backend. |

---

## 7. Entregables del MVP
1. **Repositorio de datos limpios** de al menos 10 productos agrícolas básicos (3-5 años de historia).
2. **Base de datos estructurada** con la relación Producto ↔ Región Productora ↔ Clima ↔ Precio.
3. **API funcional** que entregue métricas históricas y hallazgos.
4. **Dashboard Web desplegado** donde un usuario pueda seleccionar un producto, ver en qué meses es más barato comprarlo y leer la explicación respaldada por datos del clima y transporte.