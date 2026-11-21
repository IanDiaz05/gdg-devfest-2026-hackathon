# Integración de Lovable en QUESIEMBRO

## Resumen

QUESIEMBRO incorpora la identidad visual de Lovable en inicio, zona, recomendaciones, ficha y calendario. La rama de trabajo es `integracion-lovable`. La integración se hizo en `frontend/`, con el checkout de Lovable como referencia de solo lectura.

## Arquitectura inicial y final

| Área | Inicial | Final |
| --- | --- | --- |
| Aplicación | SPA Vite, React, TypeScript estricto y React Router DOM | Las pantallas existentes usan el layout y los elementos visuales adaptados de Lovable. |
| Datos | Hooks con TanStack Query y cliente Fetch con validación del contrato v2 | Los componentes nuevos reciben datos o callbacks de las pantallas existentes. El cliente, sus tipos y sus validadores son los mismos. |
| Diseño | Utilidades Tailwind 4 con colores hexadecimales por pantalla | Tema Tailwind 4 con tokens de Lovable, tipografía Figtree con fallback de sistema y utilidades compartidas para superficies y encabezados. |
| Navegación | Cuatro rutas principales, dos rutas compatibles y página 404 | Se conservan todos los enlaces. La apariencia de la navegación y el layout se actualizó. |

## Archivos

Rutas relativas a `frontend/`.

- **Creados:** `src/components/BarraUbicacion.tsx`, `Chip.tsx`, `ClimaCard.tsx`, `MesSelect.tsx`, `PlantasIlustracion.tsx` e `INTEGRACION_LOVABLE.md`.
- **Modificados, componentes:** `src/components/AlertasClima.tsx`, `CultivosRecomendados.tsx`, `FiltrosCultivos.tsx`, `GraficaTemperatura.tsx`, `Interfaz.tsx`, `Layout.tsx` y `SelectorLocalidad.tsx`.
- **Modificados, páginas y estilos:** `src/pages/HomePage.tsx`, `ZonaRecomendacionesPage.tsx`, `Recomendaciones.tsx`, `CultivoDetallePage.tsx`, `CalendarioAnualPage.tsx`, `src/index.css` e `index.html`.

La ilustración botánica SVG procede del componente que efectivamente renderiza el inicio de Lovable. `BarraUbicacion`, `MesSelect` y `ClimaCard` adaptan los componentes homónimos a los tipos y a la navegación de QUESIEMBRO. De Lovable también se tomaron las referencias visuales para el encabezado, pie, chips, tarjetas de cultivo, skeletons, ficha y calendario.

## Dependencias, rutas y comportamiento

- Sin cambios en `package.json`, en el lockfile ni en la configuración Vite. Se usa la pila instalada del proyecto principal. Figtree se solicita desde Google Fonts y tiene fallback cuando no carga.
- Se mantuvieron `/`, `/zona`, `/cultivo/:id`, `/calendario` y las rutas compatibles `/recomendaciones` y `/cultivos/:id`.
- Se conservaron búsqueda manual, GPS con alternativa manual, homónimos por coordenadas, mes opcional y espacio en la URL, filtros locales, alertas, clima histórico, sequía, detalle de cultivos, calendario, SNIIM, compartir sin coordenadas y el manejo de 404 y 503.
- Se mantiene el filtro exacto de espacio del principal. Lovable usa capacidad acumulativa y su prueba de esa regla no aplica aquí. Los chips no generan consultas al backend. El buscador sigue consultando al enviar el formulario.
- Se mantuvo la ilustración anterior en el árbol de recursos. El servidor SSR, la configuración y los datos simulados de Lovable quedaron en su repositorio de origen. El modo demo de QUESIEMBRO sigue identificado en pantalla.

## Protección del trabajo local

El frontend completo ya estaba sin seguimiento y `Brief proyecto.md` ya estaba preparado en el índice antes de esta tarea. Antes de editar se verificó un respaldo en `/tmp/quesiembro-antes-lovable-MI4suIhw.tar.gz`, excluyendo dependencias, artefactos, metadatos y carpetas sensibles. El archivo de respaldo es temporal. El trabajo local permanece sin commit y se conservó el índice preexistente.

## Ejecución

1. Desde `frontend/`, instalar con `npm ci`.
2. Copiar `.env.example` a `.env.local` y ejecutar `npm run dev`. El ejemplo habilita el modo demo.
3. Para FastAPI, usar `VITE_USE_MOCKS=false` y configurar `VITE_API_BASE_URL` con el origen del backend. Revisar CORS si el backend usa otro origen.
4. Ejecutar `npm run build` para comprobar los tipos y generar `dist/`. En hosting estático, configurar las rutas de la SPA para servir `index.html`.

## Pruebas y resultados

- `npm run build` pasó, incluido el chequeo TypeScript. El principal carece de un script de lint y de una suite de pruebas configurada.
- En Brave sin interfaz se abrieron las cuatro rutas principales en modo demo a 320, 390, 768 y 1280 px durante las pruebas. Se comprobó la ausencia de desborde horizontal en las cuatro rutas a 320, 768 y 1280 px.
- Se probaron el cambio de mes, homónimos, GPS concedido y denegado mediante emulación, enlaces a fichas, búsqueda del calendario y el fallback de compartir con portapapeles simulado. El enlace copiado excluyó coordenadas.
- Con `VITE_USE_MOCKS=false` y un servidor HTTP local que simula el contrato oficial, se verificaron las rutas principales y compatibles, CORS, filtros sin peticiones adicionales, prioridad de coordenadas, 404 y recuperación al reintentar un 503.
- Pendientes manuales: probar una instancia real de FastAPI y su catálogo, comprobar los diálogos nativos de geolocalización y compartir en un teléfono, y revisar la apariencia y navegación con lector de pantalla en dispositivos reales. `localhost:8000` rechazó la conexión durante la auditoría.

## Problemas y soluciones

- Los componentes de Lovable usaban enlaces de TanStack Router y tipos propios. Se adaptaron a React Router DOM y a los tipos v2 del principal. El `QueryClient` existente sigue siendo la fuente de consultas.
- El filtro acumulativo y la búsqueda al escribir de Lovable cambiaban la semántica y la frecuencia de las consultas. Se mantuvieron las reglas del principal y se trasladó su presentación.
- El test inicial de homónimos seleccionó el desplegable del mes tras el cambio de marcado. Se identificó el selector de localidades explícitamente en el escenario de prueba y la comprobación de coordenadas pasó.
