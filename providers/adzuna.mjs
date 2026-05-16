// @ts-check
/** @typedef {import('./_types.js').Provider} Provider */

// Adzuna provider — aggregator source covering listings that the
// ATS-direct providers (Greenhouse/Ashby/Lever) can't reach.
//
// Adzuna aggregates SEEK, Indeed, LinkedIn and direct-employer feeds.
// Useful in markets where target companies don't use the three big
// ATSes — AU enterprises (banks, telcos, retail, mining, gov) are a
// canonical example, but the same gap exists in most non-US markets.
//
// portals.yml shape (each entry is one search query):
//   tracked_companies:
//     - name: "Adzuna AU senior IT"
//       provider: adzuna
//       country: au              # ISO-2, default 'au'
//       keywords: "senior IT"    # required, maps to Adzuna `what`
//       location: Sydney         # optional, maps to `where`
//       distance: 30             # optional km radius
//       category: it-jobs        # optional Adzuna category id
//       salary_min: 150000       # optional minimum salary
//       results_per_page: 50     # 1-50, default 50 (Adzuna cap)
//       max_pages: 1             # 1-20, default 1
//       sort_by: date            # date|salary|relevance, default date
//
// Credentials: free app_id + app_key from developer.adzuna.com.
// Read from env: ADZUNA_APP_ID, ADZUNA_APP_KEY. If unset, fetch
// throws and scan.mjs reports the error per-entry without aborting.
//
// Free tier: 1000 requests/month. Each entry uses (max_pages) requests.

const API_BASE = 'https://api.adzuna.com/v1/api/jobs';
const ALLOWED_HOST = 'api.adzuna.com';
const MAX_RESULTS_PER_PAGE = 50;
const DEFAULT_RESULTS_PER_PAGE = 50;
const MAX_PAGES = 20;

function assertAdzunaUrl(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`adzuna: invalid URL: ${url}`);
  }
  if (parsed.protocol !== 'https:') throw new Error(`adzuna: URL must use HTTPS: ${url}`);
  if (parsed.hostname !== ALLOWED_HOST)
    throw new Error(`adzuna: untrusted hostname "${parsed.hostname}" — must be ${ALLOWED_HOST}`);
  return url;
}

function buildSearchUrl(entry, page, appId, appKey, perPage) {
  const country = (entry.country || 'au').toLowerCase();
  const params = new URLSearchParams();
  params.set('app_id', appId);
  params.set('app_key', appKey);
  params.set('results_per_page', String(perPage));
  if (entry.keywords) params.set('what', entry.keywords);
  if (entry.location) params.set('where', entry.location);
  if (typeof entry.distance === 'number' && entry.distance > 0)
    params.set('distance', String(entry.distance));
  if (entry.category) params.set('category', entry.category);
  if (typeof entry.salary_min === 'number' && entry.salary_min > 0)
    params.set('salary_min', String(entry.salary_min));
  params.set('sort_by', entry.sort_by || 'date');
  return `${API_BASE}/${country}/search/${page}?${params.toString()}`;
}

function parseResponse(json) {
  if (!json || typeof json !== 'object') return [];
  const results = Array.isArray(json.results) ? json.results : [];
  const jobs = [];
  for (const r of results) {
    if (!r || typeof r !== 'object') continue;

    let location = '';
    if (r.location && typeof r.location === 'object') {
      if (typeof r.location.display_name === 'string') location = r.location.display_name;
      else if (Array.isArray(r.location.area)) location = r.location.area.join(', ');
    } else if (typeof r.location === 'string') location = r.location;

    let company = '';
    if (r.company && typeof r.company === 'object') company = r.company.display_name || '';
    else if (typeof r.company === 'string') company = r.company;

    const title = typeof r.title === 'string' ? r.title : '';
    const url = typeof r.redirect_url === 'string' ? r.redirect_url : '';
    if (!url && !title) continue;

    jobs.push({ title, url, company, location });
  }
  return jobs;
}

/** @type {Provider} */
export default {
  id: 'adzuna',

  // No detect() — adzuna only handles entries with explicit `provider: adzuna`.

  async fetch(entry, ctx) {
    const appId = process.env.ADZUNA_APP_ID;
    const appKey = process.env.ADZUNA_APP_KEY;
    if (!appId || !appKey) {
      throw new Error(
        'adzuna: ADZUNA_APP_ID and ADZUNA_APP_KEY env vars required (free at developer.adzuna.com)',
      );
    }
    if (!entry.keywords || typeof entry.keywords !== 'string') {
      throw new Error(`adzuna: "${entry.name}" missing required \`keywords\` field`);
    }

    const maxPages = Math.max(1, Math.min(MAX_PAGES, entry.max_pages || 1));
    const perPage = Math.min(
      MAX_RESULTS_PER_PAGE,
      Math.max(1, entry.results_per_page || DEFAULT_RESULTS_PER_PAGE),
    );
    const allJobs = [];
    const seenUrls = new Set();

    for (let page = 1; page <= maxPages; page++) {
      const url = assertAdzunaUrl(buildSearchUrl(entry, page, appId, appKey, perPage));
      let json;
      try {
        json = await ctx.fetchJson(url, { headers: { Accept: 'application/json' }, redirect: 'error' });
      } catch (err) {
        if (err.status === 401 || err.status === 403) {
          throw new Error(`adzuna: credentials rejected (HTTP ${err.status}) — check ADZUNA_APP_ID/ADZUNA_APP_KEY`);
        }
        if (err.status === 429) {
          throw new Error(`adzuna: rate-limited (HTTP 429) — back off or wait until next month's quota`);
        }
        throw err;
      }

      const pageJobs = parseResponse(json);
      let newOnPage = 0;
      for (const j of pageJobs) {
        if (!j.url || seenUrls.has(j.url)) continue;
        seenUrls.add(j.url);
        allJobs.push(j);
        newOnPage++;
      }
      if (pageJobs.length === 0 || newOnPage === 0) break;
      if (pageJobs.length < perPage) break;
    }

    return allJobs;
  },
};
