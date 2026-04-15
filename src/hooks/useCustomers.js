import { useState, useEffect, useCallback } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { useAuth } from './useAuth'

/**
 * Supabase-backed customers hook (closed-won).
 *
 * Scoped to the user's current workspace. Contracts are still embedded as
 * a jsonb array on the customer row with base64 fileData — fine for MVP
 * (small PDFs). Migrating to Supabase Storage is a separate task.
 *
 * API matches the old localStorage hook. Mutations are async but existing
 * call sites that ignore the promise still work.
 */
export function useCustomers() {
  const { profile } = useAuth()
  const workspaceId = profile?.default_workspace_id || null

  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)

  const mapRow = (row) => ({
    id: row.id,
    orgNumber: row.org_number || '',
    name: row.name,
    contactName: row.contact_name || '',
    contactRole: row.contact_role || '',
    email: row.email || '',
    phone: row.phone || '',
    industry: row.industry || '',
    municipality: row.municipality || '',
    revenue: row.revenue,
    notes: row.notes || '',
    status: row.status || 'won',
    wonDate: row.won_date,
    contracts: row.contracts || [],
    notesLog: row.notes_log || [],
  })

  const refresh = useCallback(async () => {
    if (!isSupabaseConfigured() || !workspaceId) {
      setCustomers([]); setLoading(false); return
    }
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('won_date', { ascending: false })
      if (error) throw error
      setCustomers((data || []).map(mapRow))
    } catch (e) {
      console.error('[useCustomers] refresh failed', e)
    } finally {
      setLoading(false)
    }
  }, [workspaceId])

  useEffect(() => { refresh() }, [refresh])

  async function addCustomer({ orgNumber, name, contactName, contactRole, email, phone, industry, municipality, revenue, notes }) {
    if (!workspaceId) return null
    const existing = customers.find(c => c.orgNumber === orgNumber)
    if (existing) return existing

    const { data, error } = await supabase.from('customers').insert({
      workspace_id: workspaceId,
      org_number: orgNumber,
      name,
      contact_name: contactName || '',
      contact_role: contactRole || '',
      email: email || '',
      phone: phone || '',
      industry: industry || '',
      municipality: municipality || '',
      revenue: revenue ?? null,
      notes: notes || '',
      status: 'won',
      won_date: new Date().toISOString(),
      contracts: [],
      notes_log: [],
    }).select().single()
    if (error) { console.error(error); return null }
    const mapped = mapRow(data)
    setCustomers(prev => [mapped, ...prev])
    return mapped
  }

  async function removeCustomer(id) {
    if (!workspaceId) return
    setCustomers(prev => prev.filter(c => c.id !== id))
    const { error } = await supabase.from('customers').delete().eq('id', id)
    if (error) { console.error(error); await refresh() }
  }

  async function updateCustomerNotes(id, notes) {
    setCustomers(prev => prev.map(c => c.id === id ? { ...c, notes } : c))
    const { error } = await supabase.from('customers').update({ notes }).eq('id', id)
    if (error) { console.error(error); await refresh() }
  }

  async function addNoteEntry(id, text) {
    if (!text.trim()) return
    const cust = customers.find(c => c.id === id)
    if (!cust) return
    const entry = { id: crypto.randomUUID(), text: text.trim(), createdAt: new Date().toISOString() }
    const newLog = [...(cust.notesLog || []), entry]
    setCustomers(prev => prev.map(c => c.id === id ? { ...c, notesLog: newLog } : c))
    const { error } = await supabase.from('customers').update({ notes_log: newLog }).eq('id', id)
    if (error) { console.error(error); await refresh() }
  }

  async function removeNoteEntry(customerId, noteId) {
    const cust = customers.find(c => c.id === customerId)
    if (!cust) return
    const newLog = (cust.notesLog || []).filter(n => n.id !== noteId)
    setCustomers(prev => prev.map(c => c.id === customerId ? { ...c, notesLog: newLog } : c))
    const { error } = await supabase.from('customers').update({ notes_log: newLog }).eq('id', customerId)
    if (error) { console.error(error); await refresh() }
  }

  async function addContract(customerId, { fileName, fileSize, fileType, fileData }) {
    const cust = customers.find(c => c.id === customerId)
    if (!cust) return
    const contract = {
      id: crypto.randomUUID(),
      fileName,
      fileSize,
      fileType,
      fileData, // base64 data URI — small PDFs only for MVP
      uploadedAt: new Date().toISOString(),
    }
    const newContracts = [...(cust.contracts || []), contract]
    setCustomers(prev => prev.map(c => c.id === customerId ? { ...c, contracts: newContracts } : c))
    const { error } = await supabase.from('customers').update({ contracts: newContracts }).eq('id', customerId)
    if (error) { console.error(error); await refresh() }
  }

  async function removeContract(customerId, contractId) {
    const cust = customers.find(c => c.id === customerId)
    if (!cust) return
    const newContracts = (cust.contracts || []).filter(ct => ct.id !== contractId)
    setCustomers(prev => prev.map(c => c.id === customerId ? { ...c, contracts: newContracts } : c))
    const { error } = await supabase.from('customers').update({ contracts: newContracts }).eq('id', customerId)
    if (error) { console.error(error); await refresh() }
  }

  function isCustomer(orgNumber) {
    return customers.some(c => c.orgNumber === orgNumber)
  }

  return {
    customers,
    loading,
    refresh,
    addCustomer,
    removeCustomer,
    updateCustomerNotes,
    addNoteEntry,
    removeNoteEntry,
    addContract,
    removeContract,
    isCustomer,
  }
}
