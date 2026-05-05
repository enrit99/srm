import { useAuth } from '../hooks/useAuth'

export function Suppliers() {
  const { logout } = useAuth()
  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <header className="flex justify-between items-center mb-8 border-b border-slate-700 pb-4">
        <h1 className="text-2xl font-bold">Fornitori</h1>
        <button
          onClick={logout}
          className="text-sm text-slate-400 hover:text-white transition"
        >
          Logout
        </button>
      </header>
      <p className="text-slate-400">Lista fornitori in arrivo nel prossimo step.</p>
    </div>
  )
}
