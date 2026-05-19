# agents/scanner/ — zero-token portal scanner

Zero-LLM, zero-token scanner that polls public ATS APIs (Greenhouse, Ashby, Lever) directly and writes new offer URLs to `data/pipeline.md` for downstream evaluation. The cheapest agent in the system — no token cost, no Claude invocation, pure HTTP + JSON.

## Folder layout

```
agents/scanner/
├─ CONTEXT.md     (this file)               — the contract
├─ prompt.md                                — AI skill prompt (was modes/scan.md)
├─ runners/
│  └─ scan.mjs                              — main script (was ./scan.mjs at root)
├─ providers/                               — ATS API clients (was ./providers/ at root)
│  ├─ CONTEXT.md
│  ├─ _http.mjs                             — shared HTTP plumbing
│  ├─ _types.js                             — JSDoc type catalog
│  ├─ greenhouse.mjs
│  ├─ ashby.mjs
│  └─ lever.mjs
├─ examples/                                — empty until first run
└─ evals/                                   — feedback on filter quality / false positives
```

**Inputs.**
- `portals.yml` (user layer) — company list with provider type, careers URL, filters, location filter (PR #570).
- `data/scan-history.tsv` — per-URL fingerprints so we don't re-surface seen offers.
- `--dry-run` flag for preview without writing.
- `--company {name}` flag for single-company scan.

**Outputs.**
- New offer URLs appended to `data/pipeline.md`.
- Updated fingerprints in `data/scan-history.tsv`.
- Console summary: scanned N companies, found M new offers.

**Dependencies.**
- External: HTTP to Greenhouse/Ashby/Lever public board APIs. No auth. No Claude.
- Internal: `providers/*.mjs` plugin-based — drop a new provider in the folder and it auto-loads (no `scan.mjs` edits).
- Composes with: `agents/evaluator/` (the next agent in the chain — reads `data/pipeline.md`).

**Provider plugin contract.** Each `providers/*.mjs` exports a default object with:
- `id: string` — matched against `provider:` in `portals.yml`.
- `detect(entry): {url} | null` — optional auto-detection from a careers_url.
- `fetch(entry, ctx): [{title, url, company, location}]` — required.

Files prefixed with `_` (e.g. `_http.mjs`, `_types.js`) are shared helpers, not providers.

**Failure modes.**

| Failure | What it means | Fix |
|---|---|---|
| 0 providers loaded | None of the .mjs files in `providers/` had a valid default export | Check provider exports the contract above |
| `js-yaml` not found | `npm install` hasn't been run | `npm install` from the repo root |
| 429 from provider API | Rate-limited | `_http.mjs` retries with backoff; if persistent, lower `CONCURRENCY` |
| Provider's company not in portals.yml | Skipped | Add company to portals.yml with `provider:` field |

**When to invoke.**
- User says "scan", "scan for new offers", "check portals", "/career-ops scan".
- Cron / scheduled task firing periodically (e.g., every 3 days per AGENTS.md onboarding suggestion).
- During pipeline drain when the inbox is empty and you want to refill.

**When NOT to invoke.**
- User wants to evaluate a SPECIFIC URL they pasted — that's `agents/evaluator/`.
- User wants deep company research — that's `agents/deep-research/`.

## How to invoke

```bash
node agents/scanner/runners/scan.mjs               # scan all enabled companies
node agents/scanner/runners/scan.mjs --dry-run     # preview
node agents/scanner/runners/scan.mjs --company Cohere   # single company

# Legacy shims (still work during migration):
node scan.mjs                                       # → forwards to agents/scanner/runners/scan.mjs
npm run scan                                        # → same
```

## Adding a new portal

1. Drop `providers/{name}.mjs` exporting the contract above.
2. Add the company to `portals.yml` with `provider: {name}`.
3. No `scan.mjs` edits needed — providers auto-load.

## Related

- The skill prompt (Spanish — language is preserved from upstream) → `prompt.md`
- The main runner → `runners/scan.mjs`
- The provider plugins → `providers/`
- The queue this writes to → `data/pipeline.md`
- The next agent in the chain → `agents/evaluator/` (consumes the queue)
- Localized scanner prompts (will become locale overlays in Phase 6) → `modes/{de,fr,ja,ru,tr}/` (none specifically translated yet; scan is English-mode-only today)
