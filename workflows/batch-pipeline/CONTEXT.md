# workflows/batch-pipeline/ — mass-processing infrastructure

High-volume offer processing. Spawns headless workers (`claude -p`, `codex exec`, `gemini -p`, etc.) that each run the auto-pipeline against one URL. Resumable via `batch/batch-state.tsv`.

## Composition

Same as `workflows/auto-pipeline/` but per-URL in parallel across N workers. The `batch/` folder still hosts the orchestrator script + the runner-state TSVs because they're system-level infrastructure, not workflow-content. After Phase 7, `batch/batch-runner.sh` may move into this folder as `runner.sh`.

## Files

| File | What |
|---|---|
| `definition.md` | The workflow prompt — was `modes/batch.md` |
| `CONTEXT.md` | This file |

## Where the orchestrator + state lives

- `batch/batch-runner.sh` — orchestrator. Spawns workers, manages resumption.
- `batch/batch-prompt.md` — the self-contained per-worker prompt.
- `batch/batch-input.tsv` — user-layer URLs to process (gitignored).
- `batch/batch-state.tsv` — auto-managed progress state (gitignored).
- `batch/logs/` — per-worker logs (gitignored).
- `batch/tracker-additions/` — TSVs that `merge-tracker.mjs` folds into `data/applications.md` (gitignored).

These will likely move into `workflows/batch-pipeline/` in a follow-up cleanup.

## Headless worker constraints

- Headless workers can't use Playwright (no display) — they fall back to WebFetch. Reports get a `**Verification:** unconfirmed (batch mode)` header so the user knows to verify manually.
- Workers write TSVs only — never edit `data/applications.md` directly.

## Run

```bash
./batch/batch-runner.sh batch/batch-input.tsv          # default model
./batch/batch-runner.sh batch/batch-input.tsv --model haiku   # cheaper
```

Then merge:

```bash
node merge-tracker.mjs   # still at root, moves to agents/tracker/runners/ in Phase 7
```

## Related

- The agents the worker composes → same as `workflows/auto-pipeline/`
- The TSV merge script → `merge-tracker.mjs` at root (Phase 7 → `agents/tracker/runners/`)
- The canonical status enum → `templates/states.yml`
