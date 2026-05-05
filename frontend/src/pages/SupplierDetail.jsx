import { useParams, useNavigate } from 'react-router-dom'
import { useSupplier } from '../hooks/useSuppliers'

export function SupplierDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: supplier, isLoading, error } = useSupplier(id)

  if (isLoading) return <div className="min-h-screen bg-slate-900 text-slate-400 p-8">Caricamento...</div>
  if (error) return <div className="min-h-screen bg-slate-900 text-red-400 p-8">Errore: {error.message}</div>
  if (!supplier) return null

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <header className="border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <button
            onClick={() => navigate('/suppliers')}
            className="text-slate-400 hover:text-white text-sm"
          >
            ← Torna alla lista
          </button>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold mb-2">{supplier.nome}</h1>
        <p className="text-slate-400 mb-8">{supplier.tipo} · {supplier.citta || 'Città non specificata'}</p>
        <p className="text-slate-500">Tab comunicazioni, contatti, contratti in arrivo nel prossimo step.</p>
      </main>
    </div>
  )
}
