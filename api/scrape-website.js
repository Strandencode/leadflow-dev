/**
 * Vercel serverless function — scrape a company website for contact info.
 *
 * Fetches the homepage + common contact subpages, extracts emails and phone
 * numbers, and returns them. Bypasses browser CORS and runs server-side so
 * the client doesn't need an API key.
 *
 * Usage: GET /api/scrape-website?website=https://example.no
 *
 * Cost: ~1-4 HTTP requests per company (homepage + up to 3 subpages).
 */

export const config = { maxDuration: 15 }

const SUBPAGES = ['/kontakt', '/contact', '/om-oss', '/about', '/about-us', '/kontaktoss']
const MAX_BYTES = 500_000 // cap per page — we only need text with emails/phones
const TIMEOUT_MS = 4500

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const params = req.method === 'POST' ? (req.body || {}) : (req.query || {})
  let { website } = params
  if (!website || typeof website !== 'string') {
    return res.status(400).json({ error: 'website parameter required' })
  }

  // Normalize
  website = website.trim()
  if (!/^https?:\/\//i.test(website)) website = 'https://' + website
  let baseUrl
  try {
    baseUrl = new URL(website)
  } catch {
    return res.status(400).json({ error: 'invalid website URL' })
  }

  try {
    const result = await scrapeSite(baseUrl)
    return res.status(200).json(result)
  } catch (err) {
    return res.status(200).json({
      website: baseUrl.toString(),
      emails: [],
      phones: [],
      error: err.message || 'scrape failed',
    })
  }
}

async function scrapeSite(baseUrl) {
  const emails = new Set()
  const phones = new Set()
  const pagesChecked = []
  const errors = []

  // Try homepage first
  const urls = [baseUrl.origin + baseUrl.pathname]
  for (const sub of SUBPAGES) urls.push(baseUrl.origin + sub)

  // Dedupe
  const seen = new Set()
  for (const url of urls) {
    if (seen.has(url)) continue
    seen.add(url)
    const result = await fetchPage(url)
    if (result.ok) {
      pagesChecked.push(url)
      extractContacts(result.html, emails, phones, baseUrl.hostname)
      // Stop scanning subpages once we've hit a good amount
      if (emails.size >= 3 && phones.size >= 2 && pagesChecked.length >= 2) break
    } else if (result.error) {
      errors.push(`${url}: ${result.error}`)
    }
  }

  return {
    website: baseUrl.toString(),
    emails: Array.from(emails),
    phones: Array.from(phones),
    pagesChecked,
    errors: errors.length ? errors : undefined,
  }
}

async function fetchPage(url) {
  try {
    const controller = new AbortController()
    const t = setTimeout(() => controller.abort(), TIMEOUT_MS)
    const resp = await fetch(url, {
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LeadFlowBot/1.0; +https://leadflow.no)',
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'nb,en;q=0.8',
      },
      signal: controller.signal,
    })
    clearTimeout(t)

    if (!resp.ok) return { ok: false, error: `HTTP ${resp.status}` }
    const ct = resp.headers.get('content-type') || ''
    if (!ct.includes('text/html') && !ct.includes('xml')) {
      return { ok: false, error: `content-type ${ct}` }
    }

    // Read up to MAX_BYTES
    const reader = resp.body?.getReader()
    if (!reader) {
      const html = await resp.text()
      return { ok: true, html: html.slice(0, MAX_BYTES) }
    }
    const chunks = []
    let total = 0
    while (total < MAX_BYTES) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(value)
      total += value.byteLength
    }
    try { reader.cancel() } catch {}
    const html = new TextDecoder('utf-8', { fatal: false }).decode(concat(chunks))
    return { ok: true, html }
  } catch (err) {
    return { ok: false, error: err.message || 'fetch error' }
  }
}

function concat(chunks) {
  let len = 0
  for (const c of chunks) len += c.byteLength
  const out = new Uint8Array(len)
  let off = 0
  for (const c of chunks) { out.set(c, off); off += c.byteLength }
  return out
}

function extractContacts(html, emails, phones, hostname) {
  // Strip scripts/styles — they clog the regex with junk
  const cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')

  // ========== Emails ==========
  // Prioritize mailto: links first (highest signal)
  const mailtoRe = /mailto:([^"'?\s<>]+)/gi
  let m
  while ((m = mailtoRe.exec(cleaned)) !== null) {
    addEmail(m[1], emails, hostname)
  }

  // Then any plain email in text
  const emailRe = /[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}/g
  while ((m = emailRe.exec(cleaned)) !== null) {
    addEmail(m[0], emails, hostname)
  }

  // ========== Phones ==========
  // Prioritize tel: links
  const telRe = /tel:([+\d\s\-().]+)/gi
  while ((m = telRe.exec(cleaned)) !== null) {
    const num = normalizePhone(m[1])
    if (num) phones.add(num)
  }

  // Norwegian phone patterns in text: 8 digits, optionally with +47 prefix,
  // optionally split into groups (xx xx xx xx or xxx xx xxx). Be somewhat
  // conservative to avoid matching org numbers or dates.
  const textPhoneRe = /(?:\+?\s?47[\s-]?)?(?:\d[\s\-.()]?){7,11}\d/g
  while ((m = textPhoneRe.exec(cleaned)) !== null) {
    const num = normalizePhone(m[0])
    if (num) phones.add(num)
  }
}

function addEmail(raw, emails, hostname) {
  if (!raw) return
  let email = raw.trim().toLowerCase().replace(/^mailto:/, '')
  // Remove any trailing query string or garbage
  email = email.split('?')[0].split('#')[0].trim()
  if (!/^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$/.test(email)) return

  // Filter obvious junk
  const junk = [
    /@(example|domain|yourdomain|test|localhost)\./,
    /@(sentry\.io|wixpress|jquery|w3\.org|schema\.org|googletagmanager)/,
    /\.(png|jpg|jpeg|gif|svg|webp|css|js|woff2?|ttf|ico)$/,
    /^(sentry|wixpress|no-reply|noreply|donotreply)@/,
  ]
  if (junk.some(re => re.test(email))) return

  // Drop sentry-style obfuscated keys
  if (email.length > 80) return
  emails.add(email)
}

function normalizePhone(raw) {
  if (!raw) return null
  // Keep digits + leading +
  let num = raw.replace(/[^\d+]/g, '')
  if (num.startsWith('+')) {
    // Must start with +47 to be Norwegian, or at least 10 digits international
    if (num.startsWith('+47')) num = num.slice(3)
    else if (num.length < 10) return null
    else return raw.replace(/[^\d+]/g, '') // keep as-is for other countries
  }
  // Norwegian numbers are 8 digits. Reject anything outside 7-9 range to avoid
  // catching org numbers (9 digits), dates, postnummer etc.
  // Actually Norwegian mobile/landline = 8 digits. Be strict.
  if (num.length === 8 && /^[2-9]/.test(num)) {
    // Format as "xx xx xx xx" for readability
    return num.replace(/(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4')
  }
  // Also accept 10-11 digit intl numbers (e.g. 004712345678)
  if (num.length >= 10 && num.length <= 13) return num
  return null
}
