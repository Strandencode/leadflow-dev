import { useState, useEffect, useCallback } from 'react'
import { getPlan, getPlanLimits } from '../config/plans'

const PLAN_KEY = 'leadflow_user_plan'
const USAGE_KEY = 'leadflow_plan_usage'
const TRIAL_KEY = 'leadflow_trial_start'

/**
 * Hook for plan management and feature gating.
 * All users start with a 14-day free trial on Professional.
 * After trial expires, features are locked until they subscribe.
 */
export function usePlan() {
  const [planId, setPlanId] = useState('professional')
  const [usage, setUsage] = useState({ enrichments: 0, monthKey: '' })
  const [trialStart, setTrialStart] = useState(null)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(PLAN_KEY)
      if (stored) setPlanId(stored)
      else {
        // New user — default to professional trial
        localStorage.setItem(PLAN_KEY, 'professional')
      }
    } catch {}
    try {
      const stored = JSON.parse(localStorage.getItem(USAGE_KEY) || '{}')
      const currentMonth = new Date().toISOString().slice(0, 7)
      if (stored.monthKey !== currentMonth) {
        const fresh = { enrichments: 0, monthKey: currentMonth }
        setUsage(fresh)
        localStorage.setItem(USAGE_KEY, JSON.stringify(fresh))
      } else {
        setUsage(stored)
      }
    } catch {}
    try {
      let ts = localStorage.getItem(TRIAL_KEY)
      if (!ts) {
        // Start trial now
        ts = new Date().toISOString()
        localStorage.setItem(TRIAL_KEY, ts)
      }
      setTrialStart(ts)
    } catch {}
  }, [])

  function changePlan(newPlanId) {
    setPlanId(newPlanId)
    localStorage.setItem(PLAN_KEY, newPlanId)
  }

  function persistUsage(updated) {
    setUsage(updated)
    localStorage.setItem(USAGE_KEY, JSON.stringify(updated))
  }

  function trackEnrichment(count = 1) {
    const updated = { ...usage, enrichments: (usage.enrichments || 0) + count }
    persistUsage(updated)
  }

  const plan = getPlan(planId)
  const limits = getPlanLimits(planId)

  // Trial state
  const trialDays = plan.trialDays || 0
  const trialEndDate = trialStart ? new Date(new Date(trialStart).getTime() + trialDays * 86400000) : null
  const trialDaysLeft = trialEndDate ? Math.max(0, Math.ceil((trialEndDate.getTime() - Date.now()) / 86400000)) : 0
  const isOnTrial = trialDays > 0 && trialDaysLeft > 0
  const trialExpired = trialDays > 0 && trialDaysLeft <= 0

  // === Gate checks ===
  // During trial: full access. After trial: locked (in real app, Stripe handles this)
  // For MVP/demo: we keep access open but show warnings

  const canEnrich = useCallback(() => {
    if (limits.enrichments === Infinity) return true
    return (usage.enrichments || 0) < limits.enrichments
  }, [limits.enrichments, usage.enrichments])

  const enrichmentsLeft = useCallback(() => {
    if (limits.enrichments === Infinity) return Infinity
    return Math.max(0, limits.enrichments - (usage.enrichments || 0))
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
    // Trial
    isOnTrial,
    trialExpired,
    trialDaysLeft,
    trialEndDate,
  }
}
