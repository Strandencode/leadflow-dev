import { useState, useEffect, useCallback } from 'react'
import { getPlan, getPlanLimits } from '../config/plans'

const PLAN_KEY = 'leadflow_user_plan'
const USAGE_KEY = 'leadflow_plan_usage'

/**
 * Hook for plan management and feature gating.
 * Tracks current plan, usage against limits, and provides gate checks.
 */
export function usePlan() {
  const [planId, setPlanId] = useState('starter')
  const [usage, setUsage] = useState({ enrichments: 0, monthKey: '' })

  useEffect(() => {
    try {
      const stored = localStorage.getItem(PLAN_KEY)
      if (stored) setPlanId(stored)
    } catch {}
    try {
      const stored = JSON.parse(localStorage.getItem(USAGE_KEY) || '{}')
      const currentMonth = new Date().toISOString().slice(0, 7) // "2026-04"
      // Reset if new month
      if (stored.monthKey !== currentMonth) {
        const fresh = { enrichments: 0, monthKey: currentMonth }
        setUsage(fresh)
        localStorage.setItem(USAGE_KEY, JSON.stringify(fresh))
      } else {
        setUsage(stored)
      }
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

  // === Gate checks ===
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
  }
}
