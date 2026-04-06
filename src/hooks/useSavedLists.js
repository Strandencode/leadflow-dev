import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'leadflow_saved_lists'
const TRACKING_KEY = 'leadflow_contact_tracking'

/**
 * Hook for managing saved lead lists + contact tracking.
 * Each lead can be tracked: emailed (with date), called (with date).
 */
export function useSavedLists() {
  const [lists, setLists] = useState([])
  const [tracking, setTracking] = useState({}) // { [orgNumber]: { emailed: bool, emailedAt: iso, called: bool, calledAt: iso } }

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) setLists(JSON.parse(stored))
    } catch {}
    try {
      const tracked = localStorage.getItem(TRACKING_KEY)
      if (tracked) setTracking(JSON.parse(tracked))
    } catch {}
  }, [])

  function persistLists(updated) {
    setLists(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  function persistTracking(updated) {
    setTracking(updated)
    localStorage.setItem(TRACKING_KEY, JSON.stringify(updated))
  }

  function saveList({ name, filters, filterLabels, companies, totalResults }) {
    const newList = {
      id: crypto.randomUUID(),
      name, filters, filterLabels, companies, totalResults,
      leadCount: companies.length,
      createdAt: new Date().toISOString(),
    }
    persistLists([newList, ...lists])
    return newList
  }

  function deleteList(id) {
    persistLists(lists.filter(l => l.id !== id))
  }

  function getList(id) {
    return lists.find(l => l.id === id)
  }

  // === Contact tracking ===
  function markEmailed(orgNumber, value = true) {
    const now = new Date().toISOString()
    const prev = tracking[orgNumber] || {}
    persistTracking({ ...tracking, [orgNumber]: { ...prev, emailed: value, emailedAt: value ? now : prev.emailedAt } })
  }

  function markCalled(orgNumber, value) {
    const now = new Date().toISOString()
    const prev = tracking[orgNumber] || {}
    persistTracking({ ...tracking, [orgNumber]: { ...prev, called: value, calledAt: value ? now : prev.calledAt } })
  }

  function getTracking(orgNumber) {
    return tracking[orgNumber] || { emailed: false, emailedAt: null, called: false, calledAt: null }
  }

  // === Dashboard stats ===
  const getStats = useCallback(() => {
    const allCompanies = lists.flatMap(l => l.companies || [])
    const uniqueOrgs = new Set(allCompanies.map(c => c.orgNumber))
    const totalLeads = uniqueOrgs.size

    let emailsSent = 0, callsMade = 0
    const recentActivity = []

    for (const [orgNum, t] of Object.entries(tracking)) {
      if (t.emailed) {
        emailsSent++
        recentActivity.push({ type: 'email', orgNumber: orgNum, date: t.emailedAt })
      }
      if (t.called) {
        callsMade++
        recentActivity.push({ type: 'call', orgNumber: orgNum, date: t.calledAt })
      }
    }

    // Find company name by org number
    const orgMap = {}
    allCompanies.forEach(c => { orgMap[c.orgNumber] = c })

    // Sort recent activity by date descending
    recentActivity.sort((a, b) => (b.date || '').localeCompare(a.date || ''))

    const withEmail = allCompanies.filter(c => c.email).length
    const withPhone = allCompanies.filter(c => c.phone).length

    // Contacted rate
    const contacted = Object.values(tracking).filter(t => t.emailed || t.called).length
    const contactRate = totalLeads > 0 ? Math.round((contacted / totalLeads) * 100) : 0

    return {
      totalLeads,
      totalLists: lists.length,
      emailsSent,
      callsMade,
      contacted,
      contactRate,
      withEmail,
      withPhone,
      recentActivity: recentActivity.slice(0, 15).map(a => ({
        ...a,
        companyName: orgMap[a.orgNumber]?.name || a.orgNumber,
        contactName: orgMap[a.orgNumber]?.contactName || '',
      })),
      listsSummary: lists.map(l => ({
        id: l.id,
        name: l.name,
        leadCount: l.leadCount,
        createdAt: l.createdAt,
        emailedCount: (l.companies || []).filter(c => tracking[c.orgNumber]?.emailed).length,
        calledCount: (l.companies || []).filter(c => tracking[c.orgNumber]?.called).length,
      })),
    }
  }, [lists, tracking])

  return { lists, saveList, deleteList, getList, markEmailed, markCalled, getTracking, getStats }
}
