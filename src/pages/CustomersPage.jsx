import { useState, useRef } from 'react'
import { useCustomers } from '../hooks/useCustomers'
import { useNavigate } from 'react-router-dom'
import { Trophy, Upload, FileText, Trash2, ChevronDown, ChevronRight, Plus, X, StickyNote, Download } from 'lucide-react'
import { formatNOK } from '../api/brreg'
import toast from 'react-hot-toast'

export default function CustomersPage() {
  const { customers, removeCustomer, updateCustomerNotes, addContract, removeContract } = useCustomers()
  const navigate = useNavigate()
  const [expandedId, setExpandedId] = useState(null)
  const [editingNotes, setEditingNotes] = useState(null)
  const [notesText, setNotesText] = useState('')
  const fileInputRef = useRef(null)
  const [uploadTarget, setUploadTarget] = useState(null)

  function handleFileUpload(e) {
    const file = e.target.files?.[0]
    if (!file || !uploadTarget) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Filen er for stor (maks 5 MB)')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      addContract(uploadTarget, {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        fileData: reader.result,
      })
      toast.success(`"${file.name}" lastet opp!`)
      setUploadTarget(null)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  function formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  function formatDate(iso) {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString('nb-NO', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  function startEditNotes(customer) {
    setEditingNotes(customer.id)
    setNotesText(customer.notes || '')
  }

  function saveNotes(customerId) {
    updateCustomerNotes(customerId, notesText)
    setEditingNotes(null)
    toast.success('Notater lagret')
  }

  function downloadContract(contract) {
    const a = document.createElement('a')
    a.href = contract.fileData
    a.download = contract.fileName
    a.click()
  }

  return (
    <div>
      {/* Hidden file input */}
      <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" onChange={handleFileUpload} />

      <div className="px-8 py-6 bg-surface-raised border-b border-bdr flex items-center justify-between sticky top-0 z-40">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Kunder (Closed Won)</h1>
          <p className="text-txt-secondary text-[0.9rem] mt-0.5">
            {customers.length > 0
              ? `${customers.length} kunder vunnet — last opp kontrakter og hold oversikt`
              : 'Her samler du kundene du har lukket'
            }
          </p>
        </div>
      </div>

      <div className="p-8">
        {customers.length === 0 ? (
          <div className="text-center py-20">
            <Trophy size={48} className="mx-auto text-txt-tertiary/40 mb-4" />
            <h3 className="font-display text-lg font-semibold text-txt-secondary mb-2">Ingen kunder enda</h3>
            <p className="text-txt-tertiary text-[0.9rem] mb-6 max-w-md mx-auto">
              Når du finner en lead i søket og lukker en deal, klikk "Marker som kunde" for å flytte dem hit. Da kan du laste opp kontrakten og holde oversikt.
            </p>
            <button onClick={() => navigate('/search')} className="px-5 py-2.5 bg-coral text-white rounded-lg font-medium hover:bg-coral-hover transition-all">
              Finn leads →
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {customers.map((customer, i) => (
              <div key={customer.id} className="animate-in bg-surface-raised border border-bdr rounded-xl overflow-hidden" style={{ animationDelay: `${i * 0.05}s` }}>
                {/* Customer header */}
                <div
                  className="p-6 cursor-pointer flex items-center gap-4"
                  onClick={() => setExpandedId(expandedId === customer.id ? null : customer.id)}
                >
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <Trophy size={20} className="text-white" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-0.5">
                      <h3 className="font-display text-[1.05rem] font-semibold">{customer.name}</h3>
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[0.72rem] font-semibold bg-green-50 text-green-600">
                        Closed Won
                      </span>
                      {customer.contracts.length > 0 && (
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[0.72rem] font-medium bg-violet-soft text-violet">
                          {customer.contracts.length} kontrakt{customer.contracts.length > 1 ? 'er' : ''}
                        </span>
                      )}
                    </div>
                    <p className="text-[0.82rem] text-txt-secondary">
                      {customer.contactName}{customer.contactRole ? ` · ${customer.contactRole}` : ''}{customer.industry ? ` · ${customer.industry}` : ''}
                    </p>
                  </div>

                  <span className="text-[0.78rem] text-txt-tertiary whitespace-nowrap">Vunnet {formatDate(customer.wonDate)}</span>

                  <div className="flex items-center gap-1">
                    {expandedId === customer.id ? <ChevronDown size={16} className="text-txt-tertiary" /> : <ChevronRight size={16} className="text-txt-tertiary" />}
                  </div>
                </div>

                {/* Expanded detail */}
                {expandedId === customer.id && (
                  <div className="border-t border-bdr px-6 py-6">
                    <div className="grid grid-cols-3 gap-6">
                      {/* Info */}
                      <div>
                        <h4 className="text-[0.72rem] uppercase tracking-wider text-txt-tertiary font-semibold mb-3">Kundeinformasjon</h4>
                        <div className="space-y-2 text-[0.85rem]">
                          <div className="flex justify-between"><span className="text-txt-tertiary">Org.nr</span><span className="font-medium">{customer.orgNumber}</span></div>
                          <div className="flex justify-between"><span className="text-txt-tertiary">Kontakt</span><span className="font-medium">{customer.contactName || '—'}</span></div>
                          <div className="flex justify-between"><span className="text-txt-tertiary">E-post</span>{customer.email ? <a href={`mailto:${customer.email}`} className="text-violet hover:underline">{customer.email}</a> : <span>—</span>}</div>
                          <div className="flex justify-between"><span className="text-txt-tertiary">Telefon</span><span>{customer.phone || '—'}</span></div>
                          <div className="flex justify-between"><span className="text-txt-tertiary">Kommune</span><span>{customer.municipality || '—'}</span></div>
                          <div className="flex justify-between"><span className="text-txt-tertiary">Omsetning</span><span className="font-medium">{formatNOK(customer.revenue)}</span></div>
                        </div>
                      </div>

                      {/* Contracts */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-[0.72rem] uppercase tracking-wider text-txt-tertiary font-semibold">Kontrakter</h4>
                          <button
                            onClick={(e) => { e.stopPropagation(); setUploadTarget(customer.id); fileInputRef.current?.click() }}
                            className="flex items-center gap-1 px-2.5 py-1 bg-coral text-white rounded-md text-[0.72rem] font-semibold hover:bg-coral-hover transition-all"
                          >
                            <Upload size={12} /> Last opp
                          </button>
                        </div>

                        {customer.contracts.length === 0 ? (
                          <div
                            className="border-2 border-dashed border-bdr rounded-xl p-8 text-center cursor-pointer hover:border-violet/40 hover:bg-violet-soft/30 transition-all"
                            onClick={(e) => { e.stopPropagation(); setUploadTarget(customer.id); fileInputRef.current?.click() }}
                          >
                            <FileText size={24} className="mx-auto text-txt-tertiary/40 mb-2" />
                            <p className="text-[0.82rem] text-txt-tertiary">Klikk for å laste opp kontrakt</p>
                            <p className="text-[0.72rem] text-txt-tertiary mt-1">PDF, Word, eller bilde (maks 5 MB)</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {customer.contracts.map(ct => (
                              <div key={ct.id} className="flex items-center gap-3 p-3 bg-surface rounded-lg border border-surface-sunken group">
                                <FileText size={18} className="text-violet flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <div className="text-[0.82rem] font-medium truncate">{ct.fileName}</div>
                                  <div className="text-[0.72rem] text-txt-tertiary">{formatBytes(ct.fileSize)} · {formatDate(ct.uploadedAt)}</div>
                                </div>
                                <button onClick={(e) => { e.stopPropagation(); downloadContract(ct) }} className="p-1.5 rounded hover:bg-surface-sunken text-txt-tertiary hover:text-violet transition-all" title="Last ned">
                                  <Download size={14} />
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); removeContract(customer.id, ct.id); toast.success('Kontrakt slettet') }} className="p-1.5 rounded hover:bg-red-50 text-txt-tertiary hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all" title="Slett">
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            ))}
                            <button
                              onClick={(e) => { e.stopPropagation(); setUploadTarget(customer.id); fileInputRef.current?.click() }}
                              className="w-full flex items-center justify-center gap-1.5 py-2 border border-dashed border-bdr rounded-lg text-[0.78rem] text-txt-tertiary hover:border-violet hover:text-violet transition-all"
                            >
                              <Plus size={12} /> Last opp flere
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Notes */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-[0.72rem] uppercase tracking-wider text-txt-tertiary font-semibold">Notater</h4>
                          {editingNotes !== customer.id && (
                            <button onClick={(e) => { e.stopPropagation(); startEditNotes(customer) }} className="text-[0.72rem] text-violet hover:underline">Rediger</button>
                          )}
                        </div>

                        {editingNotes === customer.id ? (
                          <div onClick={e => e.stopPropagation()}>
                            <textarea
                              value={notesText}
                              onChange={e => setNotesText(e.target.value)}
                              placeholder="Skriv notater om kunden, avtalen, oppfølgingspunkter..."
                              className="w-full min-h-[120px] p-3 bg-surface border border-bdr rounded-lg text-[0.85rem] outline-none resize-y focus:border-violet focus:ring-2 focus:ring-violet-soft transition-all"
                              autoFocus
                            />
                            <div className="flex gap-2 mt-2 justify-end">
                              <button onClick={() => setEditingNotes(null)} className="px-3 py-1.5 text-[0.78rem] text-txt-secondary hover:text-txt-primary transition-colors">Avbryt</button>
                              <button onClick={() => saveNotes(customer.id)} className="px-3 py-1.5 bg-coral text-white rounded-md text-[0.78rem] font-medium hover:bg-coral-hover transition-all">Lagre</button>
                            </div>
                          </div>
                        ) : (
                          <div
                            className="min-h-[80px] p-3 bg-surface rounded-lg border border-surface-sunken cursor-pointer hover:border-violet/30 transition-all"
                            onClick={(e) => { e.stopPropagation(); startEditNotes(customer) }}
                          >
                            {customer.notes ? (
                              <p className="text-[0.85rem] text-txt-secondary whitespace-pre-line">{customer.notes}</p>
                            ) : (
                              <p className="text-[0.82rem] text-txt-tertiary italic flex items-center gap-1"><StickyNote size={14} /> Klikk for å legge til notater...</p>
                            )}
                          </div>
                        )}

                        <button
                          onClick={(e) => { e.stopPropagation(); if (confirm(`Fjerne ${customer.name} fra kunder?`)) { removeCustomer(customer.id); toast.success('Kunde fjernet') } }}
                          className="mt-4 flex items-center gap-1.5 text-[0.78rem] text-red-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={12} /> Fjern fra kunder
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
