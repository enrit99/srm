import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useSuppliers, useCreateSupplier } from '../hooks/useSuppliers'
import { Modal } from '../components/Modal'
import { SupplierForm } from '../components/SupplierForm'

const TIPO_BADGES = {
  FORNITORE: 'bg-blue-900/50 text-blue-300 border-blue-800',
  COSTRUTTORE: 'bg-purple-900/50 text-purple-300 border-purple-800',
  ENTRAMBI: 'bg-emerald-900/50 text-emerald-300 border-emerald-800',
}

export function Suppliers() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [tipo, setTipo] = useState('')
  const [modalOpen, setModalOpen] = useState(false)

  const { data, isLoading, error } = useSuppliers({ page, size: 20, search, tipo })
  const createMutation = useCreateSupplier()

  const handleCreate = async (formData) => {
    await createMutation.mutateAsync(formData)
    setModalOpen(false)
  }

  const totalPages = data ? Math.ceil(data.total / data.size) : 1

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <header className="border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">SRM — Fornitori</h1>
          <button
            onClick={logout}
            className="text-sm text-slate-400 hover:text-white transition"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Toolbar: search + filtro + bottone aggiungi */}
        <div className="flex flex-wrap gap-3 mb-6">
          <input
            type="text"
            placeholder="Cerca per nome..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="flex-1 min-w-[200px] bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
          />
          <select
            value={tipo}
            onChange={(e) => {
              setTipo(e.target.value)
              setPage(1)
            }}
            className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="">Tutti i tipi</option>
            <option value="FORNITORE">Fornitore</option>
            <option value="COSTRUTTORE">Costruttore</option>
            <option value="ENTRAMBI">Entrambi</option>
          </select>
          <button
            onClick={() => setModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium"
          >
            + Aggiungi fornitore
          </button>
        </div>

        {/* Stato della query */}
        {isLoading && <p className="text-slate-400 py-8 text-center">Caricamento...</p>}
        {error && (
          <p className="text-red-400 py-8 text-center">Errore: {error.message}</p>
        )}

        {/* Lista vuota */}
        {data && data.items.length === 0 && (
          <div className="text-center py-16 border border-dashed border-slate-700 rounded-lg">
            <p className="text-slate-400 mb-2">Nessun fornitore trovato.</p>
            <p className="text-slate-600 text-sm">
              {search || tipo ? 'Prova a modificare i filtri.' : 'Inizia aggiungendone uno.'}
            </p>
          </div>
        )}

        {/* Tabella */}
        {data && data.items.length > 0 && (
          <>
            <div className="bg-slate-800 rounded-lg overflow-hidden border border-slate-700">
              <table className="w-full text-sm">
                <thead className="bg-slate-900/50 text-slate-400 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium">Nome</th>
                    <th className="text-left px-4 py-3 font-medium">Tipo</th>
                    <th className="text-left px-4 py-3 font-medium">Città</th>
                    <th className="text-left px-4 py-3 font-medium">Email</th>
                    <th className="text-left px-4 py-3 font-medium">Telefono</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((s) => (
                    <tr
                      key={s.id}
                      onClick={() => navigate(`/suppliers/${s.id}`)}
                      className="border-t border-slate-700 hover:bg-slate-700/40 cursor-pointer transition"
                    >
                      <td className="px-4 py-3 font-medium">{s.nome}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs border ${TIPO_BADGES[s.tipo]}`}
                        >
                          {s.tipo}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-300">{s.citta || '—'}</td>
                      <td className="px-4 py-3 text-slate-300">{s.email || '—'}</td>
                      <td className="px-4 py-3 text-slate-300">{s.telefono || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginazione */}
            <div className="flex justify-between items-center mt-4 text-sm text-slate-400">
              <span>
                {data.total} fornitor{data.total === 1 ? 'e' : 'i'} totali
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 bg-slate-800 border border-slate-700 rounded disabled:opacity-30"
                >
                  ← Precedente
                </button>
                <span className="px-3 py-1">
                  Pagina {page} di {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="px-3 py-1 bg-slate-800 border border-slate-700 rounded disabled:opacity-30"
                >
                  Successiva →
                </button>
              </div>
            </div>
          </>
        )}
      </main>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nuovo fornitore">
        <SupplierForm
          onSubmit={handleCreate}
          onCancel={() => setModalOpen(false)}
          loading={createMutation.isPending}
        />
      </Modal>
    </div>
  )
}
