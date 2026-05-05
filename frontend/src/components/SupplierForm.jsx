import { useState } from 'react'

const TIPI = ['FORNITORE', 'COSTRUTTORE', 'ENTRAMBI']

const EMPTY = {
  nome: '',
  tipo: 'FORNITORE',
  email: '',
  telefono: '',
  sito_web: '',
  indirizzo: '',
  citta: '',
  cap: '',
  paese: 'Italia',
  piva: '',
  codice_fiscale: '',
  note: '',
}

export function SupplierForm({ initial = null, onSubmit, onCancel, loading = false }) {
  const [form, setForm] = useState(initial || EMPTY)
  const [error, setError] = useState('')

  const handleChange = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      // Pulisci i campi vuoti (li mandiamo come undefined, non come "")
      const payload = Object.fromEntries(
        Object.entries(form).filter(([_, v]) => v !== '')
      )
      await onSubmit(payload)
    } catch (err) {
      setError(err.message)
    }
  }

  const inputCls =
    'w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500'
  const labelCls = 'block text-slate-300 text-xs font-medium mb-1'

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-900/40 border border-red-800 text-red-200 px-4 py-2 rounded text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className={labelCls}>Nome *</label>
          <input
            type="text"
            value={form.nome}
            onChange={handleChange('nome')}
            className={inputCls}
            required
            autoFocus
          />
        </div>

        <div>
          <label className={labelCls}>Tipo *</label>
          <select value={form.tipo} onChange={handleChange('tipo')} className={inputCls} required>
            {TIPI.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelCls}>P. IVA</label>
          <input type="text" value={form.piva} onChange={handleChange('piva')} className={inputCls} />
        </div>

        <div>
          <label className={labelCls}>Email</label>
          <input type="email" value={form.email} onChange={handleChange('email')} className={inputCls} />
        </div>

        <div>
          <label className={labelCls}>Telefono</label>
          <input type="text" value={form.telefono} onChange={handleChange('telefono')} className={inputCls} />
        </div>

        <div className="col-span-2">
          <label className={labelCls}>Sito web</label>
          <input type="url" value={form.sito_web} onChange={handleChange('sito_web')} className={inputCls} />
        </div>

        <div className="col-span-2">
          <label className={labelCls}>Indirizzo</label>
          <input type="text" value={form.indirizzo} onChange={handleChange('indirizzo')} className={inputCls} />
        </div>

        <div>
          <label className={labelCls}>Città</label>
          <input type="text" value={form.citta} onChange={handleChange('citta')} className={inputCls} />
        </div>

        <div>
          <label className={labelCls}>CAP</label>
          <input type="text" value={form.cap} onChange={handleChange('cap')} className={inputCls} />
        </div>

        <div className="col-span-2">
          <label className={labelCls}>Note</label>
          <textarea
            value={form.note}
            onChange={handleChange('note')}
            rows={3}
            className={inputCls}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t border-slate-700">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-slate-300 hover:text-white"
        >
          Annulla
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 text-white rounded font-medium"
        >
          {loading ? 'Salvataggio...' : 'Salva'}
        </button>
      </div>
    </form>
  )
}
