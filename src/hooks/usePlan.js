import { useState, useEffect, useCallback } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { useAuth } from './useAuth'
import { getPlan, getPlanLimits } from '../config/plans'

/**
 * Workspace-scoped plan + monthly enrichment quota.
 *
 * Plan and trial_started_at live on `workspaces`; only the owner can change
 * the plan (enforced by the existing "Owner can update workspace" RLS
 * policy). Enrichment counters live in `usage_counters`, shared across
 * teammates. Increments go through the increment_usage RPC.
 *
 * Synchronous can-* and limit accessors read from local state, so call sites
 * keep working unchanged. State refreshes whenever the workspace changes.
 */
function getMonthKey() {
  const d = new Date()
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

export function usePlan() {
  const { profile } = useAuth()
  const workspaceId = profile?.default_workspace_id || null

  const [planId, setPlanId] = useState('professional')
  const [trialStart, setTrialStart] = useState(null)
  const [usage, setUsage] = useState({ enrichments: 0, monthKey: getMonthKey() })

  const refresh = useCallback(async () => {
    if (!isSupabaseConfigured() || !workspaceId) return
    const monthKey = getMonthKey()
    const [wsRes, usageRes] = await Promise.all([
      supabase.from('workspaces').select('plan, trial_started_at').eq('id', workspaceId).maybeSingle(),
      supabase.from('usage_counters')
        .select('enrichments, month_key')
        .eq('workspace_id', workspaceId)
        .eq('month_key', monthKey)
        .maybeSingle(),
    ])
    if (wsRes.data) {
      setPlanId(wsRes.data.plan || 'professional')
      setTrialStart(wsRes.data.trial_started_at)
    }
    setUsage({
      enrichments: usageRes.data?.enrichments || 0,
      monthKey,
    })
  }, [workspaceId])

  useEffect(() => { refresh() }, [refresh])

  async function changePlan(newPlanId) {
    if (!workspaceId) return { error: 'no_workspace' }
    // Optimistic
    setPlanId(newPlanId)
    const { error } = await supabase
      .from('workspaces')
      .update({ plan: newPlanId })
      .eq('id', workspaceId)
    if (error) {
      console.error('[usePlan] changePlan failed', error)
      await refresh()
      return { error: error.message }
    }
    return { success: true }
  }

  async function trackEnrichment(count = 1) {
    setUsage(u => ({ ...u, enrichments: u.enrichments + count }))
    if (!isSupabaseConfigured()) return
    const { error } = await supabase.rpc('increment_usage', { field: 'enrichments', amount: count })
    if (error) { console.error('[usePlan] trackEnrichment failed', error); await refresh() }
  }

  const plan = getPlan(planId)
  const limits = getPlanLimits(planId)

  // Trial state
  const trialDays = plan.trialDays || 0
  const trialEndDate = trialStart ? new Date(new Date(trialStart).getTime() + trialDays * 86400000) : null
  const trialDaysLeft = trialEndDate ? Math.max(0, Math.ceil((trialEndDate.getTime() - Date.now()) / 86400000)) : 0
  const isOnTrial = trialDays > 0 && trialDaysLeft > 0
  const trialExpired = trialDays > 0 && trialDaysLeft <= 0

  const canEnrich = useCallback(() => {
    if (limits.enrichments === Infinity) return true
    return usage.enrichments < limits.enrichments
  }, [limits.enrichments, usage.enrichments])

  const enrichmentsLeft = useCallback(() => {
    if (limits.enrichments === Infinity) return Infinity
    return Math.max(0, limits.enrichments - usage.enrichments)
  }, [limits.enrichments, usage.enrichments])

  const canSaveList = useCallback((currentListCount) => {
    if (limits.savedLists === Infinity) return true
    return currentListCount < limits.savedLists
  }, [limits.savedLists])

  const canAddToPipeline = useCallback((currentLeadCount) => {
    if (limits.pipelineLeads === Infinity) return true
    return currentLeadCount < limits.pipelineLeads
  }, [limits.pipelineLeads])

  const canExportCSV = limits.csvExport
  const canUseAnalytics = limits.analytics
  const canUseWorkspace = limits.workspace
  const maxVisibleResults = limits.visibleResults
  const maxUsers = limits.maxUsers

  return {
    planId,
    plan,
    limits,
    usage,
    refresh,
    changePlan,
    trackEnrichment,
    canEnrich,
    enrichmentsLeft,
    canSaveList,
    canAddToPipeline,
    canExportCSV,
    canUseAnalytics,
    canUseWorkspace,
    maxVisibleResults,
    maxUsers,
    isOnTrial,
    trialExpired,
    trialDaysLeft,
    trialEndDate,
  }
}
