# workflows/batch-pipeline/

Mass-processing infrastructure. Spawns headless workers (one per CLI: `claude -p`, `codex exec`, `gemini -p`, etc.) each running auto-pipeline against one URL. Resumable via `batch/batch-state.tsv`.

**Run.**

```bash
./batch/batch-runner.sh batch/batch-input.tsv          # default model
./batch/batch-runner.sh batch/batch-input.tsv --model haiku
node agents/tracker/merge-tracker.mjs                  # merge results after
```

**Headless constraint.** No Playwright (no display) — workers fall back to WebFetch. Reports get `**Verification:** unconfirmed (batch mode)` so user knows to verify manually.

**Worker output rule.** TSVs only — never edit `data/applications.md` directly. `merge-tracker.mjs` folds the TSVs in.

**State + orchestrator** live in `batch/` (gitignored input/state/logs/tracker-additions). May move into this folder in future cleanup.

**Files:** `definition.md` (worker prompt).
