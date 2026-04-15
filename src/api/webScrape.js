/**
 * Website scraping client — calls our Vercel serverless function.
 *
 * For a given company (with a known website URL), fetches homepage + contact
 * subpages and returns any emails/phones found. Used as a second-stage
 * enrichment after Brreg enrichment, to fill in gaps where Brreg doesn't
 * have contact info registered.
 */

export async function scrapeWebsite(website) {
  if (!website) return { website: '', emails: [], phones: [] }

  // Normalize — strip protocol for params, add back if needed
  const url = website.trim()

  try {
    const params = new URLSearchParams({ website: url })
    const res = await fetch(`/api/scrape-website?${params.toString()}`)
    if (!res.ok) throw new Error(`API ${res.status}`)
    return await res.json()
  } catch (err) {
    return { website: url, emails: [], phones: [], error: err.message }
  }
}

/**
 * Enrich a company with website-scraped contact info.
 *
 * - Only calls the scraper if the company has a website.
 * - Preserves existing Brreg data; only fills in email/phone if they're empty.
 * - Adds `webEmails`, `webPhones`, `webEnriched` flags so the UI can indicate
 *   additional contacts found from the website.
 */
export async function enrichWithWebsite(company) {
  if (!company.website) {
    return { ...company, webEnriched: true, webSkipped: 'no website' }
  }

  const result = await scrapeWebsite(company.website)

  const webEmails = (result.emails || []).filter(e => e && e !== company.email)
  const webPhones = (result.phones || []).filter(p => p && p !== company.phone)

  return {
    ...company,
    webEnriched: true,
    webEmails,
    webPhones,
    webPagesChecked: result.pagesChecked || [],
    webError: result.error || null,
    // Fill in blanks only — don't overwrite existing Brreg data
    email: company.email || result.emails?.[0] || '',
    phone: company.phone || result.phones?.[0] || '',
  }
}

/**
 * Enrich a batch of companies in parallel (bounded concurrency).
 */
export async function enrichBatchWithWebsite(companies, { concurrency = 4, onProgress } = {}) {
  const results = new Array(companies.length)
  let index = 0
  let done = 0

  async function worker() {
    while (index < companies.length) {
      const i = index++
      results[i] = await enrichWithWebsite(companies[i])
      done++
      if (onProgress) onProgress({ done, total: companies.length })
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, companies.length) }, worker)
  await Promise.all(workers)
  return results
}
