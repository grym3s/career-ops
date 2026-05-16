// @ts-check
/** @typedef {import('./_types.js').Provider} Provider */

// LinkedIn guest-search provider — aggregator source for postings indexed
// on LinkedIn's public, unauthenticated guest endpoint:
//   https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search
//
// PRIVATE-FORK ONLY. Do NOT PR upstream — santifer/career-ops CONTRIBUTING
// rejects LinkedIn scraping. Keep this in your personal fork.
//
// Risks:
//   - LinkedIn rate-limits aggressively (429 / 451 / 999 responses)
//   - Automated access technically breaches LinkedIn ToS — keep volume
//     personal-scale (a few scans per day) and accept IP-block risk
//   - Class names in the returned HTML drift; parser is defensive but
//     may need tweaks if results stop appearing
//
// portals.yml shape (each entry is one search query):
//   tracked_companies:
//     - name: "LinkedIn senior IT Sydney"
//       provider: linkedin-guest
//       keywords: "senior IT"      # required
//       location_text: Sydney      # optional, free-text location
//       geo_id: 102257491          # optional, LinkedIn's geo URN id
//       time_range: r604800        # optional, e.g. r604800 = last 7 days
//       max_pages: 2               # 1-20, default 1 (25 results each)
//
// No credentials — endpoint is public. Custom User-Agent is required;
// without it LinkedIn often returns empty results or 403s.

const GUEST_SEARCH_URL =
  'https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search';

export const PAGE_SIZE = 25;
export const RATE_LIMIT_STATUSES = new Set([429, 451, 999]);
const MAX_PAGES = 20;

const DEFAULT_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

// ── Parser helpers ─────────────────────────────────────────────────

function decodeEntities(str) {
  if (!str) return '';
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#x2F;/g, '/');
}

function tidy(str) {
  return decodeEntities(str || '').replace(/\s+/g, ' ').trim();
}

function pick(html, regex) {
  const m = html.match(regex);
  return m ? tidy(m[1]) : null;
}

/**
 * Parse the HTML fragment returned by seeMoreJobPostings/search into
 * job records. Exported for unit tests.
 *
 * Segmentation: split on `data-entity-urn="urn:li:jobPosting:` which is
 * more resilient to class-name drift than splitting on `<li>`.
 *
 * @param {string} html
 * @returns {Array<{title: string, url: string, company: string, location: string}>}
 */
export function parseJobCardsHTML(html) {
  if (typeof html !== 'string' || html.length === 0) return [];

  const parts = html.split(/data-entity-urn="urn:li:jobPosting:/);
  if (parts.length < 2) return [];

  const jobs = [];
  for (let i = 1; i < parts.length; i++) {
    const chunk = parts[i];

    const idMatch = chunk.match(/^(\d+)"/);
    const jobId = idMatch ? idMatch[1] : null;

    let url = pick(chunk, /base-card__full-link[^>]*href="([^"]+)"/i);
    if (!url) {
      url = pick(chunk, /href="(https:\/\/[^"]*linkedin\.com\/jobs\/view\/[^"]+)"/i);
    }
    if (!url && jobId) url = `https://www.linkedin.com/jobs/view/${jobId}`;
    if (url) url = url.replace(/\?.*$/, ''); // strip tracking query string

    const title =
      pick(chunk, /class="base-search-card__title"[^>]*>([\s\S]*?)<\/h3>/i) ||
      pick(chunk, /class="[^"]*base-search-card__title[^"]*"[^>]*>([\s\S]*?)<\//i) ||
      pick(chunk, /<span class="sr-only">([\s\S]*?)<\/span>/i);

    const company =
      pick(chunk, /class="base-search-card__subtitle"[^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/i) ||
      pick(chunk, /class="base-search-card__subtitle"[^>]*>([\s\S]*?)<\/h4>/i);

    const location = pick(chunk, /class="job-search-card__location"[^>]*>([\s\S]*?)<\/span>/i);

    if (!url && !title) continue;

    jobs.push({
      title: title || '',
      url: url || '',
      company: company || '',
      location: location || '',
    });
  }

  return jobs;
}

/**
 * Build the guest-search URL for a given entry + offset.
 *
 * @param {object} entry
 * @param {number} start  Offset (0, 25, 50, …)
 */
export function buildSearchUrl(entry, start = 0) {
  const params = new URLSearchParams();
  if (entry.keywords) params.set('keywords', entry.keywords);
  if (entry.location_text) params.set('location', entry.location_text);
  if (entry.geo_id) params.set('geoId', String(entry.geo_id));
  if (entry.time_range) params.set('f_TPR', entry.time_range);
  params.set('start', String(start));
  return `${GUEST_SEARCH_URL}?${params.toString()}`;
}

// ── Provider ───────────────────────────────────────────────────────

/** @type {Provider} */
export default {
  id: 'linkedin-guest',

  // No detect() — only handles entries with explicit `provider: linkedin-guest`.

  async fetch(entry, ctx) {
    if (!entry.keywords || typeof entry.keywords !== 'string') {
      throw new Error(`linkedin-guest: "${entry.name}" missing required \`keywords\` field`);
    }

    const maxPages = Math.max(1, Math.min(MAX_PAGES, entry.max_pages || 1));
    const userAgent = entry.user_agent || DEFAULT_UA;
    const allJobs = [];
    const seenKeys = new Set();

    for (let page = 0; page < maxPages; page++) {
      const start = page * PAGE_SIZE;
      const url = buildSearchUrl(entry, start);

      let html;
      try {
        html = await ctx.fetchText(url, {
          headers: {
            'user-agent': userAgent,
            Accept: 'text/html,application/xhtml+xml',
            'Accept-Language': 'en-US,en;q=0.9',
          },
        });
      } catch (err) {
        if (RATE_LIMIT_STATUSES.has(err.status)) {
          throw new Error(`linkedin-guest: rate-limited (HTTP ${err.status}) — back off`);
        }
        throw err;
      }

      const pageJobs = parseJobCardsHTML(html);
      let newOnPage = 0;
      for (const j of pageJobs) {
        const key = j.url || `${j.company}::${j.title}`;
        if (!key || seenKeys.has(key)) continue;
        seenKeys.add(key);
        allJobs.push(j);
        newOnPage++;
      }
      if (pageJobs.length === 0 || newOnPage === 0) break;
      if (pageJobs.length < PAGE_SIZE) break;
    }

    return allJobs;
  },
};
