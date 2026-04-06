import { useState, useEffect } from 'react'

const STORAGE_KEY = 'leadflow_customers'

/**
 * Hook for managing closed-won customers with contracts.
 * Contracts are stored as base64 data URIs in localStorage.
 * For production, swap to Supabase Storage.
 */
export function useCustomers() {
  const [customers, setCustomers] = useState([])

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) setCustomers(JSON.parse(stored))
    } catch {}
  }, [])

  function persist(updated) {
    setCustomers(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  function addCustomer({ orgNumber, name, contactName, contactRole, email, phone, industry, municipality, revenue, notes }) {
    const existing = customers.find(c => c.orgNumber === orgNumber)
    if (existing) return existing

    const customer = {
      id: crypto.randomUUID(),
      orgNumber,
      name,
      contactName: contactName || '',
      contactRole: contactRole || '',
      email: email || '',
      phone: phone || '',
      industry: industry || '',
      municipality: municipality || '',
      revenue: revenue || null,
      notes: notes || '',
      status: 'won',
      wonDate: new Date().toISOString(),
      contracts: [],
    }
    persist([customer, ...customers])
    return customer
  }

  function removeCustomer(id) {
    persist(customers.filter(c => c.id !== id))
  }

  function updateCustomerNotes(id, notes) {
    persist(customers.map(c => c.id === id ? { ...c, notes } : c))
  }

  function addNoteEntry(id, text) {
    if (!text.trim()) return
    persist(customers.map(c => {
      if (c.id !== id) return c
      const entry = { id: crypto.randomUUID(), text: text.trim(), createdAt: new Date().toISOString() }
      return { ...c, notesLog: [...(c.notesLog || []), entry] }
    }))
  }

  function removeNoteEntry(customerId, noteId) {
    persist(customers.map(c => {
      if (c.id !== customerId) return c
      return { ...c, notesLog: (c.notesLog || []).filter(n => n.id !== noteId) }
    }))
  }

  function addContract(customerId, { fileName, fileSize, fileType, fileData }) {
    persist(customers.map(c => {
      if (c.id !== customerId) return c
      return {
        ...c,
        contracts: [...c.contracts, {
          id: crypto.randomUUID(),
          fileName,
          fileSize,
          fileType,
          fileData, // base64 data URI
          uploadedAt: new Date().toISOString(),
        }],
      }
    }))
  }

  function removeContract(customerId, contractId) {
    persist(customers.map(c => {
      if (c.id !== customerId) return c
      return { ...c, contracts: c.contracts.filter(ct => ct.id !== contractId) }
    }))
  }

  function isCustomer(orgNumber) {
    return customers.some(c => c.orgNumber === orgNumber)
  }

  return { customers, addCustomer, removeCustomer, updateCustomerNotes, addNoteEntry, removeNoteEntry, addContract, removeContract, isCustomer }
}
