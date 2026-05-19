# data/ — user state that grows over time

**User layer.** Never auto-updated. Tracks every offer you've evaluated, every URL you've queued, every follow-up you've sent.

## Files

| File | What | Gitignored |
|---|---|---|
| `applications.md` | The tracker — one row per offer evaluated/applied | yes |
| `pipeline.md` | Inbox of URLs to process — drained by `workflows/pipeline-drain/` | yes |
| `scan-history.tsv` | Per-URL fingerprints so the scanner doesn't re-surface offers | yes |
| `follow-ups.md` | Follow-up history used by `agents/followup-planner/` | yes |

## Editing rules (CRITICAL)

1. **Never create NEW entries in `applications.md` by hand-editing.** Batch workers write TSVs to `batch/tracker-additions/` and `merge-tracker.mjs` folds them in. Avoids duplicates.
2. **You MAY edit existing entries in `applications.md`** to update status / notes / score.
3. **Canonical statuses only** (see `templates/states.yml`): `Evaluated`, `Applied`, `Responded`, `Interview`, `Offer`, `Rejected`, `Discarded`, `SKIP`. No bold, no dates in the status column, no extra text.
4. Run `node verify-pipeline.mjs` after any manual edit to catch dupes / non-canonical statuses / missing URLs.

## Related

- Tracker merge / dedup / normalize / verify → `agents/tracker/` (eventually) or root `*.mjs` (today)
- Where reports referenced by the tracker live → `reports/`
