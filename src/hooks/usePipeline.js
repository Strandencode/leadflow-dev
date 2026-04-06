import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'leadflow_pipeline'

const STAGES = [
  { id: 'new', label: 'Ny Lead', color: '#9E98B5', emoji: '🆕' },
  { id: 'contacted', label: 'Kontaktet', color: '#7C5CFC', emoji: '📧' },
  { id: 'meeting', label: 'Møte Booket', color: '#FF6B4A', emoji: '📅' },
  { id: 'contract', label: 'Sendt Kontrakt', color: '#F59E0B', emoji: '📝' },
  { id: 'won', label: 'Closed Won', color: '#22C55E', emoji: '🏆' },
  { id: 'lost', label: 'Closed Lost', color: '#EF4444', emoji: '❌' },
]

export { STAGES }

export function usePipeline() {
  const [pipeline, setPipeline] = useState({})

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) setPipeline(JSON.parse(stored))
    } catch {}
  }, [])

  function persist(updated) {
    setPipeline(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  // Get stage for a lead (by orgNumber)
  const getStage = useCallback((orgNumber) => {
    return pipeline[orgNumber] || null
  }, [pipeline])

  // Move a lead to a stage
  function moveToStage(orgNumber, stageId, leadData = null) {
    const updated = { ...pipeline }
    updated[orgNumber] = {
      stageId,
      movedAt: new Date().toISOString(),
      ...(leadData ? { name: leadData.name, industry: leadData.industry, contactName: leadData.contactName, email: leadData.email, municipality: leadData.municipality } : (pipeline[orgNumber] || {})),
      stageId,
      movedAt: new Date().toISOString(),
    }
    persist(updated)
  }

  // Add lead to pipeline if not already there
  function addToPipeline(orgNumber, leadData, stageId = 'new') {
    if (pipeline[orgNumber]) return
    moveToStage(orgNumber, stageId, leadData)
  }

  // Remove from pipeline
  function removeFromPipeline(orgNumber) {
    const updated = { ...pipeline }
    delete updated[orgNumber]
    persist(updated)
  }

  // Get all leads for a specific stage
  const getLeadsForStage = useCallback((stageId) => {
    return Object.entries(pipeline)
      .filter(([_, data]) => data.stageId === stageId)
      .map(([orgNumber, data]) => ({ orgNumber, ...data }))
      .sort((a, b) => (b.movedAt || '').localeCompare(a.movedAt || ''))
  }, [pipeline])

  // Get count per stage
  const getStageCounts = useCallback(() => {
    const counts = {}
    STAGES.forEach(s => { counts[s.id] = 0 })
    Object.values(pipeline).forEach(data => {
      if (counts[data.stageId] !== undefined) counts[data.stageId]++
    })
    return counts
  }, [pipeline])

  // Bulk add from saved list
  function addListToPipeline(companies) {
    const updated = { ...pipeline }
    let added = 0
    for (const c of companies) {
      if (!updated[c.orgNumber]) {
        updated[c.orgNumber] = {
          stageId: 'new',
          movedAt: new Date().toISOString(),
          name: c.name,
          industry: c.industry,
          contactName: c.contactName,
          email: c.email,
          municipality: c.municipality,
        }
        added++
      }
    }
    persist(updated)
    return added
  }

  return {
    pipeline,
    getStage,
    moveToStage,
    addToPipeline,
    removeFromPipeline,
    getLeadsForStage,
    getStageCounts,
    addListToPipeline,
    STAGES,
  }
}
