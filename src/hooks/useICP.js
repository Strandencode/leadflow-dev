import { useState, useEffect, useCallback } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { useAuth } from './useAuth'

const EMPTY = {
  companyName: '',
  senderName: '',
  yourIndustry: '',
  whatYouSell: '',
  targetIndustries: '',
  companySize: '',
  minRevenue: '',
  targetRegion: '',
  problemYouSolve: '',
  decisionMakerTitle: '',
  decisionMakerDept: '',
}

const DB_KEYS = {
  companyName: 'company_name',
  senderName: 'sender_name',
  yourIndustry: 'your_industry',
  whatYouSell: 'what_you_sell',
  targetIndustries: 'target_industries',
  companySize: 'company_size',
  minRevenue: 'min_revenue',
  targetRegion: 'target_region',
  problemYouSolve: 'problem_you_solve',
  decisionMakerTitle: 'decision_maker_title',
  decisionMakerDept: 'decision_maker_dept',
}

function rowToIcp(row) {
  if (!row) return { ...EMPTY }
  const out = { ...EMPTY }
  for (const [camel, snake] of Object.entries(DB_KEYS)) {
    out[camel] = row[snake] || ''
  }
  return out
}

function icpToRow(icp, workspaceId) {
  const row = { workspace_id: workspaceId }
  for (const [camel, snake] of Object.entries(DB_KEYS)) {
    row[snake] = icp[camel] || null
  }
  return row
}

/**
 * Supabase-backed ICP profile hook.
 * One row per workspace (enforced by unique constraint on workspace_id).
 * Mirrors the old localStorage shape so pages that read raw `icp` still work.
 */
export function useICP() {
  const { profile } = useAuth()
  const workspaceId = profile?.default_workspace_id || null

  const [icp, setIcp] = useState({ ...EMPTY })
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!isSupabaseConfigured() || !workspaceId) {
      setIcp({ ...EMPTY }); setLoading(false); return
    }
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('icp_profiles')
        .select('*')
        .eq('workspace_id', workspaceId)
        .maybeSingle()
      if (error) throw error
      setIcp(rowToIcp(data))
    } catch (e) {
      console.error('[useICP] refresh failed', e)
    } finally {
      setLoading(false)
    }
  }, [workspaceId])

  useEffect(() => { refresh() }, [refresh])

  async function save(nextIcp) {
    if (!workspaceId) return { error: 'no_workspace' }
    const row = icpToRow(nextIcp, workspaceId)
    const { error } = await supabase
      .from('icp_profiles')
      .upsert(row, { onConflict: 'workspace_id' })
    if (error) { console.error(error); return { error: error.message } }
    setIcp(nextIcp)
    return { success: true }
  }

  return { icp, setIcp, save, loading, refresh }
}
