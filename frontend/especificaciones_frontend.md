# Especificaciones Técnicas de Desarrollo Frontend (React)
**Proyecto:** Monitor de Precios de Temporada y Factores Agrícolas (MVP)  
**Enfoque:** Dashboard Web Responsivo (*Mobile-First*) para el Consumidor Doméstico

---

## 1. Stack Tecnológico y Herramientas
El desarrollo frontend se construirá como una *Single Page Application* (SPA) rápida, modular y fuertemente tipada, optimizada para consultas rápidas desde dispositivos móviles o escritorio.

* **Core Framework:** React 18+ con **Vite** (para tiempos de compilación rápidos) y **TypeScript** (garantizando la integridad de las estructuras de datos provenientes de la API).
* **Estilos y Sistema de Diseño:** **Tailwind CSS** combinado con primitivos accesibles de **Radix UI** o **shadcn/ui** (modales, *drawers*, *tooltips*, selectores).
* **Visualización de Datos:** **Recharts** (librería nativa en React basada en componentes declarativos, ideal para gráficas combinadas de líneas/barras, áreas de referencia estacional y *tooltips* personalizados).
* **Gestión de Estado y Peticiones HTTP:**
  * **TanStack Query (React Query):** Para consumo de API, manejo automático de caché (evitando peticiones redundantes al alternar entre productos), estados de carga (*loading*) y reintentos.
  * **Zustand** (o React Context API): Para el estado global ligero (mes seleccionado, filtros activos y gestión de la lista de despensa persistida en `LocalStorage`).
* **Iconografía:** **Lucide React** para controles de interfaz + ilustraciones/iconos SVG personalizados para los productos agrícolas.
* **Formateo de Datos:** `Intl.NumberFormat` (moneda MXN y porcentajes) y `date-fns` para manejo de meses y periodos históricos.

---

## 2. Arquitectura de Carpetas Propuesta
Se utilizará una arquitectura modular orientada a funcionalidades (*Feature-based*) para facilitar el trabajo colaborativo y el mantenimiento del código:

```text
src/
├── api/                  # Configuración de Axios/Fetch y definición de endpoints
│   ├── client.ts
│   └── productosApi.ts
├── assets/               # Iconos SVG de frutas/verduras y recursos estáticos
├── components/           # Componentes UI reutilizables y genéricos
│   ├── ui/               # Botones, Badges, Skeletons, Cards, Tooltips
│   └── layout/           # Header, Footer, Contenedor principal
├── features/             # Módulos principales de la aplicación
│   ├── catalogo/         # Buscador predictivo, filtros por categoría y grid de productos
│   ├── dashboard/        # Vista principal de análisis por producto
│   │   ├── components/   # SemaforoCard, StorytellingBox, GraficaEstacional, SustitutosList
│   │   └── hooks/        # useProductoAnalisis.ts
│   ├── oportunidades/    # Carrusel/Banner superior "¿Qué conviene comprar hoy?"
│   └── despensa/         # Drawer lateral de calculadora de despensa básica (LocalStorage)
├── hooks/                # Custom hooks globales (useLocalStorage, useDebounce)
├── store/                # Estado global (mes seleccionado, carrito/despensa)
├── types/                # Interfaces y tipos de TypeScript (Producto, Historico, Clima)
├── utils/                # Funciones puras (formateo de moneda, cálculo de variaciones)
├── App.tsx               # Enrutamiento principal / Layout del Dashboard
└── main.tsx              # Punto de entrada y Providers (QueryClientProvider)
```

---

## 3. Desglose de Vistas y Componentes en React

### 3.1 Barra Superior y Controles Globales (`<HeaderControls />`)
* **Buscador Predictivo (`<ProductSearchBar />`):** Input con *debounce* (300ms) que filtra el catálogo en tiempo real por nombre o palabras clave (ej. "jitomate", "tomate rojo").
* **Filtro por Categoría (`<CategoryPills />`):** Botones tipo píldora (*Todos, Verduras, Frutas, Especias y Granos*).
* **Selector de Mes de Consulta (`<MonthSelector />`):** Dropdown o barra horizontal de meses (`Ene` - `Dic`). Por defecto inicia en el **mes actual**, permitiendo al usuario explorar qué ocurre en otros meses del año para planificar compras.

### 3.2 Panel de Oportunidades del Mes (`<MonthlyHighlights />`)
Ubicado en la parte superior del dashboard para ofrecer valor inmediato sin necesidad de buscar:
* **Tarjetas de Temporada Óptima (`<OpportunityCard />`):** Muestra los 3 o 4 productos con **Semáforo Verde** en el mes seleccionado, destacando el porcentaje de ahorro frente a su promedio anual (ej. *"Plátano: -22% más barato este mes"*). Al hacer clic, carga ese producto en el panel principal.
* **Aviso de Precaución (`<AlertBanner />`):** Resumen compacto de los productos en **Semáforo Rojo** durante ese mes.

### 3.3 Núcleo del Dashboard: Detalle del Producto (`<ProductDashboard />`)
Al seleccionar un producto, se renderiza una cuadrícula responsiva (*Grid de 12 columnas en escritorio, 1 columna en móvil*) compuesta por 4 sub-componentes:

1. **Tarjeta de Diagnóstico y Semáforo (`<PurchaseStatusCard />`):**
   * **Indicador Semáforo:** Badge prominente con color, icono y etiqueta clara:
     * 🟢 **Momento Óptimo de Compra** (Precio históricamente bajo / cosecha abundante).
     * 🟡 **Precio Estable / Normal** (Dentro del rango promedio anual).
     * 🔴 **Temporada Alta / Precio Elevado** (Escasez estacional o afectación climática).
   * **Métricas Clave:** Precio histórico promedio del mes seleccionado ($/kg), rango mínimo-máximo registrado y etiqueta de **Región Productora Principal** (ej. *Origen: Sinaloa*).

2. **Tarjeta de Data Storytelling (`<StorytellingInsightCard />`):**
   * Bloque narrativo diseñado para lectura rápida (máximo 3 líneas) que traduce los datos estadísticos a lenguaje cotidiano.
   * *Ejemplo de renderizado:* *"Entre diciembre y febrero el precio del jitomate sube un 35% en promedio debido a heladas en el norte del país y al incremento en costos de transporte invernal."*
   * Etiquetas de factores influyentes (*Tags* visuales: `❄️ Heladas en cultivo`, `⛽ Costo de flete`, `🌧️ Lluvias excesivas`).

3. **Gráfica Histórica Interactiva (`<SeasonalityChart />`):**
   * Implementada con `<ComposedChart>` de **Recharts** (`<ResponsiveContainer width="100%" height={320}>`).
   * **Eje X:** Meses del año (`Ene` a `Dic`) mostrando el comportamiento estacional promedio (3-5 años).
   * **Serie Principal (Barras o Línea Gruesa):** Precio histórico promedio por mes, resaltando visualmente el mes actualmente seleccionado.
   * **Capas Opcionales (*Toggles* interactivos sobre la gráfica):**
     * `[x] Mostrar Clima en Zona Productora`: Superpone una línea secundaria con la precipitación o temperatura promedio en la región agrícola.
     * `[ ] Mostrar Referencia de Combustible`: Superpone la tendencia del precio del diésel/gasolina para contextualizar costos logísticos.
   * **Tooltip Personalizado (`<CustomChartTooltip />`):** Al pasar el cursor o tocar un punto en móvil, muestra el precio promedio, la variación porcentual y una nota breve del evento climático de ese mes.

4. **Módulo de Alternativas de Temporada (`<SubstitutesPanel />`):**
   * Se renderiza condicionalmente cuando el producto consultado está en estado **Amarillo** o **Rojo**.
   * Muestra tarjetas compactas de 1 a 2 productos sustitutos (culinarios o nutricionales) que se encuentren en **Semáforo Verde** ese mismo mes, permitiendo hacer clic para cambiar a su análisis.

### 3.4 Calculadora Rápida de Despensa (`<PantryDrawer />`)
* **Botón Flotante / Acceso en Header:** Muestra el contador de productos agregados a la lista personal.
* **Panel Lateral (*Drawer*):** Permite al usuario añadir productos básicos con cantidades estimadas (ej. *2 kg de Jitomate, 1 kg de Limón, 1 kg de Cebolla*).
* **Cálculo Estacional Agregado:** Sin necesidad de registro ni base de datos de usuarios (persistido en `LocalStorage`), calcula cuánto cuesta esa misma lista en el mes seleccionado frente al mes más barato del año, sugiriendo cambios rápidos para optimizar el presupuesto.

---

## 4. Contratos de Datos (Interfaces TypeScript)
Para desacoplar el desarrollo frontend del backend desde el primer día (permitiendo trabajar inicialmente con archivos `mockData.json`), los componentes consumirán las siguientes estructuras:

```typescript
// src/types/agricola.ts

export type EstadoSemaforo = 'OPTIMO' | 'NORMAL' | 'ALTO';

export interface ProductoResumen {
  id: string;
  nombre: string;
  categoria: 'FRUTAS' | 'VERDURAS' | 'ESPECIAS_GRANOS';
  unidad: string; // ej. "kg"
  iconoUrl: string;
  estadoMesActual: EstadoSemaforo;
  precioPromedioMes: number;
  variacionPorcentualAnual: number; // ej. -18.5 (más barato) o +32.0 (más caro)
}

export interface PuntoMensual {
  mesNumero: number; // 1 - 12
  mesNombre: string; // "Ene", "Feb", etc.
  precioPromedio: number;
  precioMinimo: number;
  precioMaximo: number;
  temperaturaPromedioZona?: number; // °C en estado productor
  precipitacionMmZona?: number;     // mm de lluvia en estado productor
  indiceCombustible?: number;       // Referencia diésel/gasolina
  notaEvento?: string;              // Ej. "Inicio de temporada de sequía"
}

export interface AnalisisProductoDetalle extends ProductoResumen {
  regionProductoraPrincipal: string; // ej. "Michoacán"
  mesesBaratos: string[];            // ej. ["Mayo", "Junio", "Julio"]
  mesesCaros: string[];              // ej. ["Diciembre", "Enero"]
  hallazgoPrincipal: string;         // Texto de Data Storytelling
  factoresClave: Array<{
    tipo: 'CLIMA' | 'TRANSPORTE' | 'ESTACIONALIDAD';
    etiqueta: string;
  }>;
  serieHistoricaMensual: PuntoMensual[];
  sustitutosRecomendados: Array<{
    productoId: string;
    nombre: string;
    razonSustitucion: string; // ej. "Ideal para salsas frescas y 40% más económico este mes"
    ahorroEstimadoPorcentaje: number;
  }>;
}
```

---

## 5. Directrices de UX/UI y Rendimiento
1. **Diseño *Mobile-First*:** El usuario doméstico suele consultar esta información desde su teléfono mientras planea sus compras o está en el mercado. Todas las gráficas deben ser legibles en pantallas de `360px` de ancho sin scroll horizontal.
2. **Accesibilidad Cromática (Daltonismo):** El semáforo de compra nunca dependerá únicamente del color (verde/amarillo/rojo); cada estado irá acompañado obligatoriamente de un icono distintivo (`CheckCircle`, `MinusCircle`, `AlertTriangle`) y texto explícito.
3. **Lenguaje Libre de Tecnicismos:** La UI traducirá cualquier métrica estadística. En lugar de *"Desviación estándar positiva en Q1"*, se mostrará *"Suele subir de precio entre enero y marzo"*.
4. **Optimización de Carga:**
   * Uso de **Skeleton Screens** (`<DashboardSkeleton />`) durante las peticiones iniciales a la API.
   * Configuración de `staleTime: 1000 * 60 * 30` (30 minutos) en TanStack Query, ya que los datos históricos no cambian minuto a minuto, logrando una navegación instantánea entre productos.

---

## 6. Plan de Implementación Frontend (Sprints Sugeridos)
* **Sprint 1 (Estructura y Datos Mock):** Inicialización del proyecto con Vite + React + TypeScript + Tailwind. Creación de interfaces TypeScript y un archivo `mockProductos.ts` con 5 productos reales para desarrollar la UI sin bloquearse por el backend.
* **Sprint 2 (Componentes Core y Gráficas):** Desarrollo del buscador, selector de mes, tarjetas de semáforo, bloque de *Storytelling* y la gráfica interactiva en Recharts con capas activables.
* **Sprint 3 (Calculadora de Despensa y Sustitutos):** Implementación del *Drawer* lateral con persistencia en `LocalStorage` y lógica visual de sustitución inteligente.
* **Sprint 4 (Integración API y Pulido UX):** Conexión con los endpoints reales del backend mediante TanStack Query, manejo de estados de error/vacío, pruebas responsivas en móvil y despliegue (Vercel / Netlify).