import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { useAuth } from './useAuth'

/**
 * Supabase-backed saved lists + contact tracking.
 *
 * Scoped to the user's current workspace (profile.default_workspace_id).
 * All workspace members see the same lists/tracking. Writes go directly to
 * Supabase; state is refetched after mutations.
 *
 * API is kept mostly compatible with the old localStorage version so
 * existing call sites don't need major rewrites. Mutating methods are now
 * async but callers that ignore the return value still work.
 */
export function useSavedLists() {
  const { profile } = useAuth()
  const workspaceId = profile?.default_workspace_id || null

  const [lists, setLists] = useState([]) // DB rows mapped to legacy shape
  const [tracking, setTracking] = useState({}) // { [orgNumber]: { emailed, emailedAt, called, calledAt } }
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!isSupabaseConfigured() || !workspaceId) {
      setLists([]); setTracking({}); setLoading(false); return
    }
    setLoading(true)
    try {
      const [listsRes, trackRes] = await Promise.all([
        supabase.from('saved_lists').select('*').eq('workspace_id', workspaceId).order('created_at', { ascending: false }),
        supabase.from('contact_tracking').select('*').eq('workspace_id', workspaceId),
      ])
      setLists((listsRes.data || []).map(row => ({
        id: row.id,
        name: row.name,
        filters: row.filters || {},
        filterLabels: row.filter_labels || '',
        companies: row.companies || [],
        totalResults: row.total_results || 0,
        leadCount: (row.companies || []).length,
        createdAt: row.created_at,
      })))
      const trk = {}
      for (const r of trackRes.data || []) {
        trk[r.org_number] = {
          emailed: r.emailed,
          emailedAt: r.emailed_at,
          called: r.called,
          calledAt: r.called_at,
        }
      }
      setTracking(trk)
    } catch (e) {
      console.error('[useSavedLists] refresh failed', e)
    } finally {
      setLoading(false)
    }
  }, [workspaceId])

  useEffect(() => { refresh() }, [refresh])

  async function saveList({ name, filters, filterLabels, companies, totalResults }) {
    if (!workspaceId) return null
    const { data, error } = await supabase.from('saved_lists').insert({
      workspace_id: workspaceId,
      name,
      filters: filters || {},
      filter_labels: filterLabels || '',
      companies: companies || [],
      total_results: totalResults ?? (companies || []).length,
    }).select().single()
    if (error) { console.error(error); return null }
    await refresh()
    return {
      id: data.id, name: data.name, filters: data.filters, filterLabels: data.filter_labels,
      companies: data.companies, totalResults: data.total_results, leadCount: (data.companies || []).length,
      createdAt: data.created_at,
    }
  }

  async function deleteList(id) {
    await supabase.from('saved_lists').delete().eq('id', id)
    await refresh()
  }

  function getList(id) { return lists.find(l => l.id === id) }

  // --- Contact tracking ----
  async function upsertTracking(orgNumber, patch) {
    if (!workspaceId) return
    const existing = tracking[orgNumber] || {}
    const merged = {
      workspace_id: workspaceId,
      org_number: orgNumber,
      emailed: patch.emailed ?? existing.emailed ?? false,
      emailed_at: patch.emailedAt ?? existing.emailedAt ?? null,
      called: patch.called ?? existing.called ?? false,
      called_at: patch.calledAt ?? existing.calledAt ?? null,
    }
    await supabase.from('contact_tracking').upsert(merged, { onConflict: 'workspace_id,org_number' })
    // Optimistic local update
    setTracking(prev => ({ ...prev, [orgNumber]: {
      emailed: merged.emailed, emailedAt: merged.emailed_at,
      called: merged.called, calledAt: merged.called_at,
    }}))
  }

  function markEmailed(orgNumber, value = true) {
    const now = new Date().toISOString()
    upsertTracking(orgNumber, { emailed: value, emailedAt: value ? now : null })
  }

  function markCalled(orgNumber, value) {
    const now = new Date().toISOString()
    upsertTracking(orgNumber, { called: value, calledAt: value ? now : null })
  }

  function getTracking(orgNumber) {
    return tracking[orgNumber] || { emailed: false, emailedAt: null, called: false, calledAt: null }
  }

  // --- Dashboard stats (same as before) ----
  const getStats = useCallback(() => {
    const allCompanies = lists.flatMap(l => l.companies || [])
    const uniqueOrgs = new Set(allCompanies.map(c => c.orgNumber))
    const totalLeads = uniqueOrgs.size

    let emailsSent = 0, callsMade = 0
    const recentActivity = []
    for (const [orgNum, t] of Object.entries(tracking)) {
      if (t.emailed) { emailsSent++; recentActivity.push({ type: 'email', orgNumber: orgNum, date: t.emailedAt }) }
      if (t.called) { callsMade++; recentActivity.push({ type: 'call', orgNumber: orgNum, date: t.calledAt }) }
    }

    const orgMap = {}
    allCompanies.forEach(c => { orgMap[c.orgNumber] = c })
    recentActivity.sort((a, b) => (b.date || '').localeCompare(a.date || ''))

    const withEmail = allCompanies.filter(c => c.email).length
    const withPhone = allCompanies.filter(c => c.phone).length
    const contacted = Object.values(tracking).filter(t => t.emailed || t.called).length
    const contactRate = totalLeads > 0 ? Math.round((contacted / totalLeads) * 100) : 0

    return {
      totalLeads, totalLists: lists.length, emailsSent, callsMade, contacted, contactRate, withEmail, withPhone,
      recentActivity: recentActivity.slice(0, 15).map(a => ({
        ...a,
        companyName: orgMap[a.orgNumber]?.name || a.orgNumber,
        contactName: orgMap[a.orgNumber]?.contactName || '',
      })),
      listsSummary: lists.map(l => ({
        id: l.id, name: l.name, leadCount: l.leadCount, createdAt: l.createdAt,
        emailedCount: (l.companies || []).filter(c => tracking[c.orgNumber]?.emailed).length,
        calledCount: (l.companies || []).filter(c => tracking[c.orgNumber]?.called).length,
      })),
    }
  }, [lists, tracking])

  function getListsForOrg(orgNumber) {
    return lists.filter(l => (l.companies || []).some(c => c.orgNumber === orgNumber)).map(l => l.name)
  }

  function getAllOrgNumbers() {
    const orgs = new Set()
    lists.forEach(l => (l.companies || []).forEach(c => orgs.add(c.orgNumber)))
    return orgs
  }

  return { lists, saveList, deleteList, getList, markEmailed, markCalled, getTracking, getStats, getListsForOrg, getAllOrgNumbers, loading, refresh }
}
