# providers/ — job-portal API clients

Provider modules used by `scan.mjs` (eventually `agents/scanner/runners/scan.mjs`). Each provider hits one ATS's public board API directly — no LLM in the loop, zero token cost.

## Files

| File | What |
|---|---|
| `_http.mjs` | Shared HTTP plumbing (fetch wrapper, rate-limit handling, retries) |
| `greenhouse.mjs` | Greenhouse public board API |
| `ashby.mjs` | Ashby public API |
| `lever.mjs` | Lever public API |

## Adding a new provider

1. Drop `{name}.mjs` here that exports `async function fetchJobs(companyConfig)` and returns `[{ title, url, location, postedAt, ... }]`.
2. Reuse `_http.mjs` for the request; don't roll your own fetch.
3. Register the provider in `portals.yml` (companies list will pick by `provider:` field).
4. Add a smoke test to `scan.mjs` if the API has unusual auth or pagination.

## After Phase 4

This folder moves into `agents/scanner/providers/` — colocated with the scanner that uses it.

## Related

- The scanner that consumes these → `scan.mjs` (today) / `agents/scanner/` (after Phase 4)
- Per-company config that picks a provider → `portals.yml` (user layer)
