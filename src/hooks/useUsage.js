import { useState, useEffect, useCallback } from 'react'

const USAGE_KEY = 'leadflow_usage'
const PLAN_KEY = 'leadflow_user_plan'

const PLANS = {
  free: { emails: 20, phones: 20, name: 'Gratis' },
  starter: { emails: 1000, phones: 1000, name: 'Starter' },
  unlimited: { emails: Infinity, phones: Infinity, name: 'Unlimited' },
}

function getMonthKey() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function getUsage() {
  try {
    const stored = JSON.parse(localStorage.getItem(USAGE_KEY) || '{}')
    const month = getMonthKey()
    if (stored.month !== month) {
      // New month — reset counters
      return { month, emailsSent: 0, phonesViewed: 0 }
    }
    return stored
  } catch {
    return { month: getMonthKey(), emailsSent: 0, phonesViewed: 0 }
  }
}

function saveUsage(usage) {
  localStorage.setItem(USAGE_KEY, JSON.stringify(usage))
}

function getPlan() {
  try {
    const stored = localStorage.getItem(PLAN_KEY)
    if (!stored) return 'free'
    // Handle both plain string ('free') and JSON ('{"plan":"free"}')
    if (stored.startsWith('{')) {
      return JSON.parse(stored).plan || 'free'
    }
    return stored
  } catch {
    return 'free'
  }
}

export function useUsage() {
  const [usage, setUsage] = useState(getUsage)
  const [plan, setPlan] = useState(getPlan)

  // Re-read on mount and when localStorage changes
  useEffect(() => {
    setUsage(getUsage())
    setPlan(getPlan())

    function onStorage() { setUsage(getUsage()); setPlan(getPlan()) }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const limits = PLANS[plan] || PLANS.free

  const canSendEmails = useCallback((count = 1) => {
    const u = getUsage()
    return u.emailsSent + count <= limits.emails
  }, [limits.emails])

  const canViewPhones = useCallback((count = 1) => {
    const u = getUsage()
    return u.phonesViewed + count <= limits.phones
  }, [limits.phones])

  const trackEmails = useCallback((count = 1) => {
    const u = getUsage()
    u.emailsSent = (u.emailsSent || 0) + count
    saveUsage(u)
    setUsage({ ...u })
  }, [])

  const trackPhones = useCallback((count = 1) => {
    const u = getUsage()
    u.phonesViewed = (u.phonesViewed || 0) + count
    saveUsage(u)
    setUsage({ ...u })
  }, [])

  const emailsRemaining = Math.max(0, limits.emails - (usage.emailsSent || 0))
  const phonesRemaining = Math.max(0, limits.phones - (usage.phonesViewed || 0))

  return {
    usage,
    plan,
    planName: limits.name,
    limits,
    canSendEmails,
    canViewPhones,
    trackEmails,
    trackPhones,
    emailsRemaining,
    phonesRemaining,
    emailsUsed: usage.emailsSent || 0,
    phonesUsed: usage.phonesViewed || 0,
  }
}
