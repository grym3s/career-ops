# workflows/pipeline-drain/

Process URLs queued in `data/pipeline.md` (typically written by `agents/scanner/`). Sequential, interactive — pauses to confirm scores and present rewrites.

| | `pipeline-drain` | `batch-pipeline` |
|---|---|---|
| Source | `data/pipeline.md` queue | `batch/batch-input.tsv` |
| Concurrency | sequential (interactive) | parallel (N workers) |
| User interaction | yes | no (headless) |
| Use when | 5-15 careful offers | 50+ offers to grind |

**Localized.** `locales/{lang}/workflows/pipeline-drain/definition.md` overlays the canonical English per the resolution rule in `AGENTS.md`.

**Composes with:** `agents/scanner/` (fills the queue), `workflows/auto-pipeline/` (the per-URL flow).

**Files:** `definition.md` (workflow prompt).
