/**
 * lib/adzuna.mjs — Adzuna Jobs API client
 *
 * Wraps the Adzuna public Jobs API:
 *   https://api.adzuna.com/v1/api/jobs/{country}/search/{page}
 *
 * Adzuna aggregates listings from many sources (SEEK feed, Indeed feed,
 * LinkedIn feed, direct employer feeds, job-board partners). For an
 * Australia-based senior IT job search this gives coverage that
 * scan.mjs' ATS-direct approach (Greenhouse / Ashby / Lever) cannot
 * reach — most AU enterprises (banks, telcos, retail, mining, gov)
 * don't use those three ATSes and so stay invisible to the direct-API
 * scanner no matter how many companies you enumerate.
 *
 * Credentials: Adzuna issues a free app_id + app_key on signup at
 * https://developer.adzuna.com. Free tier is 1000 requests/month,
 * which is plenty for personal-scale daily scans (each scan uses one
 * request per search query, per page).
 *
 * DO commit this module to the shared fork — it's a first-party public
 * API with explicit developer terms, unlike the LinkedIn guest module
 * (which stays private-fork-only per santifer/career-ops CONTRIBUTING).
 *
 * Public API:
 *   fetchAdzunaJobs(search, options) → Promise<Job[]>
 *   parseAdzunaResponse(json) → Job[]       // exported for tests
 *   AdzunaError                              // custom error class
 *
 * Job shape: { title, company, location, url, postedAt, source, jobId,
 *              salaryMin, salaryMax, snippet }
 * (matching the PARSERS output in scan.mjs plus a few Adzuna extras)
 */

const API_BASE = 'https://api.adzuna.com/v1/api/jobs';

// Adzuna caps results_per_page at 50. Going higher silently clamps.
const MAX_RESULTS_PER_PAGE = 50;
const DEFAULT_RESULTS_PER_PAGE = 50;

// Adzuna rate-limits return 429. 401/403 means bad credentials.
const RATE_LIMIT_STATUSES = new Set([429]);
const AUTH_FAIL_STATUSES = new Set([401, 403]);

export class AdzunaError extends Error {
  constructor(message, { status, code, cause } = {}) {
    super(message);
    this.name = 'AdzunaError';
    this.status = status ?? null;
    // code ∈ 'rate-limit' | 'auth' | 'http' | 'network' | 'parse' | 'bad-input'
    this.code = code ?? 'unknown';
    if (cause) this.cause = cause;
  }
}

// ── Parser ──────────────────────────────────────────────────────────

/**
 * Parse the JSON body returned by /v1/api/jobs/{country}/search/{page}
 * into the canonical Job shape used by scan.mjs.
 *
 * Defensive: any missing / malformed field becomes '' or null so the
 * downstream filter pipeline never crashes on partial records.
 *
 * @param {object} json
 * @returns {Array<{title: string, company: string, location: string, url: string, postedAt: string|null, jobId: string|null, salaryMin: number|null, salaryMax: number|null, snippet: string}>}
 */
export function parseAdzunaResponse(json) {
  if (!json || typeof json !== 'object') return [];
  const results = Array.isArray(json.results) ? json.results : [];
  const jobs = [];

  for (const r of results) {
    if (!r || typeof r !== 'object') continue;

    // Location: Adzuna returns { area: [...], display_name: "..." }.
    // display_name is the human-readable single string we want.
    let location = '';
    if (r.location && typeof r.location === 'object') {
      if (typeof r.location.display_name === 'string') {
        location = r.location.display_name;
      } else if (Array.isArray(r.location.area) && r.location.area.length > 0) {
        location = r.location.area.join(', ');
      }
    } else if (typeof r.location === 'string') {
      location = r.location;
    }

    // Company: { display_name: "..." }
    let company = '';
    if (r.company && typeof r.company === 'object') {
      company = typeof r.company.display_name === 'string' ? r.company.display_name : '';
    } else if (typeof r.company === 'string') {
      company = r.company;
    }

    const title = typeof r.title === 'string' ? r.title : '';
    const url = typeof r.redirect_url === 'string' ? r.redirect_url : '';
    const postedAt = typeof r.created === 'string' ? r.created : null;
    const jobId = r.id != null ? String(r.id) : null;

    const salaryMin = typeof r.salary_min === 'number' ? r.salary_min : null;
    const salaryMax = typeof r.salary_max === 'number' ? r.salary_max : null;
    const snippet = typeof r.description === 'string' ? r.description : '';

    // Skip empty records — need at least a URL or a title to be useful.
    if (!url && !title) continue;

    jobs.push({
      title,
      company,
      location,
      url,
      postedAt,
      jobId,
      salaryMin,
      salaryMax,
      snippet,
    });
  }

  return jobs;
}

// ── URL builder ─────────────────────────────────────────────────────

/**
 * Build the Adzuna search URL for a given query + page.
 *
 * @param {{keywords: string, country?: string, location?: string, distance?: number, category?: string, salaryMin?: number, resultsPerPage?: number, sortBy?: string}} search
 * @param {number} page 1-indexed page number (Adzuna uses 1-based paging)
 * @param {{appId: string, appKey: string}} credentials
 * @returns {string}
 */
export function buildSearchUrl(search, page, credentials) {
  const country = (search.country || 'au').toLowerCase();
  const pageNum = Math.max(1, Math.floor(page));
  const params = new URLSearchParams();
  params.set('app_id', credentials.appId);
  params.set('app_key', credentials.appKey);

  const perPage = Math.min(
    MAX_RESULTS_PER_PAGE,
    Math.max(1, search.resultsPerPage || DEFAULT_RESULTS_PER_PAGE),
  );
  params.set('results_per_page', String(perPage));

  if (search.keywords) params.set('what', search.keywords);
  if (search.location) params.set('where', search.location);
  if (typeof search.distance === 'number' && search.distance > 0) {
    params.set('distance', String(search.distance));
  }
  if (search.category) params.set('category', search.category);
  if (typeof search.salaryMin === 'number' && search.salaryMin > 0) {
    params.set('salary_min', String(search.salaryMin));
  }
  // Adzuna supports sort_by=date|salary|relevance. Default to date so
  // we get the freshest listings first — makes pagination cutoff safer.
  params.set('sort_by', search.sortBy || 'date');
  // Exclude duplicate reposts of the same listing from different sources.
  params.set('content-type', 'application/json');

  return `${API_BASE}/${country}/search/${pageNum}?${params.toString()}`;
}

// ── Fetch orchestrator ──────────────────────────────────────────────

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Fetch jobs from Adzuna for a single search, paginating up to maxPages.
 *
 * Offline / test mode: if `options.mockResponse` is provided, it is
 * used instead of a real HTTP request. Same contract as linkedin-guest:
 *   - a plain object (same body for every page)
 *   - an array of objects (one per page, consumed in order)
 *   - a function (url, pageIndex) => { status, body } for full control
 *
 * @param {{keywords: string, country?: string, location?: string, distance?: number, maxPages?: number, category?: string, salaryMin?: number, resultsPerPage?: number, sortBy?: string}} search
 * @param {{appId: string, appKey: string, requestDelayMs?: number, fetchImpl?: typeof fetch, mockResponse?: any, signal?: AbortSignal}} options
 * @returns {Promise<Array>}
 */
export async function fetchAdzunaJobs(search, options = {}) {
  if (!search || typeof search !== 'object') {
    throw new AdzunaError('search object is required', { code: 'bad-input' });
  }
  if (!search.keywords || typeof search.keywords !== 'string') {
    throw new AdzunaError('search.keywords is required', { code: 'bad-input' });
  }

  const {
    appId,
    appKey,
    requestDelayMs = 1000,
    fetchImpl = globalThis.fetch,
    mockResponse = null,
    signal,
  } = options;

  if (mockResponse === null) {
    if (!appId || !appKey) {
      throw new AdzunaError(
        'appId and appKey are required (set ADZUNA_APP_ID and ADZUNA_APP_KEY env vars)',
        { code: 'auth' },
      );
    }
  }

  const maxPages = Math.max(1, Math.min(20, search.maxPages || 1));
  const credentials = { appId: appId || '', appKey: appKey || '' };
  const allJobs = [];
  const seenJobIds = new Set();

  for (let page = 0; page < maxPages; page++) {
    const pageNum = page + 1; // Adzuna is 1-indexed
    const url = buildSearchUrl(search, pageNum, credentials);

    let status = 200;
    let body = null;

    if (mockResponse !== null) {
      // ── Mock mode: never touch the network ──
      if (typeof mockResponse === 'function') {
        const result = await mockResponse(url, page);
        status = result?.status ?? 200;
        body = result?.body ?? {};
      } else if (Array.isArray(mockResponse)) {
        body = mockResponse[page] ?? {};
        status = 200;
      } else {
        body = mockResponse;
        status = 200;
      }
    } else {
      // ── Live mode ──
      if (typeof fetchImpl !== 'function') {
        throw new AdzunaError('No fetch implementation available', { code: 'network' });
      }
      try {
        const res = await fetchImpl(url, {
          headers: {
            Accept: 'application/json',
            'User-Agent': 'career-ops/1.0 (+https://github.com/santifer/career-ops)',
          },
          signal,
        });
        status = res.status;
        if (AUTH_FAIL_STATUSES.has(status)) {
          throw new AdzunaError(
            `Adzuna rejected credentials (HTTP ${status}) — check ADZUNA_APP_ID / ADZUNA_APP_KEY`,
            { status, code: 'auth' },
          );
        }
        if (RATE_LIMIT_STATUSES.has(status)) {
          throw new AdzunaError(
            `Adzuna rate-limited the request (HTTP ${status})`,
            { status, code: 'rate-limit' },
          );
        }
        if (!res.ok) {
          throw new AdzunaError(`HTTP ${status} from Adzuna Jobs API`, {
            status,
            code: 'http',
          });
        }
        try {
          body = await res.json();
        } catch (parseErr) {
          throw new AdzunaError(`Failed to parse Adzuna JSON: ${parseErr.message}`, {
            code: 'parse',
            cause: parseErr,
          });
        }
      } catch (err) {
        if (err instanceof AdzunaError) throw err;
        throw new AdzunaError(`Network error: ${err.message}`, {
          code: 'network',
          cause: err,
        });
      }
    }

    let pageJobs;
    try {
      pageJobs = parseAdzunaResponse(body);
    } catch (err) {
      throw new AdzunaError(`Failed to parse Adzuna response: ${err.message}`, {
        code: 'parse',
        cause: err,
      });
    }

    // Dedup within the scan — shouldn't happen with sort_by=date, but be safe.
    let newOnPage = 0;
    for (const j of pageJobs) {
      const key = j.jobId || j.url;
      if (!key || seenJobIds.has(key)) continue;
      seenJobIds.add(key);
      allJobs.push({ ...j, source: 'adzuna' });
      newOnPage++;
    }

    // Short page → no more results → stop paginating
    if (pageJobs.length === 0 || newOnPage === 0) break;
    const resultsPerPage = Math.min(
      MAX_RESULTS_PER_PAGE,
      Math.max(1, search.resultsPerPage || DEFAULT_RESULTS_PER_PAGE),
    );
    if (pageJobs.length < resultsPerPage) break;

    // Polite delay between paginated requests (free tier is ~25/min)
    if (page + 1 < maxPages && mockResponse === null && requestDelayMs > 0) {
      await sleep(requestDelayMs);
    }
  }

  return allJobs;
}

export const __test = {
  buildSearchUrl,
  RATE_LIMIT_STATUSES,
  AUTH_FAIL_STATUSES,
  MAX_RESULTS_PER_PAGE,
  DEFAULT_RESULTS_PER_PAGE,
};
