# system/ — repo-level utility scripts (placeholder)

Scripts that operate on the repo itself (not on a single agent's behavior) — health checks, self-update, test harness.

## What will go here (after Phase 7)

```
system/
├─ CONTEXT.md
├─ update.mjs              (was update-system.mjs)
├─ doctor.mjs              Health check
├─ test-all.mjs            CI test harness
├─ cv-sync-check.mjs       Detects drift between cv.md and generated PDFs
└─ verify-pipeline.mjs     Pipeline-integrity check (urls, statuses, dupes)
```

## Status (2026-05-19)

Phase 7 (the move) hasn't shipped yet. These scripts still live at the repo root and are called as `node update-system.mjs`, `node doctor.mjs`, etc. — do not move them until `update-system.mjs`'s own SYSTEM_PATHS map is updated in lockstep, or self-update will fail to find itself.

## When to enter

- You want to update the system → run `node update-system.mjs check` from the root
- You want to run the full test suite → `node test-all.mjs` (or `--quick` to skip Go build)
- Something feels broken → `node doctor.mjs`
