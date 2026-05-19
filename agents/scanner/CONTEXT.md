# agents/scanner/

Zero-token portal scan. Polls Greenhouse/Ashby/Lever public APIs directly; writes new offers to `data/pipeline.md`. No LLM, no API key.

| Input | Required | Notes |
|---|---|---|
| `portals.yml` | yes | User layer — company list + filters + per-company `provider:` |
| `data/scan-history.tsv` | auto | Per-URL fingerprints (dedup) |
| `--dry-run` | no | Preview without writing |
| `--company <name>` | no | Single-company scan |

**Outputs.** New URLs appended to `data/pipeline.md`. Updated fingerprints in `scan-history.tsv`.

**Composes with:** `agents/evaluator/` (consumes the queue).

**Provider plugin contract.** Drop `providers/{name}.mjs` exporting `{id, detect?, fetch}`. Files prefixed `_` are shared helpers. No `scan.mjs` edits needed — providers auto-load.

**Failure modes:** `js-yaml` missing (`npm install`) · 429 rate limit (`_http.mjs` backs off; if persistent, lower `CONCURRENCY`) · 0 providers loaded (check default export shape).

**Files:** `prompt.md` (skill), `scan.mjs` (runner), `providers/` (greenhouse, ashby, lever).
