# agents/tracker/ — applications ledger maintenance

Owns `data/applications.md` — the master tracker for every offer evaluated, applied to, or rejected. Reads / writes / dedupes / normalizes / verifies the ledger.

## Folder layout

```
agents/tracker/
├─ CONTEXT.md     (this file)
├─ prompt.md      — query / update skill prompt (was modes/tracker.md)
├─ runners/       — empty until Phase 7 (scripts still at root)
├─ examples/
└─ evals/
```

**Runners (still at repo root pending Phase 7).** All four use `dirname(fileURLToPath(import.meta.url))` for path resolution to `data/applications.md`, `batch/tracker-additions/`, `templates/states.yml`.
- `merge-tracker.mjs` — Folds `batch/tracker-additions/*.tsv` into `data/applications.md`. Handles col-5/col-6 swap.
- `dedup-tracker.mjs` — Removes duplicate rows by (company, role).
- `normalize-statuses.mjs` — Forces statuses to the canonical set in `templates/states.yml`.
- `verify-pipeline.mjs` — Health check: reports have `**URL:**`, statuses are canonical, no dupes.

**Inputs.**
- `data/applications.md` — the ledger (user layer, gitignored).
- `batch/tracker-additions/*.tsv` — pending merges from batch workers.
- `templates/states.yml` — canonical status enum.

**Outputs.**
- `data/applications.md` updated (merged / deduped / normalized).
- Health report to stdout (verify-pipeline).

**Dependencies.**
- Internal: `templates/states.yml` (canonical statuses), `reports/` (verify-pipeline cross-references).
- Composes with: `agents/evaluator/` (writes Evaluated rows), `workflows/batch-pipeline/` (writes via TSVs).

**Failure modes.**

| Failure | Fix |
|---|---|
| Non-canonical status appears in row | `node normalize-statuses.mjs` |
| Duplicate row (same company+role) | `node dedup-tracker.mjs` |
| TSV has wrong column order | Check `batch-prompt.md` "TSV Format" section in AGENTS.md |
| Report referenced in tracker missing | `node verify-pipeline.mjs` will surface this |

**When to invoke.**
- User asks "what's the status of X?" / "how many apps so far?" / "what's in tracker?"
- After a batch run completes → `node merge-tracker.mjs`.
- Periodic health check → `node verify-pipeline.mjs`.

**When NOT to invoke.**
- User wants to see one specific evaluation — read `reports/{###}-{slug}-*.md` directly.
- User wants a dashboard view — use `dashboard/` (Go TUI).

## Critical editing rules

1. **Never create NEW entries by hand-editing** `applications.md`. Batch workers write TSVs to `batch/tracker-additions/`; `merge-tracker.mjs` folds them in.
2. You MAY edit existing entries to update status / notes / score.
3. Statuses MUST be from `templates/states.yml`. No bold, no dates in status column, no extra text.

See `AGENTS.md` "Canonical States" + "TSV Format" sections for the contract.

## Related

- The ledger this owns → `data/applications.md`
- The dashboard that visualizes the ledger → `dashboard/`
- The canonical status enum → `templates/states.yml`
- Upstream writer (batch) → `workflows/batch-pipeline/` (Phase 6) / `batch/` (today)
