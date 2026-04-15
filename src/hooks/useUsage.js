import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { useAuth } from './useAuth'

/**
 * Workspace-shared monthly quota tracker for emails + phones.
 *
 * Counters live in public.usage_counters keyed by (workspace_id, month_key).
 * Increments go through the increment_usage RPC for atomic update under
 * concurrent writes from multiple teammates.
 *
 * The plan resolution still uses the simple legacy free/starter/unlimited
 * map below — usePlan handles the richer professional/business/enterprise
 * model. The two coexist for now because EmailComposerModal binds to the
 * legacy shape (canSendEmails / emailsRemaining / planName).
 */
const PLANS = {
  free: { emails: 20, phones: 20, name: 'Gratis' },
  starter: { emails: 1000, phones: 1000, name: 'Starter' },
  unlimited: { emails: Infinity, phones: Infinity, name: 'Unlimited' },
}

// Map workspace plan ids → legacy quota buckets
function legacyPlan(workspacePlan) {
  if (workspacePlan === 'enterprise') return 'unlimited'
  if (workspacePlan === 'business') return 'starter'
  return 'starter' // professional → starter quotas (1000 emails/phones per month)
}

function getMonthKey() {
  const d = new Date()
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

export function useUsage() {
  const { profile } = useAuth()
  const workspaceId = profile?.default_workspace_id || null

  const [usage, setUsage] = useState({ emailsSent: 0, phonesViewed: 0, monthKey: getMonthKey() })
  const [workspacePlan, setWorkspacePlan] = useState('professional')
  const fetchedRef = useRef(false)

  const refresh = useCallback(async () => {
    if (!isSupabaseConfigured() || !workspaceId) return
    const monthKey = getMonthKey()
    const [usageRes, wsRes] = await Promise.all([
      supabase.from('usage_counters')
        .select('emails_sent, phones_viewed, month_key')
        .eq('workspace_id', workspaceId)
        .eq('month_key', monthKey)
        .maybeSingle(),
      supabase.from('workspaces').select('plan').eq('id', workspaceId).maybeSingle(),
    ])
    if (usageRes.data) {
      setUsage({
        emailsSent: usageRes.data.emails_sent || 0,
        phonesViewed: usageRes.data.phones_viewed || 0,
        monthKey: usageRes.data.month_key,
      })
    } else {
      setUsage({ emailsSent: 0, phonesViewed: 0, monthKey })
    }
    if (wsRes.data?.plan) setWorkspacePlan(wsRes.data.plan)
    fetchedRef.current = true
  }, [workspaceId])

  useEffect(() => { refresh() }, [refresh])

  const planKey = legacyPlan(workspacePlan)
  const limits = PLANS[planKey] || PLANS.free

  const canSendEmails = useCallback((count = 1) => {
    return usage.emailsSent + count <= limits.emails
  }, [usage.emailsSent, limits.emails])

  const canViewPhones = useCallback((count = 1) => {
    return usage.phonesViewed + count <= limits.phones
  }, [usage.phonesViewed, limits.phones])

  async function trackEmails(count = 1) {
    // Optimistic local update
    setUsage(u => ({ ...u, emailsSent: u.emailsSent + count }))
    if (!isSupabaseConfigured()) return
    const { error } = await supabase.rpc('increment_usage', { field: 'emails_sent', amount: count })
    if (error) { console.error('[useUsage] trackEmails failed', error); await refresh() }
  }

  async function trackPhones(count = 1) {
    setUsage(u => ({ ...u, phonesViewed: u.phonesViewed + count }))
    if (!isSupabaseConfigured()) return
    const { error } = await supabase.rpc('increment_usage', { field: 'phones_viewed', amount: count })
    if (error) { console.error('[useUsage] trackPhones failed', error); await refresh() }
  }

  const emailsRemaining = limits.emails === Infinity ? Infinity : Math.max(0, limits.emails - usage.emailsSent)
  const phonesRemaining = limits.phones === Infinity ? Infinity : Math.max(0, limits.phones - usage.phonesViewed)

  return {
    usage,
    plan: planKey,
    planName: limits.name,
    limits,
    canSendEmails,
    canViewPhones,
    trackEmails,
    trackPhones,
    emailsRemaining,
    phonesRemaining,
    emailsUsed: usage.emailsSent,
    phonesUsed: usage.phonesViewed,
  }
}
