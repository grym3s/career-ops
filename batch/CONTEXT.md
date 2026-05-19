# batch/ — mass-processing infrastructure

Orchestrator for high-volume offer processing. Spawns headless workers (`claude -p`, `codex exec`, `gemini -p`, etc.) that each run the auto-pipeline against one URL.

## Files

| File | Layer | What |
|---|---|---|
| `batch-runner.sh` | system | Orchestrator. Resumable via `batch-state.tsv`. Supports `--model` (PR #504). |
| `batch-prompt.md` | system | Self-contained worker prompt — evaluation + PDF + tracker TSV |
| `batch-input.tsv` | user (gitignored) | URLs to process |
| `batch-state.tsv` | auto (gitignored) | Per-offer progress (id / status / score / report_num) |
| `logs/` | gitignored | Per-worker logs |
| `tracker-additions/` | gitignored | TSV lines that `merge-tracker.mjs` folds into `data/applications.md` |

## Run

```bash
./batch-runner.sh batch-input.tsv          # default model
./batch-runner.sh batch-input.tsv --model haiku   # cheaper for high volume
```

Then merge results:

```bash
node merge-tracker.mjs
```

## After Phase 6

This folder becomes `workflows/batch-pipeline/` with `runner.sh`, `worker-prompt.md`, and `state/`.

## Notes for batch workers

- Headless workers can't use Playwright — they use WebFetch fallback. Reports get header `**Verification:** unconfirmed (batch mode)` so you know to verify manually.
- Workers write TSVs, never edit `applications.md` directly. See `AGENTS.md` for the column-order rule.
