/**
 * POST /api/leads
 *
 * Public inbound-lead endpoint. The landing page sends a form submission here;
 * we authenticate via a workspace API key and insert a pipeline_item at
 * stage_id='new' (the "Ny Lead" column in the app).
 *
 * Required env vars (set in Vercel → Project → Settings → Environment Variables):
 *   SUPABASE_URL                — same as VITE_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY   — service role, NEVER expose in client code
 *   LEADS_ALLOWED_ORIGINS       — comma-separated list, e.g. "https://vekstor.no,https://www.vekstor.no"
 *                                 If unset, defaults to "*" (dev only).
 *
 * Request:
 *   POST /api/leads
 *   Content-Type: application/json
 *   X-API-Key: vks_<48 hex chars>
 *   {
 *     "name":    "Ola Nordmann",          // required, 2–120 chars
 *     "email":   "ola@bedrift.no",        // required, valid email
 *     "phone":   "+47 99 88 77 66",       // optional
 *     "company": "Bedrift AS",            // optional — used as row name if present
 *     "source":  "landing",               // optional — free-text, e.g. "landing" / "chat"
 *     "notes":   "Ønsker demo neste uke"  // optional
 *   }
 *
 * Response:
 *   201  { ok: true, id, stage, workspace }                new lead
 *   200  { ok: true, id, stage, workspace, duplicate: true } updated existing lead
 *   400  validation error
 *   401  missing/invalid api_key
 *   429  rate limited
 *   500  server misconfigured / insert failed
 */

import { createClient } from '@supabase/supabase-js'

export const config = { maxDuration: 10 }

// ---- Config ---------------------------------------------------------------
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY
const ALLOWED_ORIGINS = (process.env.LEADS_ALLOWED_ORIGINS || '*')
  .split(',').map(s => s.trim()).filter(Boolean)

// ---- Rate limit (per function instance; best-effort) ----------------------
// Vercel cold-starts reset this. For strong guarantees, swap to Upstash Redis.
const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX       = 10
const hits = new Map()
function rateLimited(ip) {
  const now = Date.now()
  const entry = hits.get(ip) || { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS }
  if (now > entry.resetAt) { entry.count = 0; entry.resetAt = now + RATE_LIMIT_WINDOW_MS }
  entry.count += 1
  hits.set(ip, entry)
  return entry.count > RATE_LIMIT_MAX
}

// ---- CORS -----------------------------------------------------------------
function setCors(req, res) {
  const origin = req.headers.origin || ''
  const allow =
    ALLOWED_ORIGINS.includes('*')      ? origin || '*' :
    ALLOWED_ORIGINS.includes(origin)   ? origin :
    null
  if (allow) {
    res.setHeader('Access-Control-Allow-Origin', allow)
    res.setHeader('Vary', 'Origin')
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key')
  res.setHeader('Access-Control-Max-Age', '600')
}

// ---- Validation -----------------------------------------------------------
const EMAIL_RE = /^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$/
// Norwegian-friendly phone: + or digit, spaces/dashes/parens/dots allowed, 7–20 chars total
const PHONE_RE = /^[+\d][\d\s\-().]{6,19}$/

function validateInput({ name, email, phone, company, notes, source }) {
  if (typeof name !== 'string' || name.trim().length < 2 || name.length > 120)
    return 'name must be 2–120 characters'
  if (typeof email !== 'string' || !EMAIL_RE.test(email))
    return 'email is invalid'
  if (phone != null && (typeof phone !== 'string' || !PHONE_RE.test(phone)))
    return 'phone is invalid'
  if (company != null && (typeof company !== 'string' || company.length > 200))
    return 'company must be a string up to 200 chars'
  if (notes != null && (typeof notes !== 'string' || notes.length > 2000))
    return 'notes must be a string up to 2000 chars'
  if (source != null && (typeof source !== 'string' || source.length > 60))
    return 'source must be a string up to 60 chars'
  return null
}

// ---- Handler --------------------------------------------------------------
export default async function handler(req, res) {
  setCors(req, res)
  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'POST')    return res.status(405).json({ error: 'method_not_allowed' })

  if (!SUPABASE_URL || !SERVICE_KEY) {
    return res.status(500).json({ error: 'server_misconfigured' })
  }

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
             req.socket?.remoteAddress || 'unknown'
  if (rateLimited(ip)) return res.status(429).json({ error: 'too_many_requests' })

  // API key — header preferred
  const apiKey = req.headers['x-api-key'] ||
                 (typeof req.body === 'object' && req.body?.api_key) || null
  if (typeof apiKey !== 'string' || !apiKey.startsWith('vks_')) {
    return res.status(401).json({ error: 'missing_api_key' })
  }

  const body = typeof req.body === 'string' ? safeJson(req.body) : req.body
  if (!body || typeof body !== 'object') return res.status(400).json({ error: 'invalid_json' })

  const name    = body.name?.trim()
  const email   = body.email?.trim().toLowerCase()
  const phone   = body.phone?.trim() || null
  const company = body.company?.trim() || null
  const notes   = body.notes?.trim() || null
  const source  = body.source?.trim() || 'landing'

  const err = validateInput({ name, email, phone, company, notes, source })
  if (err) return res.status(400).json({ error: err })

  const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  // Resolve workspace by API key
  const { data: ws, error: wsErr } = await admin
    .from('workspaces')
    .select('id, name')
    .eq('api_key', apiKey)
    .maybeSingle()
  if (wsErr)    return res.status(500).json({ error: 'lookup_failed' })
  if (!ws)      return res.status(401).json({ error: 'invalid_api_key' })

  // Synthetic org_number so inbound leads fit the pipeline_items schema, which
  // requires (workspace_id, org_number) to be unique. Using hash(email) means
  // repeat submissions from the same address update the existing row instead
  // of creating duplicates.
  const orgNumber = 'inbound-' + fnv1aHex(email)
  const now = new Date().toISOString()

  const basePayload = {
    workspace_id: ws.id,
    org_number:   orgNumber,
    stage_id:     'new',
    moved_at:     now,
    name:         company || name,
    contact_name: name,
    email,
    phone,
  }

  // Try insert first; on conflict, update and append a note.
  const { data: inserted, error: insErr } = await admin
    .from('pipeline_items')
    .insert({
      ...basePayload,
      notes: [{ at: now, text: `Inbound lead (${source})${notes ? `: ${notes}` : ''}` }],
    })
    .select('id, stage_id, created_at')
    .single()

  if (!insErr) {
    return res.status(201).json({
      ok: true, id: inserted.id, stage: inserted.stage_id, workspace: ws.name,
    })
  }

  // 23505 = unique_violation (duplicate org_number for this workspace)
  if (insErr.code === '23505') {
    const { data: existing, error: selErr } = await admin
      .from('pipeline_items')
      .select('id, notes')
      .eq('workspace_id', ws.id)
      .eq('org_number', orgNumber)
      .single()
    if (selErr || !existing) {
      return res.status(500).json({ error: 'upsert_failed', detail: selErr?.message })
    }
    const appendedNotes = [
      ...(Array.isArray(existing.notes) ? existing.notes : []),
      { at: now, text: `Ny innsending fra ${source}${notes ? `: ${notes}` : ''}` },
    ]
    const { error: updErr } = await admin
      .from('pipeline_items')
      .update({ ...basePayload, notes: appendedNotes, updated_at: now })
      .eq('id', existing.id)
    if (updErr) return res.status(500).json({ error: 'update_failed', detail: updErr.message })
    return res.status(200).json({
      ok: true, id: existing.id, stage: 'new', workspace: ws.name, duplicate: true,
    })
  }

  return res.status(500).json({ error: 'insert_failed', detail: insErr.message })
}

// ---- Utils ----------------------------------------------------------------
function safeJson(s) { try { return JSON.parse(s) } catch { return null } }

// FNV-1a 32-bit, hex-encoded. Non-cryptographic — used only as a dedup key.
function fnv1aHex(s) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0).toString(16).padStart(8, '0') + s.length.toString(16)
}
