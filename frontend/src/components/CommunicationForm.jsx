import { useState } from 'react'

const TIPI = [
  { value: 'EMAIL', label: 'Email' },
  { value: 'TELEFONO', label: 'Telefono' },
  { value: 'VISITA', label: 'Visita' },
  { value: 'ALTRO', label: 'Altro' },
]

export function CommunicationForm({ supplierId, onSubmit, onCancel, loading }) {
  const [form, setForm] = useState({
    tipo: 'EMAIL',
    data: new Date().toISOString().slice(0, 16), // formato datetime-local
    oggetto: '',
    corpo_note: '',
  })
  const [error, setError] = useState('')

  const change = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await onSubmit({
        supplier_id: supplierId,
        tipo: form.tipo,
        // datetime-local non ha timezone → converto in ISO per il backend
        data: new Date(form.data).toISOString(),
        oggetto: form.oggetto || undefined,
        corpo_note: form.corpo_note || undefined,
      })
    } catch (err) {
      setError(err.message)
    }
  }

  const cls = 'w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500'
  const lbl = 'block text-slate-300 text-xs font-medium mb-1'

  return (
    <form onSubmit={submit} className="space-y-3">
      {error && <div className="bg-red-900/40 border border-red-800 text-red-200 px-3 py-2 rounded text-sm">{error}</div>}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={lbl}>Tipo *</label>
          <select value={form.tipo} onChange={change('tipo')} className={cls} required>
            {TIPI.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div>
          <label className={lbl}>Data *</label>
          <input type="datetime-local" value={form.data} onChange={change('data')} className={cls} required />
        </div>
        <div className="col-span-2">
          <label className={lbl}>Oggetto</label>
          <input type="text" value={form.oggetto} onChange={change('oggetto')} className={cls} placeholder="es. Richiesta offerta inox AISI 304" autoFocus />
        </div>
        <div className="col-span-2">
          <label className={lbl}>Note</label>
          <textarea value={form.corpo_note} onChange={change('corpo_note')} rows={4} className={cls} placeholder="Dettagli, esito, prossimi passi..." />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-slate-300 hover:text-white text-sm">Annulla</button>
        <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 text-white rounded text-sm font-medium">
          {loading ? 'Salvataggio...' : 'Registra'}
        </button>
      </div>
    </form>
  )
}
