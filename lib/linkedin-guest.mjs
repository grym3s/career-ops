/**
 * lib/linkedin-guest.mjs — LinkedIn guest-search API client
 *
 * PRIVATE FORK ONLY. Do NOT push upstream to santifer/career-ops —
 * that repo's CONTRIBUTING.md explicitly rejects LinkedIn scraping PRs.
 *
 * This module wraps LinkedIn's unauthenticated public guest endpoint
 *   https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search
 * which serves an HTML fragment (not JSON) of job cards to logged-out
 * visitors. The endpoint is used by the public website itself, so no
 * auth, API key, or circumvention is involved.
 *
 * Risks (see memory/reference_linkedin_integration_options.md):
 *   - LinkedIn rate-limits aggressively (429 / 451 / 999 responses)
 *   - Automated access technically breaches LinkedIn ToS — keep volume
 *     personal-scale (a few scans per day) and accept IP-block risk
 *   - Class names in the returned HTML drift occasionally; parser is
 *     written defensively but may need tweaks if results stop appearing
 *
 * Parser strategy:
 *   We use hand-rolled regex rather than a DOM parser because
 *   career-ops already avoids adding dependencies (package.json has
 *   only js-yaml + playwright). The fragments are small and uniform
 *   enough that regex is practical. If the parser gets fragile, drop
 *   in `node-html-parser` and swap `parseJobCardsHTML` internals.
 *
 * Public API:
 *   fetchLinkedInGuestJobs(search, options) → Promise<Job[]>
 *   parseJobCardsHTML(html) → Job[]          // exported for tests
 *   LinkedInGuestError                         // custom error class
 *
 * Where Job = { title, company, location, url, postedAt, source }
 * matching the shape the existing PARSERS in scan.mjs return (plus
 * `postedAt` which LinkedIn gives us for free).
 */

const GUEST_SEARCH_URL =
  'https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search';

const PAGE_SIZE = 25;

// LinkedIn signals rate-limiting / blocking with these statuses.
// 429 = Too Many Requests, 451 = Unavailable For Legal Reasons,
// 999 = LinkedIn's custom "you look like a bot" status.
const RATE_LIMIT_STATUSES = new Set([429, 451, 999]);

export class LinkedInGuestError extends Error {
  constructor(message, { status, code, cause } = {}) {
    super(message);
    this.name = 'LinkedInGuestError';
    this.status = status ?? null;
    // code ∈ 'rate-limit' | 'http' | 'network' | 'parse' | 'bad-input'
    this.code = code ?? 'unknown';
    if (cause) this.cause = cause;
  }
}

// ── HTML entity decode (minimal, covers the entities LinkedIn emits) ──
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

// Collapse all runs of whitespace (incl. newlines) into a single space.
function tidy(str) {
  return decodeEntities(str || '').replace(/\s+/g, ' ').trim();
}

// Pull the first capture of `regex` from `html`, or null.
function pick(html, regex) {
  const m = html.match(regex);
  return m ? tidy(m[1]) : null;
}

/**
 * Parse the HTML fragment returned by seeMoreJobPostings/search into
 * an array of job objects. Exported for unit tests.
 *
 * Segmentation strategy:
 *   Each job is anchored by `<li>` or by `data-entity-urn="urn:li:jobPosting:..."`.
 *   We split on the data-entity-urn attribute to bound each card, which
 *   is more resilient to class-name drift than splitting on `<li>`.
 *
 * @param {string} html
 * @returns {Array<{title: string, company: string, location: string, url: string, postedAt: string|null, jobId: string|null}>}
 */
export function parseJobCardsHTML(html) {
  if (typeof html !== 'string' || html.length === 0) return [];

  // Split on the job-posting URN. The first chunk is the prelude and has
  // no URN, so it's discarded. Each subsequent chunk starts AT the URN.
  const parts = html.split(/data-entity-urn="urn:li:jobPosting:/);
  if (parts.length < 2) return [];

  const jobs = [];
  for (let i = 1; i < parts.length; i++) {
    const chunk = parts[i];

    // Job ID is everything up to the closing quote.
    const idMatch = chunk.match(/^(\d+)"/);
    const jobId = idMatch ? idMatch[1] : null;

    // URL: prefer the base-card__full-link anchor, fall back to the
    // LinkedIn canonical job-view URL constructed from jobId.
    let url = pick(chunk, /base-card__full-link[^>]*href="([^"]+)"/i);
    if (!url) {
      // Some cards have a different anchor class; accept any href that
      // points at a LinkedIn jobs/view page.
      url = pick(chunk, /href="(https:\/\/[^"]*linkedin\.com\/jobs\/view\/[^"]+)"/i);
    }
    if (!url && jobId) {
      url = `https://www.linkedin.com/jobs/view/${jobId}`;
    }

    // Strip LinkedIn's tracking query string so dedup works across scans.
    if (url) url = url.replace(/\?.*$/, '');

    const title =
      pick(chunk, /class="base-search-card__title"[^>]*>([\s\S]*?)<\/h3>/i) ||
      pick(chunk, /class="[^"]*base-search-card__title[^"]*"[^>]*>([\s\S]*?)<\//i) ||
      pick(chunk, /<span class="sr-only">([\s\S]*?)<\/span>/i);

    const company =
      pick(chunk, /class="base-search-card__subtitle"[^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/i) ||
      pick(chunk, /class="base-search-card__subtitle"[^>]*>([\s\S]*?)<\/h4>/i);

    const location = pick(
      chunk,
      /class="job-search-card__location"[^>]*>([\s\S]*?)<\/span>/i,
    );

    const postedAt =
      pick(chunk, /<time[^>]*datetime="([^"]+)"/i) || null;

    // Skip completely empty cards. A card needs AT LEAST a URL or a
    // title to be worth keeping — everything else we can fake.
    if (!url && !title) continue;

    jobs.push({
      jobId,
      title: title || '',
      company: company || '',
      location: location || '',
      url: url || '',
      postedAt,
    });
  }

  return jobs;
}

/**
 * Build the guest-search URL for a given search.
 * @param {{keywords: string, geoId?: string, locationText?: string, timeRange?: string}} search
 * @param {number} start
 */
export function buildSearchUrl(search, start = 0) {
  const params = new URLSearchParams();
  if (search.keywords) params.set('keywords', search.keywords);
  if (search.locationText) params.set('location', search.locationText);
  if (search.geoId) params.set('geoId', String(search.geoId));
  if (search.timeRange) params.set('f_TPR', search.timeRange);
  params.set('start', String(start));
  return `${GUEST_SEARCH_URL}?${params.toString()}`;
}

const DEFAULT_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Fetch job results from the LinkedIn guest-search endpoint.
 *
 * Offline / test mode: if `options.mockResponse` is provided, it is
 * used instead of a real HTTP request. `mockResponse` may be either:
 *   - a string (used as the HTML body for every page)
 *   - an array of strings (one body per page, consumed in order)
 *   - a function `(url, pageIndex) => { status, body }` for full control
 *     (throw a LinkedInGuestError from the function to simulate errors)
 *
 * @param {{keywords: string, geoId?: string, locationText?: string, timeRange?: string, maxPages?: number}} search
 * @param {{userAgent?: string, requestDelayMs?: number, fetchImpl?: typeof fetch, mockResponse?: any, signal?: AbortSignal}} options
 * @returns {Promise<Array>}
 */
export async function fetchLinkedInGuestJobs(search, options = {}) {
  if (!search || typeof search !== 'object') {
    throw new LinkedInGuestError('search object is required', { code: 'bad-input' });
  }
  if (!search.keywords || typeof search.keywords !== 'string') {
    throw new LinkedInGuestError('search.keywords is required', { code: 'bad-input' });
  }

  const {
    userAgent = DEFAULT_UA,
    requestDelayMs = 5000,
    fetchImpl = globalThis.fetch,
    mockResponse = null,
    signal,
  } = options;

  const maxPages = Math.max(1, Math.min(20, search.maxPages || 1));
  const allJobs = [];
  const seenJobIds = new Set();

  for (let page = 0; page < maxPages; page++) {
    const start = page * PAGE_SIZE;
    const url = buildSearchUrl(search, start);

    let status = 200;
    let body = '';

    if (mockResponse !== null) {
      // ── Mock mode: never touch the network ──
      if (typeof mockResponse === 'function') {
        const result = await mockResponse(url, page);
        status = result?.status ?? 200;
        body = result?.body ?? '';
      } else if (Array.isArray(mockResponse)) {
        body = mockResponse[page] ?? '';
        status = 200;
      } else {
        body = String(mockResponse);
        status = 200;
      }
    } else {
      // ── Live mode ──
      if (typeof fetchImpl !== 'function') {
        throw new LinkedInGuestError('No fetch implementation available', {
          code: 'network',
        });
      }
      try {
        const res = await fetchImpl(url, {
          headers: {
            'User-Agent': userAgent,
            Accept: 'text/html,application/xhtml+xml',
            'Accept-Language': 'en-US,en;q=0.9',
          },
          signal,
        });
        status = res.status;
        if (RATE_LIMIT_STATUSES.has(status)) {
          throw new LinkedInGuestError(
            `LinkedIn rate-limited the request (HTTP ${status})`,
            { status, code: 'rate-limit' },
          );
        }
        if (!res.ok) {
          throw new LinkedInGuestError(`HTTP ${status} from LinkedIn guest API`, {
            status,
            code: 'http',
          });
        }
        body = await res.text();
      } catch (err) {
        if (err instanceof LinkedInGuestError) throw err;
        throw new LinkedInGuestError(`Network error: ${err.message}`, {
          code: 'network',
          cause: err,
        });
      }
    }

    let pageJobs;
    try {
      pageJobs = parseJobCardsHTML(body);
    } catch (err) {
      throw new LinkedInGuestError(`Failed to parse LinkedIn HTML: ${err.message}`, {
        code: 'parse',
        cause: err,
      });
    }

    // Dedup within the scan — LinkedIn paginates inconsistently and
    // sometimes repeats results across pages.
    let newOnPage = 0;
    for (const j of pageJobs) {
      const key = j.jobId || j.url;
      if (!key || seenJobIds.has(key)) continue;
      seenJobIds.add(key);
      allJobs.push({ ...j, source: 'linkedin-guest' });
      newOnPage++;
    }

    // Short page → no more results → stop paginating
    if (pageJobs.length === 0 || newOnPage === 0) break;
    if (pageJobs.length < PAGE_SIZE) break;

    // Polite delay between pages, only in real/live mode
    if (page + 1 < maxPages && mockResponse === null && requestDelayMs > 0) {
      await sleep(requestDelayMs);
    }
  }

  return allJobs;
}

export const __test = {
  buildSearchUrl,
  decodeEntities,
  tidy,
  RATE_LIMIT_STATUSES,
  PAGE_SIZE,
};
