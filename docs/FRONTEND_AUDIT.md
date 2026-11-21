# Auditoría del frontend de QUESIEMBRO

**Corte: 20 de noviembre de 2026.** Frontend `f50bee6` y referencia local `origin/backend` en `1d95903`. Se revisaron el README, el contrato JSON oficial v2, el código React y el wireframe adjunto de 1282 × 844 px, que contiene tres pantallas.

## Resumen y arquitectura

La SPA ya implementa Inicio, Tu zona, Recomendaciones, Ficha y Calendario. React Router conserva zona, mes y filtro de espacio en la URL. `/cultivos/:id` conserva compatibilidad con la ruta canónica `/cultivo/:id`. Las páginas componen tarjetas, alertas, filtros y estados compartidos. TanStack Query centraliza caché y cancelación. El cliente Fetch separa la URL base y el modo demo, y valida los payloads antes de renderizar. El calendario usa ambas ventanas anuales de la API sin solicitar doce diagnósticos.

## Responsive y teclado

Brave headless midió las cinco pantallas en las siete anchuras. La tabla distingue el desborde del documento del carrusel horizontal intencional de destacados.

| Anchura | Resultado |
| --- | --- |
| 320 px | Sin desborde global. La navegación ocupa dos filas. En Inicio la cabecera quedó fuera del primer viewport tras el enfoque automático. |
| 375 px | Sin desborde global. Navegación en una fila. En Inicio también se desplazó la cabecera. |
| 430 px | Sin desborde global. Navegación en una fila. En Inicio también se desplazó la cabecera. |
| 768 px | Sin desborde global. Inicio pasa a dos columnas. |
| 1024 px | Sin desborde global. El calendario pasa a doce columnas por cultivo. |
| 1280 px | Sin desborde global. La aplicación permanece centrada. |
| 1920 px | Sin desborde global. El contenedor conserva su ancho máximo. |

Al entrar en Inicio, la primera pulsación de Tab enfocó el buscador, seguida de búsqueda, GPS, ciudades de ejemplo y filtros. El código incluye enlace de salto y foco programático en `main`. El desplazamiento observado y el orden inicial justifican revisar el enfoque. El botón de búsqueda mide 40 px, por debajo del objetivo interno de 44 px. El enlace de cambio de ubicación tiene un mínimo de 32 px por CSS, pendiente de medir dentro de su zona interactiva. El SVG de portada usa tamaños adaptables. Quedan pendientes revisión manual con lector de pantalla, zoom, contraste cuantificado y navegadores móviles físicos.

## Datos dinámicos y flujo de ubicación

El contrato documenta texto libre `q` o GPS y devuelve una localidad resuelta con posibles homónimos. No define catálogos de estados o municipios ni autocompletado. Por ello, el flujo implementable es **búsqueda o GPS → localidad resuelta o alternativa → clima y cultivos**. Una selección jerárquica Estado → Municipio requiere un acuerdo con backend.

- **Comprobado con JSON oficial servido localmente.** `q=Toluca` dibuja el clima, y seleccionar la alternativa de Chiapas envía sus coordenadas. El filtro de espacio no genera otra petición. La lista de alternativas viene de la respuesta.
- **Comprobado por inspección.** Los tres ejemplos y el `datalist` se muestran también en modo API. Son atajos de búsqueda, pero el autocompletado puede aparentar cobertura dinámica. En modo demo existe aviso persistente. Los ejemplos interpolan temperaturas para otros meses y reutilizan clima de Mérida o Monterrey para los homónimos de Toluca. Además, al cambiar de mes permanecen alertas y frecuencia de helada de la muestra base. Conviene acotar o etiquetar esos ejemplos a nivel de tarjeta.
- **Bloqueo de integración confirmado en código Python.** `backend/app/services/open_meteo.py` devuelve Toluca para toda búsqueda no vacía y para GPS conserva las coordenadas solicitadas con los metadatos de Toluca. Su fuente diaria y pronóstico devuelven listas vacías. `clima_processor.py` ignora la entrada y devuelve una tabla de Toluca. Por tanto, desactivar la demo de React frente a esa revisión puede presentar datos genéricos como si fueran locales. No se ejecutó FastAPI.
- **Caché y recuperación.** La clave usa localidad y mes con 30 minutos de frescura. Zona, ficha contextual y calendario comparten el diagnóstico. Se cancela la petición obsoleta. El 503 indica la espera, aunque permite reintentar de inmediato. Un fallo de red tiene mensaje específico por código; no se indujo en esta sesión. Tampoco se verificó CORS contra FastAPI.

## Validación del contrato JSON v2

El README actual y v2 coinciden en los dos endpoints con prefijo `/api`. Las antiguas rutas separadas de zona y alertas de revisiones previas no son parte del contrato actual. Se dio prioridad al contrato v2 y se contrastó con rutas y modelos Pydantic de la referencia backend.

| Área | Estado | Evidencia |
| --- | --- | --- |
| `GET /api/recomendaciones` | Cumple | Fetch emite GET con `q` o par GPS y conserva `mes` si se elige. Las coordenadas válidas prevalecen en URLs con ambos modos. Probados `q`, mes explícito y alternativa GPS con fixture v2. |
| Diagnóstico 200 y enums | Cumple | La muestra v2 pasa el validador. Tipos y reglas usan `optimo`, `con_cuidados`, `no_ahora`, `anios_con_helada_pct` y ambas ventanas. Consumidos además ubicación, clima, alertas, filtros rápidos y ahorro. El calendario usa ideal ⊆ posible como supuesto del contrato. |
| Nullable, omitidos e invariantes | Parcial | Se aceptan `null` en sequía, finanzas y contexto económico, y `[]` para alertas. Omitir `sequia` disparó error controlado. El ejemplo oficial incluye esa clave y FastAPI normalmente serializa los defaults; confirmar política de omisión antes de flexibilizar. El frontend valida meses/rangos pero no coherencia entre estado y semáforo ni subconjunto anual; `nivel` acepta cualquier cadena frente a `D0…D4` de Pydantic. |
| Sequía D0 | Parcial | El objeto es admitido, pero `ClimaCard` oculta todo con `activa: false`; se pierde «Anormalmente seco». Un `null` puede significar ausencia de coincidencia o ausencia de sequía, por lo que no justifica «Sin sequía». |
| `GET /api/cultivos/{id}` | Cumple | La muestra v2 renderizó la ficha. Se codifica el slug, se valida coincidencia de ID, y se admite tutorial por cadenas, compañeros con evidencia, advertencias, fuentes y bloque SNIIM anulable. |
| Errores y cargas | Parcial | Verificados 404 de búsqueda, 503 con espera, respuesta incompleta y lista vacía con servidor simulado. Se contemplan mensajes planos y anidados. Python también devuelve 400 con `ubicacion_invalida`, ausente del listado de v2 y del tipo `ErrorContrato`. El cliente conserva su mensaje genérico/de servidor. Falta probar 404 de ficha, 400/422 y conectividad contra la API real. |
| Integración extremo a extremo | No verificable | No hay FastAPI instalado en el entorno de auditoría ni URL de instancia. La rama backend está disponible para inspección, pero aún usa valores fijos de ubicación y clima. |
| Catálogo Estado → Municipio | No implementado | No existe requisito de ese endpoint en v2 ni ruta equivalente en la referencia Python examinada. |

## Comparación con el wireframe y UX/UI

| Pantalla | Coincidencias | Diferencias y propuesta |
| --- | --- | --- |
| Inicio | Marca, mensaje, ilustración de macetas, búsqueda, GPS y chips de espacio. | La navegación global añade una fila a 320 px. El wireframe enseña una localidad seleccionable junto al buscador; hoy los homónimos aparecen después del diagnóstico. Conservar texto libre y mostrar alternativas cerca del contexto de la búsqueda cuando existan. |
| Tu zona | Localidad, mes, tarjeta de temperatura, heladas y altitud, destacados y filtros. | El wireframe prioriza el título narrativo y tarjetas temáticas con progreso. Hoy se listan fichas destacadas de cultivos. Sol y lluvia no forman parte de v2. Mostrar mín./máx. y años con helada con textos claros. Solicitar esas métricas solo si se acuerdan para el producto. |
| Ficha | Volver, Compartir, nombre científico, recomendación contextual y cuadrícula de cuidados. | El gráfico actual muestra rangos térmicos y una media del mes. El wireframe muestra una serie anual, ausente en v2. Mantener los rangos hasta disponer de la serie y adelantar la explicación térmica respecto al sustrato. La ficha directa prescinde del diagnóstico si no hay zona. |
| Recomendaciones y Calendario | Existen como rutas y comparten contexto. | No aparecen como pantallas independientes en el archivo adjunto. Mantener acceso visible desde el flujo principal. |

La paleta verde, crema y terracota, Figtree con respaldo del sistema, las tarjetas, y los estados con texto e icono ya apuntan al diseño solicitado. Priorizar legibilidad y foco sobre efectos. Las fichas destacadas que ocupan un carrusel necesitan indicios de desplazamiento y comprobación de accesibilidad con teclado. El contraste de las variantes finas y el texto secundario requiere medición antes de certificarlo.

## Riesgos técnicos y dependencias

- **Alta, procedencia de datos.** Habilitar producción solo con resolución, histórico y pronóstico comprobados. Solicitar a backend un ambiente, catálogo sembrado, URLs/CORS y respuestas reales de ciudades homónimas, GPS y errores. Acordar metadatos de procedencia si continúa un modo simulado en FastAPI.
- **Alta, privacidad de ubicación.** `useGeolocation` copia las coordenadas del navegador sin reducción de precisión; `HomePage` las lleva a la URL. Historial y telemetría podrían retenerlas. Compartir ficha ya limpia los parámetros. Acordar precisión mínima para sus funciones y comprobar flujo URL.
- **Media, mantenibilidad.** `api.ts` importa de forma diferida el módulo mock y el mock importa `ErrorApi` de `api.ts`. No falló en build o en navegador, pero conviene desacoplar el tipo de error. Código legado de precios y dependencias directas sin imports de producción detectados, entre ellas Recharts, Zustand, Radix UI, date-fns y react-router importado indirectamente por react-router-dom. Revisar uso y paquete lock antes de retirar algo.
- **Media, resiliencia.** `sessionStorage` se usa en render y en handlers sin capturar excepciones. Puede bloquear un flujo de navegación con almacenamiento restringido. El estado de categoría puede quedar seleccionado al reemplazar el catálogo por otra localidad. Son riesgos de revisión estática.

## Evidencias y alcance

- `npm run build -- --outDir /tmp/quesiembro-audit-demo` pasó TypeScript y Vite. `VITE_USE_MOCKS=false ./node_modules/.bin/vite build --outDir /tmp/quesiembro-audit-api` pasó. Los builds se aislaron en `/tmp`.
- `npm run lint --if-present` y `npm run test --if-present` no encontraron scripts configurados. Su salida exitosa no representa ejecución de una suite.
- CDP sobre Brave headless con servidor temporal. 35 mediciones de anchura, comprobación básica de Tab, rutas directas, alias, ruta inexistente y zona sin selección. Con JSON v2, probados flujos de búsqueda, alternativa, filtro local, ficha y cuatro respuestas controladas. No se instaló software para la auditoría.
- Se inspeccionó `origin/backend` por lectura Git. La revisión del proveedor climático es estática. Quedan pendientes GPS con permiso real, captura visual comparativa exhaustiva, FastAPI en ejecución y pruebas de lector de pantalla.
