import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { TituloPagina } from './components/Interfaz'
import { CalendarioAnualPage } from './pages/CalendarioAnualPage'
import { CultivoDetallePage } from './pages/CultivoDetallePage'
import { HomePage } from './pages/HomePage'
import { Recomendaciones } from './pages/Recomendaciones'
import { ZonaRecomendacionesPage } from './pages/ZonaRecomendacionesPage'

export default function App() {
  return (
    <BrowserRouter>
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
