# Mode: scan — moved (LostAndLucky restructure, Phase 4b)

This mode prompt moved to **`agents/scanner/prompt.md`** as part of the LostAndLucky folder restructure (see `wiki/decisions.md` 2026-05-19).

**Load `agents/scanner/prompt.md` instead.** Its content is unchanged; the agent contract (inputs / outputs / dependencies / failure modes) lives in the sibling `agents/scanner/CONTEXT.md`.

Companion changes:

- `scan.mjs` at the repo root is now a thin shim — the real script is at `agents/scanner/runners/scan.mjs`. `node scan.mjs` and `npm run scan` still work (the shim imports the moved script).
- `providers/` folder moved to `agents/scanner/providers/` — colocated with its only consumer.

This stub will be removed in Phase 7 (final cleanup), once Phase 6 lockstep-updates the test harness, the updater, and the localized scanner modes.
