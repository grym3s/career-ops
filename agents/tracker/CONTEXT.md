# agents/tracker/

Owns `data/applications.md` — the ledger. Merges batch results, dedups, normalizes statuses, verifies pipeline integrity.

| Input | Used by | Notes |
|---|---|---|
| `data/applications.md` | all 4 scripts | The ledger (gitignored) |
| `batch/tracker-additions/*.tsv` | merge-tracker | Pending merges |
| `templates/states.yml` | normalize/verify | Canonical status enum |
| `reports/` | verify-pipeline | Cross-reference check |

**Outputs.** Updated `data/applications.md`. Health report to stdout (verify-pipeline).

**Composes with:** `agents/evaluator/` writes `Evaluated` rows; batch workers write TSVs.

**Editing rules (CRITICAL):** Never hand-add NEW rows to `applications.md` — workers write TSVs, `merge-tracker.mjs` folds them in. You MAY edit existing rows (status / notes / score). Statuses MUST be canonical (see `templates/states.yml`).

**Failure modes:** non-canonical status (`normalize-statuses.mjs`) · duplicate row (`dedup-tracker.mjs`) · wrong TSV col order (see AGENTS.md "TSV Format") · missing report (`verify-pipeline.mjs` flags).

**Files:** `prompt.md` (skill), `merge-tracker.mjs`, `dedup-tracker.mjs`, `normalize-statuses.mjs`, `verify-pipeline.mjs`.
