import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './hooks/useAuth'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Login } from './pages/Login'
import { Suppliers } from './pages/Suppliers'
import { SupplierDetail } from './pages/SupplierDetail'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/suppliers" element={
              <ProtectedRoute><Suppliers /></ProtectedRoute>
            } />
            <Route path="/suppliers/:id" element={
              <ProtectedRoute><SupplierDetail /></ProtectedRoute>
            } />
            <Route path="/" element={<Navigate to="/suppliers" replace />} />
            <Route path="*" element={<Navigate to="/suppliers" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
