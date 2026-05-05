import { useState } from 'react'

const EMPTY = { nome: '', cognome: '', ruolo: '', email: '', telefono: '', note: '' }

export function ContactForm({ supplierId, initial = null, onSubmit, onCancel, loading }) {
  // Estrai solo i campi editabili dall'initial (escludi id, timestamp, etc.)
  const initialValues = initial
    ? { nome: initial.nome || '', cognome: initial.cognome || '', ruolo: initial.ruolo || '',
        email: initial.email || '', telefono: initial.telefono || '', note: initial.note || '' }
    : EMPTY

  const [form, setForm] = useState(initialValues)
  const [error, setError] = useState('')

  const change = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const cleaned = Object.fromEntries(Object.entries(form).filter(([_, v]) => v !== ''))
      // In creazione serve supplier_id; in modifica no (l'endpoint usa l'id in URL)
      const payload = initial ? cleaned : { supplier_id: supplierId, ...cleaned }
      await onSubmit(payload)
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
        <div><label className={lbl}>Nome *</label><input type="text" value={form.nome} onChange={change('nome')} className={cls} required autoFocus /></div>
        <div><label className={lbl}>Cognome</label><input type="text" value={form.cognome} onChange={change('cognome')} className={cls} /></div>
        <div className="col-span-2"><label className={lbl}>Ruolo</label><input type="text" value={form.ruolo} onChange={change('ruolo')} className={cls} placeholder="es. Responsabile commerciale" /></div>
        <div><label className={lbl}>Email</label><input type="email" value={form.email} onChange={change('email')} className={cls} /></div>
        <div><label className={lbl}>Telefono</label><input type="text" value={form.telefono} onChange={change('telefono')} className={cls} /></div>
        <div className="col-span-2"><label className={lbl}>Note</label><textarea value={form.note} onChange={change('note')} rows={2} className={cls} /></div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-slate-300 hover:text-white text-sm">Annulla</button>
        <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 text-white rounded text-sm font-medium">
          {loading ? 'Salvataggio...' : 'Salva'}
        </button>
      </div>
    </form>
  )
}
