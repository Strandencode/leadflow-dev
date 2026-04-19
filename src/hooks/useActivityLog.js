import { useState, useEffect, useCallback } from 'react'
import { storageKey } from '../config/brand'

/**
 * Lightweight activity log — tracks things the user has done in the app
 * (e.g. deep-scraped websites, exported CSV, saved a list). Persisted to
 * localStorage so it survives refreshes. Deliberately minimal — no server
 * sync. Used for a "recent activity" dropdown in the sidebar.
 */

const STORAGE_KEY = storageKey('activity_log')
const MAX_ENTRIES = 100

// Module-level subscriber set so multiple components stay in sync
const subscribers = new Set()

function readLog() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function writeLog(entries) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)))
  } catch {
    // ignore quota errors
  }
  subscribers.forEach(fn => fn())
}

/**
 * Log an activity. `type` is a short machine label, `message` is human copy,
 * `meta` is an optional object (e.g. { count: 47, foundEmails: 12 }).
 * Safe to call from anywhere, including non-React modules.
 */
export function logActivity(type, message, meta = {}) {
  const entries = readLog()
  const entry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    message,
    meta,
    timestamp: new Date().toISOString(),
  }
  writeLog([entry, ...entries])
}

export function clearActivityLog() {
  writeLog([])
}

export function useActivityLog() {
  const [entries, setEntries] = useState(readLog)

  useEffect(() => {
    const update = () => setEntries(readLog())
    subscribers.add(update)
    // Also listen for storage events from other tabs
    window.addEventListener('storage', e => { if (e.key === STORAGE_KEY) update() })
    return () => { subscribers.delete(update) }
  }, [])

  const log = useCallback((type, message, meta) => logActivity(type, message, meta), [])
  const clear = useCallback(() => clearActivityLog(), [])

  return { entries, log, clear }
}
