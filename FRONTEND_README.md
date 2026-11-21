# Frontend de QUESIEMBRO

QUESIEMBRO ayuda a elegir qué sembrar en un huerto urbano según la localidad y el mes. El frontend muestra clima histórico, recomendaciones y fichas de cultivo. Las reglas de siembra del modo API corresponden al backend.

## Tecnologías y estructura

La SPA usa React, TypeScript, Vite, Tailwind CSS, React Router, TanStack Query, Fetch y Lucide React.

| Carpeta | Responsabilidad |
| --- | --- |
| `frontend/src/pages/` | Inicio, Tu zona, Recomendaciones, Ficha y Calendario |
| `frontend/src/components/` | Navegación, clima, alertas, ubicación, filtros, tarjetas, estados y rangos térmicos |
| `frontend/src/hooks/` | Consultas y geolocalización |
| `frontend/src/services/` | Cliente HTTP y validación del contrato |
| `frontend/src/types/`, `frontend/src/utils/` | Modelos y utilidades de URL, meses y formato |
| `frontend/src/mocks/` | Respuestas locales de ejemplo |
| `frontend/src/pwa/`, `frontend/public/` | Worker, caché offline, manifest e iconos |
| `frontend/src/api/`, `frontend/src/features/catalogo/` | Código del monitor anterior de precios |

Las rutas principales son `/`, `/zona`, `/recomendaciones`, `/cultivo/:id` y `/calendario`. `/cultivos/:id` es un alias. Configura el alojamiento de la SPA para servir `index.html` en rutas directas. La ubicación y el mes se conservan al navegar. Las fichas pueden abrirse sin una ubicación. La geolocalización requiere un origen seguro, como HTTPS o localhost.

## Ejecutar desde el repositorio

La auditoría usó Node 20.19.2 y las dependencias existentes.

```bash
cd frontend
npm ci
npm run dev
npm run typecheck
npm test
node --test tests/pwa.test.mjs
npm run build
npm run preview
```

`npm run preview` sirve el build local y permite comprobar la PWA en localhost. El registro del worker se habilita en producción. El proyecto tiene pruebas de API y caché y no configura un script de lint.

## Entorno y contratos

En desarrollo y en la vista previa, Vite reenvía `/api` a `http://127.0.0.1:8000`. Para cambiar el comportamiento, usa `frontend/.env.local` y reinicia Vite. Las variables `VITE_` son públicas en el cliente.

| Variable | Comportamiento |
| --- | --- |
| `VITE_USE_MOCKS` | `true` activa la demo. Por defecto se consulta la API real. |
| `VITE_API_BASE_URL` | Origen o raíz de FastAPI, sin sufijo `/api`. Por defecto el frontend consulta `/api` en su propio origen. En producción, configura el alojamiento para reenviar esa ruta o especifica aquí el origen de la API antes de compilar. |

El modo demo incluye Toluca, Mérida y Monterrey y fichas de jitomate, lechuga y albahaca. El modo demo se limita a los diagnósticos de diciembre y el banner lo identifica.

El contrato oficial v3.1 está en [docs/json-contracts.md](docs/json-contracts.md). El frontend consulta `GET /api/recomendaciones` por ciudad o par GPS, con mes opcional. La respuesta alimenta clima, alertas, recomendación y calendario. `GET /api/cultivos/{id}` se consulta al abrir una ficha. Si la API usa otro origen, debe permitir el origen de la SPA mediante CORS.

Si el backend responde 404 en `GET /api/ciudades`, el autocompletado usa el catálogo GeoNames del repositorio (CC BY 4.0).

## PWA

El build incluye manifest, iconos instalables y un service worker con precarga de la aplicación. Con conexión, la API sigue siendo la primera fuente. Sin conexión se pueden leer las fichas y búsquedas por localidad previamente guardadas, identificadas con su fecha. Las consultas por coordenadas no se guardan en caché persistente.

En Chromium usa **Instalar QUESIEMBRO** si el navegador lo ofrece. En Safari de iOS, usa **Compartir → Agregar a inicio**. Cuando haya una nueva revisión, la aplicación ofrece **Actualizar**.

## Estado y siguientes pasos

Se verificaron las pantallas en Brave y se probaron recomendaciones y fichas contra FastAPI local con una base temporal. El buscador admite texto, GPS y localidades alternativas del backend. La API no ofrece un catálogo jerárquico Estado → Municipio.

El [registro de mejoras](docs/FRONTEND_IMPROVEMENTS.md) contiene los resultados de pruebas, la configuración de despliegue y las comprobaciones manuales pendientes. El [informe de auditoría](docs/FRONTEND_AUDIT.md) y el [plan de acción](docs/FRONTEND_ACTION_PLAN.md) conservan el contexto histórico.
