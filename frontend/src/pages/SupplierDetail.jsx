import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSupplier, useUpdateSupplier, useDeleteSupplier } from '../hooks/useSuppliers'
import {
  useCommunications, useCreateCommunication, useUpdateCommunication, useDeleteCommunication
} from '../hooks/useCommunications'
import { useCreateContact, useUpdateContact, useDeleteContact } from '../hooks/useContacts'
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

const COMM_ICONS = { EMAIL: '✉️', TELEFONO: '📞', VISITA: '🤝', ALTRO: '•' }

export function SupplierDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [tab, setTab] = useState('anagrafica')
  const [editSupplierOpen, setEditSupplierOpen] = useState(false)

  // Stato modali contatto: null = chiuso, {} = nuovo, oggetto = modifica
  const [contactEdit, setContactEdit] = useState(null)
  const [commEdit, setCommEdit] = useState(null)

  const { data: supplier, isLoading } = useSupplier(id)
  const { data: comms } = useCommunications(id)
  const updateSupplier = useUpdateSupplier()
  const deleteSupplier = useDeleteSupplier()
  const createContact = useCreateContact()
  const updateContact = useUpdateContact()
  const deleteContact = useDeleteContact()
  const createComm = useCreateCommunication()
  const updateComm = useUpdateCommunication()
  const deleteComm = useDeleteCommunication()

  if (isLoading) return <div className="min-h-screen bg-slate-900 text-slate-400 p-8">Caricamento...</div>
  if (!supplier) return null

  const handleUpdateSupplier = async (data) => {
    await updateSupplier.mutateAsync({ id: supplier.id, data })
    setEditSupplierOpen(false)
  }

  const handleDeleteSupplier = async () => {
    if (!confirm(`Archiviare "${supplier.nome}"?`)) return
    await deleteSupplier.mutateAsync(supplier.id)
    navigate('/suppliers')
  }

  const handleSaveContact = async (data) => {
    if (contactEdit?.id) {
      await updateContact.mutateAsync({ id: contactEdit.id, data })
    } else {
      await createContact.mutateAsync(data)
    }
    setContactEdit(null)
  }

  const handleSaveComm = async (data) => {
    if (commEdit?.id) {
      await updateComm.mutateAsync({ id: commEdit.id, data })
    } else {
      await createComm.mutateAsync(data)
    }
    setCommEdit(null)
  }

  const tabs = [
    { key: 'anagrafica', label: 'Anagrafica' },
    { key: 'contatti', label: 'Contatti', count: supplier.contacts?.length || 0 },
    { key: 'comunicazioni', label: 'Comunicazioni', count: comms?.length || 0 },
  ]

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <header className="border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <button onClick={() => navigate('/suppliers')} className="text-slate-400 hover:text-white text-sm">
            ← Torna alla lista
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
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
            <button onClick={() => setEditSupplierOpen(true)} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-sm">
              Modifica
            </button>
            <button onClick={handleDeleteSupplier} className="px-3 py-1.5 bg-red-900/40 hover:bg-red-900/60 border border-red-800 text-red-200 rounded text-sm">
              Archivia
            </button>
          </div>
        </div>

        <Tabs tabs={tabs} activeKey={tab} onChange={setTab} />

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

        {tab === 'contatti' && (
          <div>
            <div className="flex justify-end mb-4">
              <button onClick={() => setContactEdit({})} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-sm">
                + Aggiungi contatto
              </button>
            </div>
            {supplier.contacts && supplier.contacts.length > 0 ? (
              <div className="space-y-2">
                {supplier.contacts.map((c) => (
                  <div key={c.id} className="bg-slate-800 border border-slate-700 rounded-lg p-4 flex justify-between items-start">
                    <div className="flex-1">
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
                    <div className="flex gap-3 ml-4">
                      <button
                        onClick={() => setContactEdit(c)}
                        className="text-slate-400 hover:text-blue-400 text-sm"
                      >
                        Modifica
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Eliminare il contatto ${c.nome}?`)) deleteContact.mutate(c.id)
                        }}
                        className="text-slate-400 hover:text-red-400 text-sm"
                      >
                        Elimina
                      </button>
                    </div>
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

        {tab === 'comunicazioni' && (
          <div>
            <div className="flex justify-end mb-4">
              <button onClick={() => setCommEdit({})} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-sm">
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
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-slate-500">{formatDateTime(c.data)}</span>
                        <button
                          onClick={() => setCommEdit(c)}
                          className="text-slate-400 hover:text-blue-400"
                        >
                          Modifica
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Eliminare questa comunicazione?')) deleteComm.mutate(c.id)
                          }}
                          className="text-slate-400 hover:text-red-400"
                        >
                          Elimina
                        </button>
                      </div>
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

      <Modal open={editSupplierOpen} onClose={() => setEditSupplierOpen(false)} title="Modifica fornitore">
        <SupplierForm
          initial={supplier}
          onSubmit={handleUpdateSupplier}
          onCancel={() => setEditSupplierOpen(false)}
          loading={updateSupplier.isPending}
        />
      </Modal>

      <Modal
        open={!!contactEdit}
        onClose={() => setContactEdit(null)}
        title={contactEdit?.id ? 'Modifica contatto' : 'Nuovo contatto'}
      >
        <ContactForm
          supplierId={supplier.id}
          initial={contactEdit?.id ? contactEdit : null}
          onSubmit={handleSaveContact}
          onCancel={() => setContactEdit(null)}
          loading={createContact.isPending || updateContact.isPending}
        />
      </Modal>

      <Modal
        open={!!commEdit}
        onClose={() => setCommEdit(null)}
        title={commEdit?.id ? 'Modifica comunicazione' : 'Registra comunicazione'}
      >
        <CommunicationForm
          supplierId={supplier.id}
          initial={commEdit?.id ? commEdit : null}
          onSubmit={handleSaveComm}
          onCancel={() => setCommEdit(null)}
          loading={createComm.isPending || updateComm.isPending}
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
