# career-ops — known conflicts

Where two rules / decisions / contracts collide and the resolution hasn't been recorded yet. Entries here should either be:

1. **Resolved** → moved to `decisions.md` with a dated entry, deleted here.
2. **Deferred** → marked `[deferred]` with a reason and a "review by" date.

---

## C-1 — `AGENTS.md` user-layer list vs `update-system.mjs` USER_PATHS

**Conflict.** `AGENTS.md` "Data Contract (CRITICAL)" lists user-layer files (`cv.md`, `config/profile.yml`, `modes/_profile.md`, `article-digest.md`, `portals.yml`, `data/*`, `reports/*`, `output/*`, `interview-prep/*`). `update-system.mjs` USER_PATHS lists the same set BUT also includes `jds/` and `writing-samples/` which AGENTS.md doesn't mention.

**State.** [deferred] until Phase 7. The migration moves these into `me/` regardless; resolving the asymmetry as part of Phase 7's `DATA_CONTRACT.md` rewrite is cheaper than fixing it twice.

---

## C-2 — LostAndLucky "no-dashes rule" vs career-ops filenames

**Conflict.** The user's LostAndLucky reference (`liahn-tattoo-ad-social-strategy/`) cites a "no-dashes rule" added 2026-05-09. Career-ops uses dashes extensively in filenames (`auto-pipeline.md`, `codex-review.mjs`, `cv-template.html`, `verify-pipeline.mjs`, `merge-tracker.mjs`, `dual-track-engineer-instructor/`).

**Resolution.** No conflict in practice — the no-dashes rule in the LostAndLucky reference is scoped to **client-facing written content** (brand voice, ad copy, captions), not filenames. The liahn-tattoo project itself uses dashes in folder names (`liahn-tattoo-ad-social-strategy`, `brand-voice.md`, `social-media-manager`). career-ops filenames are fine as-is.

**State.** Resolved 2026-05-19. Leaving the entry here as a record so the question doesn't get re-asked.

---
