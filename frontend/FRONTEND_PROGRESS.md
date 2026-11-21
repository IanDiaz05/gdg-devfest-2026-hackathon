# QUESIEMBRO · Avance del frontend

## Auditoría

Se revisaron el README completo, `docs/json-contracts.md`, las dependencias, los scripts, las rutas y los componentes. La SPA existente ya compilaba y aportaba el diseño, la ilustración botánica, el flujo de geolocalización y la infraestructura de consultas. Sus tipos y pantallas consumían un formato anterior al v2.

El checkout contiene el frontend y los documentos de integración. Al probar ambos endpoints en `localhost:8000`, la conexión fue rechazada. No se encontró otra URL de FastAPI en el repositorio.

## Arquitectura

- React, Vite y TypeScript estricto. Tailwind CSS 4 se carga con la directiva de importación en `src/index.css`. React Router DOM gestiona la navegación y Lucide React la iconografía.
- `src/types/api.ts` describe los nombres de campos, uniones de valores y objetos anulables del v2. `src/services/validacion.ts` comprueba las respuestas HTTP sin traducir campos a otro modelo.
- `src/services/api.ts` centraliza Fetch, cancelación, configuración del origen y errores HTTP. `useRecomendaciones` y `useCultivoDetalle` aíslan las consultas y reutilizan su caché con TanStack Query. `useGeolocation` solicita coordenadas y ofrece búsqueda manual al fallar.
- URL compartida entre pantallas para ciudad o coordenadas, mes y espacio. Categoría y espacio se filtran en cliente. El calendario obtiene sus doce meses de una sola respuesta. La ficha compartida usa una URL sin parámetros de ubicación.
- Los ejemplos de Toluca en diciembre y jitomate reproducen las respuestas de la documentación. Los escenarios de Mérida, Monterrey, homónimos y meses adicionales ilustran el mismo esquema con valores simulados. El catálogo de demo tiene tres cultivos con ficha, y el catálogo completo se consume desde FastAPI.

## Rutas

| Ruta | Comportamiento |
| --- | --- |
| `/` | Búsqueda, ubicación del navegador, atajos de ciudad y selector de espacio. |
| `/zona` | Localidades alternativas, mes, clima histórico, alertas, sequía activa, destacados y recomendaciones filtrables. |
| `/cultivo/:id` | Ficha técnica y educativa, contexto de zona si está disponible, gráfica de temperatura, precios SNIIM y enlace compartible. |
| `/calendario` | Doce meses por cultivo, con búsqueda y filtro de espacio. La ventana ideal tiene prioridad sobre el conjunto de meses posibles. |
| `/recomendaciones`, `/cultivos/:id` | Rutas compatibles con enlaces existentes. |

## Contrato e integración

1. Instalar con `npm ci` y copiar `.env.example` a `.env.local`. Con `VITE_USE_MOCKS=true`, ejecutar `npm run dev` para trabajar con los ejemplos.
2. Para conectar FastAPI, configurar `VITE_USE_MOCKS=false` y `VITE_API_BASE_URL=http://localhost:8000` o el origen del ambiente de integración, sin el sufijo `/api`. Si se omite la URL con mocks desactivados, el navegador usa rutas relativas del mismo origen.
3. Permitir el origen de Vite en CORS cuando la API use otro origen. En producción, usar HTTPS para la geolocalización y configurar el hosting para resolver las rutas de la SPA a `index.html`.
4. Confirmar `GET /api/recomendaciones?q=Toluca&mes=12` y repetir con `lat` y `lon`. Las coordenadas válidas tienen prioridad sobre `q`. Si no hay un mes seleccionado, el frontend omite `mes` para que la API use su valor por defecto.
5. Confirmar `GET /api/cultivos/jitomate` y probar `ciudad_no_encontrada`, `cultivo_no_encontrado` y `clima_no_disponible`. La interfaz muestra una salida de búsqueda para el 404 y permite reintentar el 503, mostrando `reintentar_en_s` cuando está presente. El cliente admite el cuerpo oficial y el envoltorio `detail` de FastAPI.
6. Ejecutar `npm run build` con la configuración del ambiente. Los valores `VITE_*` se incluyen durante la compilación.

## Verificación

- `npm run build` completó el chequeo de tipos y generó el bundle de producción.
- Se probaron las cuatro rutas principales y las dos rutas de compatibilidad en Brave sin interfaz, con viewport móvil de 390 px. En modo mock se verificaron las ciudades, las alternativas, el mes, el calendario y la ficha. En modo conectado, un servidor HTTP local sirvió los ejemplos v2 y permitió verificar CORS, prioridad de coordenadas, filtros sin peticiones adicionales, 404 y recuperación del 503.
- La integración con una instancia de FastAPI y el catálogo real requiere una URL activa del equipo backend.

## Aplicación del plan de mejoras con FastAPI v3.1

- La configuración local apunta a FastAPI en `http://127.0.0.1:8000`. Toluca, Mérida y las coordenadas de prueba respondieron con 200 y 28 cultivos. Una búsqueda inexistente devolvió 404. Las respuestas revisadas no incluyeron homónimos.
- El cliente valida ventanas anuales y semáforo, respeta la espera del 503 y presenta D0 si la API entrega ese dato. El contrato v3.1 sigue proporcionando lluvia reciente y alertas con fecha.
- GPS conserva tres decimales en la URL. Los atajos fijos aparecen en modo demo. Los diagnósticos de ejemplo se limitan a diciembre y el filtro de espacio sigue disponible con almacenamiento restringido.
- La navegación móvil mantiene las opciones en una fila, conserva la cabecera al entrar, y mantiene acceso al enlace de salto con Tab. Los destacados se pueden recorrer con teclado y la ficha muestra primero la explicación térmica.
- `npm test` ejecuta las regresiones de contrato y servicio con Node y Vite. `npm run build` valida TypeScript y compila la SPA.
- El selector de alternativas usa los datos existentes del diagnóstico. Un catálogo Estado → Municipio, la serie térmica mensual y las horas de sol siguen sujetos a los campos y endpoints que acuerde el equipo.
