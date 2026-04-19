import { useState, useEffect, useCallback } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { useAuth } from './useAuth'

/**
 * Workspace-shared search presets for the Prospektering page.
 *
 * Saves a combination of filter values (NACE code, kommune, employee range,
 * dates) + include/exclude keyword rules under a name so teams can reuse
 * refined searches per vertical.
 *
 * Two kinds of rows in `saved_searches`:
 *   - workspace_id set, is_template=false → team-local presets (this workspace only)
 *   - workspace_id null, is_template=true → curated templates (visible to everyone)
 *
 * RLS handles access control; we just read both sets and present them together.
 */
export function useSavedSearches() {
  const { profile, user } = useAuth()
  const workspaceId = profile?.default_workspace_id || null

  const [searches, setSearches] = useState([])
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    if (!isSupabaseConfigured() || !workspaceId) return
    setLoading(true)
    // Fetch both own workspace searches and templates in parallel.
    const [mineRes, tplRes] = await Promise.all([
      supabase.from('saved_searches')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('is_template', false)
        .order('updated_at', { ascending: false }),
      supabase.from('saved_searches')
        .select('*')
        .eq('is_template', true)
        .order('usage_count', { ascending: false }),
    ])
    setSearches(mineRes.data || [])
    setTemplates(tplRes.data || [])
    setLoading(false)
  }, [workspaceId])

  useEffect(() => { refresh() }, [refresh])

  /**
   * Save a new workspace-local search preset.
   * @param {{name, description, industryTag, filters, keywordInclude, keywordExclude}} input
   */
  async function saveSearch(input) {
    if (!workspaceId || !user) return { error: 'no_workspace' }
    const payload = {
      workspace_id: workspaceId,
      name: input.name?.trim() || 'Uten navn',
      description: input.description?.trim() || null,
      industry_tag: input.industryTag?.trim() || null,
      filters: input.filters || {},
      keyword_include: input.keywordInclude || null,
      keyword_exclude: input.keywordExclude || null,
      is_template: false,
      created_by: user.id,
    }
    const { data, error } = await supabase
      .from('saved_searches')
      .insert(payload)
      .select()
      .single()
    if (error) { console.error('[useSavedSearches] save failed', error); return { error: error.message } }
    await refresh()
    return { data }
  }

  async function updateSearch(id, updates) {
    // Remap camelCase to DB columns as needed
    const dbUpdates = {}
    if (updates.name !== undefined) dbUpdates.name = updates.name
    if (updates.description !== undefined) dbUpdates.description = updates.description
    if (updates.industryTag !== undefined) dbUpdates.industry_tag = updates.industryTag
    if (updates.filters !== undefined) dbUpdates.filters = updates.filters
    if (updates.keywordInclude !== undefined) dbUpdates.keyword_include = updates.keywordInclude
    if (updates.keywordExclude !== undefined) dbUpdates.keyword_exclude = updates.keywordExclude
    const { error } = await supabase.from('saved_searches').update(dbUpdates).eq('id', id)
    if (error) return { error: error.message }
    await refresh()
    return { success: true }
  }

  async function deleteSearch(id) {
    const { error } = await supabase.from('saved_searches').delete().eq('id', id)
    if (error) return { error: error.message }
    await refresh()
    return { success: true }
  }

  /**
   * Copy a template into this workspace as a new local saved search.
   * Also increments the template's usage_count for analytics.
   */
  async function applyTemplate(templateId) {
    const tpl = templates.find(t => t.id === templateId)
    if (!tpl || !workspaceId || !user) return { error: 'template_not_found' }
    const { data, error } = await supabase
      .from('saved_searches')
      .insert({
        workspace_id: workspaceId,
        name: tpl.name,
        description: tpl.description,
        industry_tag: tpl.industry_tag,
        filters: tpl.filters,
        keyword_include: tpl.keyword_include,
        keyword_exclude: tpl.keyword_exclude,
        is_template: false,
        created_by: user.id,
      })
      .select()
      .single()
    if (error) return { error: error.message }
    // TODO: increment tpl.usage_count via RPC once we add template analytics
    await refresh()
    return { data }
  }

  return {
    searches,
    templates,
    loading,
    refresh,
    saveSearch,
    updateSearch,
    deleteSearch,
    applyTemplate,
  }
}
