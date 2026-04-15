import { useState, useEffect, useCallback } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { useAuth } from './useAuth'

const STAGES = [
  { id: 'new', label: 'Ny Lead', color: '#9E98B5', emoji: '🆕' },
  { id: 'contacted', label: 'Kontaktet', color: '#7C5CFC', emoji: '📧' },
  { id: 'meeting', label: 'Møte Booket', color: '#FF6B4A', emoji: '📅' },
  { id: 'contract', label: 'Sendt Kontrakt', color: '#F59E0B', emoji: '📝' },
  { id: 'won', label: 'Closed Won', color: '#22C55E', emoji: '🏆' },
  { id: 'lost', label: 'Closed Lost', color: '#EF4444', emoji: '❌' },
]

export { STAGES }

/**
 * Supabase-backed pipeline hook.
 *
 * One row per (workspace, org_number) in public.pipeline_items. Shape is
 * denormalised (name/industry/contact/email/municipality live on the row)
 * so that the kanban doesn't need to join against saved_lists to render.
 *
 * Keeps the same external API as the old localStorage hook so call sites
 * (PipelinePage, LeadDetailModal, etc.) don't need changes beyond awaiting
 * the mutations if they want to chain.
 */
export function usePipeline() {
  const { profile } = useAuth()
  const workspaceId = profile?.default_workspace_id || null

  // Map keyed by org_number, same shape the old hook produced, so selectors
  // like getLeadsForStage can stay synchronous.
  const [pipeline, setPipeline] = useState({})
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!isSupabaseConfigured() || !workspaceId) {
      setPipeline({}); setLoading(false); return
    }
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('pipeline_items')
        .select('*')
        .eq('workspace_id', workspaceId)
      if (error) throw error
      const map = {}
      for (const row of data || []) {
        map[row.org_number] = {
          stageId: row.stage_id,
          movedAt: row.moved_at,
          name: row.name || '',
          industry: row.industry || '',
          contactName: row.contact_name || '',
          email: row.email || '',
          phone: row.phone || '',
          municipality: row.municipality || '',
          notes: row.notes || [],
          _id: row.id,
        }
      }
      setPipeline(map)
    } catch (e) {
      console.error('[usePipeline] refresh failed', e)
    } finally {
      setLoading(false)
    }
  }, [workspaceId])

  useEffect(() => { refresh() }, [refresh])

  const getStage = useCallback((orgNumber) => pipeline[orgNumber] || null, [pipeline])

  async function moveToStage(orgNumber, stageId, leadData = null) {
    if (!workspaceId) return
    const existing = pipeline[orgNumber] || {}
    const row = {
      workspace_id: workspaceId,
      org_number: orgNumber,
      stage_id: stageId,
      moved_at: new Date().toISOString(),
      name: leadData?.name ?? existing.name ?? null,
      industry: leadData?.industry ?? existing.industry ?? null,
      contact_name: leadData?.contactName ?? existing.contactName ?? null,
      email: leadData?.email ?? existing.email ?? null,
      phone: leadData?.phone ?? existing.phone ?? null,
      municipality: leadData?.municipality ?? existing.municipality ?? null,
      notes: existing.notes || [],
    }
    // Optimistic update
    setPipeline(prev => ({ ...prev, [orgNumber]: {
      stageId, movedAt: row.moved_at,
      name: row.name || '', industry: row.industry || '',
      contactName: row.contact_name || '', email: row.email || '',
      phone: row.phone || '', municipality: row.municipality || '',
      notes: row.notes, _id: existing._id,
    }}))
    const { error } = await supabase
      .from('pipeline_items')
      .upsert(row, { onConflict: 'workspace_id,org_number' })
    if (error) { console.error(error); await refresh() }
  }

  async function addToPipeline(orgNumber, leadData, stageId = 'new') {
    if (pipeline[orgNumber]) return
    await moveToStage(orgNumber, stageId, leadData)
  }

  async function removeFromPipeline(orgNumber) {
    if (!workspaceId) return
    const lead = pipeline[orgNumber]
    // Optimistic
    setPipeline(prev => {
      const next = { ...prev }
      delete next[orgNumber]
      return next
    })
    const { error } = await supabase
      .from('pipeline_items')
      .delete()
      .eq('workspace_id', workspaceId)
      .eq('org_number', orgNumber)
    if (error) { console.error(error); await refresh() }
    return lead
  }

  const getLeadsForStage = useCallback((stageId) => {
    return Object.entries(pipeline)
      .filter(([, data]) => data.stageId === stageId)
      .map(([orgNumber, data]) => ({ orgNumber, ...data }))
      .sort((a, b) => (b.movedAt || '').localeCompare(a.movedAt || ''))
  }, [pipeline])

  const getStageCounts = useCallback(() => {
    const counts = {}
    STAGES.forEach(s => { counts[s.id] = 0 })
    Object.values(pipeline).forEach(data => {
      if (counts[data.stageId] !== undefined) counts[data.stageId]++
    })
    return counts
  }, [pipeline])

  async function addListToPipeline(companies) {
    if (!workspaceId) return 0
    const now = new Date().toISOString()
    const toInsert = []
    for (const c of companies) {
      if (!c.orgNumber || pipeline[c.orgNumber]) continue
      toInsert.push({
        workspace_id: workspaceId,
        org_number: c.orgNumber,
        stage_id: 'new',
        moved_at: now,
        name: c.name || null,
        industry: c.industry || null,
        contact_name: c.contactName || null,
        email: c.email || null,
        phone: c.phone || null,
        municipality: c.municipality || null,
        notes: [],
      })
    }
    if (!toInsert.length) return 0
    const { error } = await supabase
      .from('pipeline_items')
      .upsert(toInsert, { onConflict: 'workspace_id,org_number', ignoreDuplicates: true })
    if (error) { console.error(error); return 0 }
    await refresh()
    return toInsert.length
  }

  async function addNote(orgNumber, text) {
    if (!text.trim() || !pipeline[orgNumber] || !workspaceId) return
    const lead = pipeline[orgNumber]
    const note = { id: crypto.randomUUID(), text: text.trim(), createdAt: new Date().toISOString() }
    const newNotes = [...(lead.notes || []), note]
    // Optimistic
    setPipeline(prev => ({ ...prev, [orgNumber]: { ...prev[orgNumber], notes: newNotes } }))
    const { error } = await supabase
      .from('pipeline_items')
      .update({ notes: newNotes })
      .eq('workspace_id', workspaceId)
      .eq('org_number', orgNumber)
    if (error) { console.error(error); await refresh() }
  }

  async function removeNote(orgNumber, noteId) {
    if (!pipeline[orgNumber] || !workspaceId) return
    const lead = pipeline[orgNumber]
    const newNotes = (lead.notes || []).filter(n => n.id !== noteId)
    setPipeline(prev => ({ ...prev, [orgNumber]: { ...prev[orgNumber], notes: newNotes } }))
    const { error } = await supabase
      .from('pipeline_items')
      .update({ notes: newNotes })
      .eq('workspace_id', workspaceId)
      .eq('org_number', orgNumber)
    if (error) { console.error(error); await refresh() }
  }

  async function autoAdvanceToContacted(orgNumber) {
    const current = pipeline[orgNumber]
    if (current && current.stageId === 'new') {
      await moveToStage(orgNumber, 'contacted')
      return true
    }
    return false
  }

  return {
    pipeline,
    loading,
    refresh,
    getStage,
    moveToStage,
    addToPipeline,
    removeFromPipeline,
    getLeadsForStage,
    getStageCounts,
    addListToPipeline,
    addNote,
    removeNote,
    autoAdvanceToContacted,
    STAGES,
  }
}
