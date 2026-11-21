import { onlineManager, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

// TanStack Query debe partir del estado real cuando la PWA se abre sin red.
onlineManager.setOnline(navigator.onLine)

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30 * 60 * 1000 },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)
