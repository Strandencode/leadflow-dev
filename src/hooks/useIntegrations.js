import { useState, useEffect, useCallback } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { useAuth } from './useAuth'

/**
 * Per-workspace third-party integrations (Slack for now).
 *
 * Reads slack_webhook_url + slack_events from the workspaces row and exposes
 * a saver. The schema is defined in supabase-migration-slack.sql; the trigger
 * on pipeline_items uses these columns to fire webhooks on new leads.
 */
export function useIntegrations() {
  const { profile } = useAuth()
  const wsId = profile?.default_workspace_id

  const [slackWebhookUrl, setSlackWebhookUrl] = useState('')
  const [slackEvents,     setSlackEvents]     = useState([])
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)

  const load = useCallback(async () => {
    if (!wsId || !isSupabaseConfigured()) { setLoading(false); return }
    const { data, error } = await supabase
      .from('workspaces')
      .select('slack_webhook_url, slack_events')
      .eq('id', wsId)
      .maybeSingle()
    if (!error && data) {
      setSlackWebhookUrl(data.slack_webhook_url || '')
      setSlackEvents(data.slack_events || [])
    }
    setLoading(false)
  }, [wsId])

  useEffect(() => { load() }, [load])

  /** Save Slack settings. Empty url disables the integration. */
  async function saveSlack({ webhookUrl, events }) {
    if (!wsId || !isSupabaseConfigured()) return { error: 'no_workspace' }
    const cleanUrl = (webhookUrl || '').trim()
    if (cleanUrl && !/^https:\/\/hooks\.slack\.com\/services\/[A-Z0-9\/]+$/i.test(cleanUrl)) {
      return { error: 'invalid_slack_url' }
    }
    setSaving(true)
    const { error } = await supabase
      .from('workspaces')
      .update({
        slack_webhook_url: cleanUrl || null,
        slack_events:      Array.isArray(events) ? events : [],
      })
      .eq('id', wsId)
    setSaving(false)
    if (error) return { error: error.message }
    setSlackWebhookUrl(cleanUrl)
    setSlackEvents(events || [])
    return { success: true }
  }

  return {
    slackWebhookUrl, slackEvents,
    loading, saving,
    saveSlack, reload: load,
  }
}
