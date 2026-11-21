import { lazy } from 'react'
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { TituloPagina } from './components/Interfaz'
import { HomePage } from './pages/HomePage'

const CalendarioAnualPage = lazy(() => import('./pages/CalendarioAnualPage').then((modulo) => ({ default: modulo.CalendarioAnualPage })))
const CultivoDetallePage = lazy(() => import('./pages/CultivoDetallePage').then((modulo) => ({ default: modulo.CultivoDetallePage })))
const Recomendaciones = lazy(() => import('./pages/Recomendaciones').then((modulo) => ({ default: modulo.Recomendaciones })))
const ZonaRecomendacionesPage = lazy(() => import('./pages/ZonaRecomendacionesPage').then((modulo) => ({ default: modulo.ZonaRecomendacionesPage })))

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="zona" element={<ZonaRecomendacionesPage />} />
          <Route path="recomendaciones" element={<Recomendaciones />} />
          <Route path="cultivo/:id" element={<CultivoDetallePage />} />
          <Route path="cultivos/:id" element={<CultivoDetallePage />} />
          <Route path="calendario" element={<CalendarioAnualPage />} />
          <Route path="*" element={<TituloPagina etiqueta="QUESIEMBRO" titulo="Página no encontrada">
            <Link className="mt-4 inline-flex min-h-11 items-center font-bold text-[#264E36] underline underline-offset-4" to="/">Volver al inicio</Link>
          </TituloPagina>} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
