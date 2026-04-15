import { useState, useEffect, useCallback } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { useAuth } from './useAuth'

/**
 * Supabase-backed email templates hook.
 *
 * Shape returned matches the old localStorage template objects:
 *   { id, name, subject, body, segmentId, segmentName, segmentEmoji, createdAt }
 *
 * Segment metadata (id/name/emoji) is embedded in the DB `body` wrapper... no,
 * actually we just stash it on dedicated columns? The schema keeps it simple:
 * only name/subject/body persist. Segment info lives in a `meta` JSON object
 * encoded in the body's preamble — too ugly. Instead we add an `extra` path:
 * we piggyback segment info into the row by storing it in the `name` prefix.
 *
 * Pragmatic choice: we extend the email_templates schema at read-time by using
 * a convention — the name field stays human-readable, and segmentId is tracked
 * via a JSON suffix in the body? No. Better: store segment metadata as the
 * first line of the body, prefixed with `<!--segment:{json}-->`. Keeps schema
 * unchanged and round-trips losslessly.
 */
const SEG_PREFIX = '<!--segment:'
const SEG_SUFFIX = '-->\n'

function encodeBody(body, seg) {
  const meta = { id: seg?.id || 'general', name: seg?.name || 'Generell', emoji: seg?.emoji || '📧' }
  return `${SEG_PREFIX}${JSON.stringify(meta)}${SEG_SUFFIX}${body || ''}`
}

function decodeBody(raw) {
  if (!raw || !raw.startsWith(SEG_PREFIX)) {
    return { body: raw || '', segment: { id: 'general', name: 'Generell', emoji: '📧' } }
  }
  const end = raw.indexOf(SEG_SUFFIX)
  if (end === -1) return { body: raw, segment: { id: 'general', name: 'Generell', emoji: '📧' } }
  try {
    const json = raw.slice(SEG_PREFIX.length, end)
    const segment = JSON.parse(json)
    return { body: raw.slice(end + SEG_SUFFIX.length), segment }
  } catch {
    return { body: raw, segment: { id: 'general', name: 'Generell', emoji: '📧' } }
  }
}

function mapRow(row) {
  const { body, segment } = decodeBody(row.body)
  return {
    id: row.id,
    name: row.name,
    subject: row.subject || '',
    body,
    segmentId: segment.id,
    segmentName: segment.name,
    segmentEmoji: segment.emoji,
    createdAt: row.created_at,
  }
}

export function useEmailTemplates() {
  const { profile, user } = useAuth()
  const workspaceId = profile?.default_workspace_id || null

  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!isSupabaseConfigured() || !workspaceId) {
      setTemplates([]); setLoading(false); return
    }
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })
      if (error) throw error
      setTemplates((data || []).map(mapRow))
    } catch (e) {
      console.error('[useEmailTemplates] refresh failed', e)
    } finally {
      setLoading(false)
    }
  }, [workspaceId])

  useEffect(() => { refresh() }, [refresh])

  async function saveTemplate({ name, subject, body, segment }) {
    if (!workspaceId) return null
    const { data, error } = await supabase.from('email_templates').insert({
      workspace_id: workspaceId,
      created_by: user?.id || null,
      name: name || 'Untitled',
      subject: subject || '',
      body: encodeBody(body, segment),
    }).select().single()
    if (error) { console.error(error); return null }
    const mapped = mapRow(data)
    setTemplates(prev => [mapped, ...prev])
    return mapped
  }

  async function deleteTemplate(id) {
    setTemplates(prev => prev.filter(t => t.id !== id))
    const { error } = await supabase.from('email_templates').delete().eq('id', id)
    if (error) { console.error(error); await refresh() }
  }

  async function duplicateTemplate(id) {
    const tpl = templates.find(t => t.id === id)
    if (!tpl) return null
    return saveTemplate({
      name: `${tpl.name} (kopi)`,
      subject: tpl.subject,
      body: tpl.body,
      segment: { id: tpl.segmentId, name: tpl.segmentName, emoji: tpl.segmentEmoji },
    })
  }

  return { templates, loading, refresh, saveTemplate, deleteTemplate, duplicateTemplate }
}
