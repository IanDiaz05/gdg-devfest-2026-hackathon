# Mejoras del frontend de QUESIEMBRO

## Resumen y diagnóstico

La SPA de React conserva el cliente Fetch, React Router, TanStack Query y el contrato JSON oficial v3.1. Se revisaron el README, el contrato y las auditorías, incluido el análisis del wireframe de Inicio, Tu zona y Ficha. El archivo gráfico original no estaba en el checkout. La revisión anterior registró navegación en dos filas a 320 px, controles táctiles pequeños y poco aprovechamiento horizontal. El frontend carecía de manifest, service worker y gestión de desconexión.

## Distribución, responsive y sistema visual

- **Inicio:** buscador de ciudad o municipio, GPS y espacio en una secuencia compacta. La ilustración botánica conserva su lugar y pasa a la segunda columna cuando hay anchura suficiente.
- **Tu zona:** cabecera con localidad y mes, bloque histórico con unidades y periodo de referencia, y pronóstico en una sección identificada. A partir de 1024 px se pueden presentar lado a lado. Los destacados se deslizan en móvil y se disponen en cuadrícula en pantallas amplias.
- **Recomendaciones:** espacio y categorías reunidos en un panel, resultados adaptables de una a tres columnas y estados con texto e icono. El conteo filtrado se anuncia a tecnologías de asistencia.
- **Ficha:** cabecera compacta, requisitos en dos o cuatro columnas, frecuencia de riego cuando la API la informa, gráfico térmico junto al sustrato en pantallas amplias y tutorial numerado. Se conserva el icono del cultivo provisto por la API.
- **Calendario:** tres, cuatro, seis o doce columnas según el espacio. Conserva el orden de los meses, estados con símbolos, leyenda y filtros. La vista móvil distribuye los meses en varias filas.
- **Navegación:** barra inferior con cuatro destinos y áreas seguras en móvil, cabecera convencional a partir de 768 px. Hay enlace de salto, foco visible, controles de navegación de al menos 44 px y respeto a la preferencia de movimiento reducido.
- **Tema:** bosque, salvia, crema y blanco cálido centralizados en Tailwind. Se comparten contenedor, superficies, botones, estados y espaciado. La portada reutiliza la ilustración vectorial y las demás pantallas se cargan bajo demanda con skeletons. El bloque JavaScript de entrada quedó en aproximadamente 103 kB gzip.

## PWA y funcionamiento offline

El manifest usa QUESIEMBRO, nombre corto QueSiembro, idioma es-MX, modo standalone, scope e inicio relativos al despliegue. Incluye PNG de 192 y 512 px aptos para máscara y un icono de inicio de 180 px para iOS. El registro se realiza en el build de producción bajo HTTPS o localhost.

| Recurso | Estrategia |
| --- | --- |
| HTML y archivos compilados | Precarga por revisión. El worker sirve el HTML y los chunks de la misma revisión mediante Cache First, también para rutas directas de la SPA. |
| Iconos locales | Copia inmediata y revalidación en segundo plano cuando hay red. |
| Datos de API | Network First en el cliente HTTP. Solo se guardan fichas públicas y consultas exitosas y validadas por nombre de localidad. Hay hasta 36 entradas, y al leerlas se aplica un límite de siete días. El mes implícito se distingue por año y mes para evitar mezclar consultas. |
| Consultas por coordenadas, errores HTTP y otros recursos | Las respuestas de GPS y los errores HTTP no se persisten. Se respeta `private` y `no-store`. La API y los orígenes externos están fuera de la interceptación del service worker. |

Al fallar la conexión se muestra un aviso. Si existe una copia válida, la interfaz identifica su fecha y oculta el pronóstico guardado. Una consulta nueva sin copia muestra un error recuperable y GPS queda deshabilitado mientras el navegador está offline. Los ejemplos se mantienen exclusivamente en el modo demo explícito o predeterminado por configuración y no se generan como respuesta a un fallo de la API.

El worker deriva su revisión de los artefactos del build y elimina los cachés estáticos obsoletos de su scope al activarse. Una versión nueva espera y muestra la acción **Actualizar**. Al activarla se recarga la aplicación. Los datos compatibles permanecen en una caché separada.

## Componentes, archivos y dependencias

- **Nuevos:** `public/manifest.webmanifest`, `public/pwa/*.png`, `src/pwa/{sw.js,conexion.ts,datosGuardados.ts}`, `src/components/{ControlesPwa,EstadoDatos}.tsx`, `tests/pwa.test.mjs`.
- **Actualizados:** `index.html`, `vite.config.ts`, `src/{App.tsx,main.tsx,index.css}`, las cinco páginas, `src/components/{Layout,AlertasClima,ClimaCard,CultivosRecomendados,ErrorConsulta}.tsx`, `src/hooks/{useRecomendaciones,useCultivoDetalle}.ts`, `src/services/api.ts` y `FRONTEND_README.md`.
- **Dependencias:** ninguna nueva. Se evaluó `vite-plugin-pwa`, compatible con Vite 7 según sus dependencias declaradas. El hook de Vite y las APIs nativas cubren el precache y el ciclo de vida, mientras que el cliente decide qué datos validados se pueden guardar. [Dependencias declaradas de vite-plugin-pwa](https://github.com/vite-pwa/vite-plugin-pwa/blob/main/package.json)

## Pruebas y pendientes

- `npm run build` pasó, incluido TypeScript. Pasaron las cinco pruebas existentes con `npm test` y las pruebas de caché con `node --test tests/pwa.test.mjs`. No hay script de lint.
- En producción sobre localhost, Brave verificó las cinco pantallas sin desbordamiento global a 320, 375, 430, 768, 1024, 1280, 1440 y 1920 px, con navegación inferior o superior según la anchura.
- FastAPI real con SQLite temporal sembrado devolvió HTTP 200 para recomendaciones y ficha. También se consultaron recomendaciones por coordenadas. Se comprobaron manifest sin errores de instalabilidad, registro y control del worker, rutas offline, fecha de copia, exclusión de GPS, recarga automática de datos al reconectar y actualización con retirada de la caché estática anterior. Brave headless no expuso el comando de instalación nativa de CDP, por lo que la apertura desde el icono queda para validación en un navegador con interfaz.
- Contraste calculado de las combinaciones principales: texto sobre fondo 12.85:1, texto secundario sobre fondo 6.82:1 y texto claro sobre verde bosque 7.60:1. Queda pendiente auditoría completa con lector de pantalla, Safari iOS físico y Lighthouse, que no estaba instalado.
- El contrato permite búsqueda, GPS y alternativas dinámicas. Una selección jerárquica completa Estado → Municipio requeriría una fuente de catálogo acordada con backend. El buscador acepta localidad y puede incluir el estado separado por coma. El contrato no incluye fotografías de cultivos.

## Ejecutar e instalar

```bash
cd frontend
npm ci
npm run dev
npm test
node --test tests/pwa.test.mjs
npm run build
npm run preview
```

Antes del build, define `VITE_USE_MOCKS=false` y `VITE_API_BASE_URL` para usar FastAPI. Si frontend y API comparten origen, deja vacía la URL y enruta `/api` al backend. Configura fallback a `index.html` para rutas de la SPA y sirve `sw.js` con revalidación. En un subdirectorio configura el `base` de Vite. El manifest y el registro usan ese scope.

- **Chromium compatible:** abre la URL del build y usa **Instalar QUESIEMBRO** cuando esté disponible, o la opción **Instalar aplicación** en el menú del navegador.
- **iOS:** en Safari, abre **Compartir → Agregar a inicio**. Abre QUESIEMBRO desde el nuevo icono.
- Completa una primera visita con red para preparar los archivos estáticos. Abre una ficha o consulta una localidad por nombre para poder volver a leer esa información offline.
