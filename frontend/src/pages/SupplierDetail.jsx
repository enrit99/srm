import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSupplier, useUpdateSupplier, useDeleteSupplier } from '../hooks/useSuppliers'
import { useCommunications, useCreateCommunication } from '../hooks/useCommunications'
import { useCreateContact, useDeleteContact } from '../hooks/useContacts'
import { Tabs } from '../components/Tabs'
import { Modal } from '../components/Modal'
import { SupplierForm } from '../components/SupplierForm'
import { ContactForm } from '../components/ContactForm'
import { CommunicationForm } from '../components/CommunicationForm'
import { formatDateTime } from '../utils/format'

const TIPO_BADGES = {
  FORNITORE: 'bg-blue-900/50 text-blue-300 border-blue-800',
  COSTRUTTORE: 'bg-purple-900/50 text-purple-300 border-purple-800',
  ENTRAMBI: 'bg-emerald-900/50 text-emerald-300 border-emerald-800',
}

const COMM_ICONS = {
  EMAIL: '✉️', TELEFONO: '📞', VISITA: '🤝', ALTRO: '•',
}

export function SupplierDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [tab, setTab] = useState('anagrafica')
  const [editOpen, setEditOpen] = useState(false)
  const [contactOpen, setContactOpen] = useState(false)
  const [commOpen, setCommOpen] = useState(false)

  const { data: supplier, isLoading } = useSupplier(id)
  const { data: comms } = useCommunications(id)
  const updateSupplier = useUpdateSupplier()
  const deleteSupplier = useDeleteSupplier()
  const createContact = useCreateContact()
  const deleteContact = useDeleteContact()
  const createComm = useCreateCommunication()

  if (isLoading) return <div className="min-h-screen bg-slate-900 text-slate-400 p-8">Caricamento...</div>
  if (!supplier) return null

  const handleUpdate = async (data) => {
    await updateSupplier.mutateAsync({ id: supplier.id, data })
    setEditOpen(false)
  }

  const handleDelete = async () => {
    if (!confirm(`Eliminare "${supplier.nome}"? Il fornitore verrà archiviato (soft delete).`)) return
    await deleteSupplier.mutateAsync(supplier.id)
    navigate('/suppliers')
  }

  const handleAddContact = async (data) => {
    await createContact.mutateAsync(data)
    setContactOpen(false)
  }

  const handleAddComm = async (data) => {
    await createComm.mutateAsync(data)
    setCommOpen(false)
  }

  const tabs = [
    { key: 'anagrafica', label: 'Anagrafica' },
    { key: 'contatti', label: 'Contatti', count: supplier.contacts?.length || 0 },
    { key: 'comunicazioni', label: 'Comunicazioni', count: comms?.length || 0 },
  ]

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <header className="border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <button onClick={() => navigate('/suppliers')} className="text-slate-400 hover:text-white text-sm">
            ← Torna alla lista
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Header fornitore */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">{supplier.nome}</h1>
              <span className={`inline-block px-2 py-0.5 rounded text-xs border ${TIPO_BADGES[supplier.tipo]}`}>
                {supplier.tipo}
              </span>
            </div>
            <p className="text-slate-400 text-sm">
              {supplier.citta || 'Città non specificata'}
              {supplier.piva && ` · P.IVA ${supplier.piva}`}
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setEditOpen(true)} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-sm">
              Modifica
            </button>
            <button onClick={handleDelete} className="px-3 py-1.5 bg-red-900/40 hover:bg-red-900/60 border border-red-800 text-red-200 rounded text-sm">
              Archivia
            </button>
          </div>
        </div>

        <Tabs tabs={tabs} activeKey={tab} onChange={setTab} />

        {/* Tab: Anagrafica */}
        {tab === 'anagrafica' && (
          <div className="grid grid-cols-2 gap-6 bg-slate-800 rounded-lg border border-slate-700 p-6">
            <Field label="Email" value={supplier.email} />
            <Field label="Telefono" value={supplier.telefono} />
            <Field label="Sito web" value={supplier.sito_web} />
            <Field label="Codice Fiscale" value={supplier.codice_fiscale} />
            <Field label="Indirizzo" value={supplier.indirizzo} />
            <Field label="CAP" value={supplier.cap} />
            <Field label="Città" value={supplier.citta} />
            <Field label="Paese" value={supplier.paese} />
            {supplier.note && (
              <div className="col-span-2">
                <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Note</p>
                <p className="text-slate-200 whitespace-pre-wrap">{supplier.note}</p>
              </div>
            )}
          </div>
        )}

        {/* Tab: Contatti */}
        {tab === 'contatti' && (
          <div>
            <div className="flex justify-end mb-4">
              <button onClick={() => setContactOpen(true)} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-sm">
                + Aggiungi contatto
              </button>
            </div>
            {supplier.contacts && supplier.contacts.length > 0 ? (
              <div className="space-y-2">
                {supplier.contacts.map((c) => (
                  <div key={c.id} className="bg-slate-800 border border-slate-700 rounded-lg p-4 flex justify-between items-start">
                    <div>
                      <p className="font-medium">
                        {c.nome} {c.cognome}
                        {c.ruolo && <span className="text-slate-400 font-normal"> · {c.ruolo}</span>}
                      </p>
                      <p className="text-sm text-slate-400 mt-1">
                        {c.email && <span>{c.email}</span>}
                        {c.email && c.telefono && <span> · </span>}
                        {c.telefono && <span>{c.telefono}</span>}
                      </p>
                      {c.note && <p className="text-sm text-slate-500 mt-2">{c.note}</p>}
                    </div>
                    <button
                      onClick={() => {
                        if (confirm(`Eliminare il contatto ${c.nome}?`)) deleteContact.mutate(c.id)
                      }}
                      className="text-slate-500 hover:text-red-400 text-sm"
                    >
                      Elimina
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-12 text-slate-500 border border-dashed border-slate-700 rounded-lg">
                Nessun contatto.
              </p>
            )}
          </div>
        )}

        {/* Tab: Comunicazioni */}
        {tab === 'comunicazioni' && (
          <div>
            <div className="flex justify-end mb-4">
              <button onClick={() => setCommOpen(true)} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-sm">
                + Registra comunicazione
              </button>
            </div>
            {comms && comms.length > 0 ? (
              <div className="space-y-3">
                {comms.map((c) => (
                  <div key={c.id} className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                    <div className="flex items-baseline justify-between mb-1">
                      <p className="font-medium">
                        <span className="mr-2">{COMM_ICONS[c.tipo]}</span>
                        {c.oggetto || <span className="text-slate-500 italic">Senza oggetto</span>}
                      </p>
                      <span className="text-xs text-slate-500">{formatDateTime(c.data)}</span>
                    </div>
                    {c.corpo_note && (
                      <p className="text-sm text-slate-300 whitespace-pre-wrap mt-2">{c.corpo_note}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-12 text-slate-500 border border-dashed border-slate-700 rounded-lg">
                Nessuna comunicazione registrata.
              </p>
            )}
          </div>
        )}
      </main>

      {/* Modali */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Modifica fornitore">
        <SupplierForm
          initial={supplier}
          onSubmit={handleUpdate}
          onCancel={() => setEditOpen(false)}
          loading={updateSupplier.isPending}
        />
      </Modal>

      <Modal open={contactOpen} onClose={() => setContactOpen(false)} title="Nuovo contatto">
        <ContactForm
          supplierId={supplier.id}
          onSubmit={handleAddContact}
          onCancel={() => setContactOpen(false)}
          loading={createContact.isPending}
        />
      </Modal>

      <Modal open={commOpen} onClose={() => setCommOpen(false)} title="Registra comunicazione">
        <CommunicationForm
          supplierId={supplier.id}
          onSubmit={handleAddComm}
          onCancel={() => setCommOpen(false)}
          loading={createComm.isPending}
        />
      </Modal>
    </div>
  )
}

function Field({ label, value }) {
  return (
    <div>
      <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">{label}</p>
      <p className="text-slate-200">{value || '—'}</p>
    </div>
  )
}
