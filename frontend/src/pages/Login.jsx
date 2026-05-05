import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(username, password)
      navigate('/suppliers')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="bg-slate-800 p-8 rounded-lg shadow-xl w-full max-w-md">
        <h1 className="text-2xl font-bold text-white mb-1">SRM</h1>
        <p className="text-slate-400 text-sm mb-6">Accedi al sistema</p>

        {error && (
          <div className="bg-red-900/40 border border-red-800 text-red-200 px-4 py-2 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        <label className="block mb-3">
          <span className="text-slate-300 text-sm">Username</span>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="mt-1 w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
            required
            autoFocus
          />
        </label>

        <label className="block mb-6">
          <span className="text-slate-300 text-sm">Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
            required
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 text-white py-2 rounded font-medium transition"
        >
          {loading ? 'Accesso in corso...' : 'Accedi'}
        </button>
      </form>
    </div>
  )
}
