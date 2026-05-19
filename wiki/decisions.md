# career-ops — decisions of record

**Append-only.** Dated entries documenting architectural, pattern, and policy decisions with rationale. Never edit a past entry to "fix" it — write a new entry that supersedes it and link back.

Reading this file top-to-bottom shows how the system's thinking evolved.

---

## 2026-05-19 — LostAndLucky folder restructure (in progress)

**Decision.** Migrate career-ops from its current flat layout (16 scripts + 25 modes + 6 user-data folders at the repo root, with `modes/{de,fr,ja,ru,tr}` clones) to a LostAndLucky-style folder-as-OS layout: every domain folder has a `CONTEXT.md` (task router), agents and workflows are first-class folders, locale-specific behavior is an overlay rather than a clone, and the user's personal contract lives in a dedicated `me/` folder.

**Pattern source.** [`~/wiki/wiki/projects/liahn-tattoo-social-strategy.md`](file:///C:/Users/admin/wiki/wiki/projects/liahn-tattoo-social-strategy.md) decision 2026-05-09. Reference implementation at `~/Projects/liahn-tattoo-ad-social-strategy/`.

**Why.**

1. Per-turn AI orient cost drops from ~11K tokens (AGENTS.md + ARCHITECTURE.md + scan modes/) to ~1.5K tokens (CLAUDE.md → root CONTEXT.md → folder CONTEXT.md). Direct $ savings on every interaction.
2. Adding a new agent today touches 5+ files (`.mjs` at root + `.md` in modes/ + `auto-pipeline.md` + `ARCHITECTURE.md` + `CHANGELOG.md` + likely `batch-prompt.md`). After: one folder.
3. Locale modes (`modes/{de,fr,ja,ru,tr}`) clone the English `modes/` per language and silently drift when English changes. Overlay model (`locales/{lang}/agents/{name}/prompt.md`) ships only the diff.
4. Agent evaluation feedback ("this rewrite worked", "score too high") has no structured home today. Per-agent `evals/` makes feedback compoundable across sessions.
5. The two-layer rule (user vs system) is preserved and strengthened: `me/` makes user-layer files visually unambiguous; system layer keeps `update-system.mjs` safety contract intact.

**How.** Seven-phase migration. Both legacy and new paths coexist during the transition; each phase ships independently, gated by `test-all.mjs` passing 66/0/1 (baseline).

| Phase | Scope | Status |
|---|---|---|
| 0 | Pre-flight (branch + baseline + commit in-flight codex-review work) | ✅ committed `c207e9d`, `cc96364` ancestor |
| 1 | Additive CONTEXT.md sweep (21 routers + AGENTS.md folder-routing note) | ✅ committed `cc96364` |
| 2 | wiki/ meta layer (decisions / open-questions / conflicts) | ⏳ in progress |
| 3 | Promote `codex-reviewer` agent as the contract POC | ✅ committed (see below) |
| 4 | Promote `evaluator` + `scanner` agents | ✅ committed (`252af9e`, `f1fa8c3`) |
| 5 | Promote remaining 9 agents | ✅ committed `aeb5514` — 10 agents actually (training + project split into separate agents) |
| 6 | `workflows/` first-class + `locales/` overlay refactor | ✅ committed `c30cb9e` |
| 7 | `me/` + `system/` + `outputs/` consolidation | ✅ committed (this commit) — scope reduced (see below) |

**What we're NOT changing.** The two-layer mental model (`AGENTS.md` user vs system rule), `update-system.mjs`'s `USER_PATHS` safety contract, `templates/states.yml` as canonical status source, `release-please`-managed `./CHANGELOG.md` at the root, the `.github/` CI workflows.

**Reverting.** Branch `feat/lostandlucky-restructure` is the migration carrier. Each phase is a separate atomic commit; `git revert {phase-commit}` undoes one phase without the others. Phases 4–7 also require updating `test-all.mjs`'s hardcoded `expectedModes` + `systemFiles` arrays and `update-system.mjs`'s `SYSTEM_PATHS` array in lockstep; if a phase ships without those updates, self-update and CI break.

---

## 2026-05-19 — Phase 7 scope reduction (executed)

**Decision.** Phase 7 originally planned to also:

1. Move all user-layer files (`cv.md`, `article-digest.md`, `portals.yml`, `config/profile.yml`, `modes/_profile.md`) into `me/`.
2. Move system scripts (`update-system.mjs`, `test-all.mjs`, `doctor.mjs`, `cv-sync-check.mjs`) into `system/`.
3. Unify `reports/` + `output/` + `interview-prep/` into `outputs/{reports,pdfs,interview-prep}/`.

**Executed scope** (this commit):

1. ✅ Moved 8 agent runners to `agents/{name}/runners/` with `CAREER_OPS = resolve(SCRIPT_DIR, '..', '..', '..')` path-walk-up edits per script. Verified via `node --check` and integration-tested via test-all.mjs Section 2 (4 tracker runners actually invoked).
2. ✅ Updated `update-system.mjs` SYSTEM_PATHS to sweep `agents/`, `workflows/`, `locales/`, `wiki/` as trees instead of listing each `modes/*.md` individually.
3. ✅ Added `me/` to USER_PATHS (canonical user-layer location going forward) alongside the legacy entries (`cv.md`, `config/profile.yml`, etc.) so users who haven't migrated are still protected by the safety guard.
4. ✅ Rewrote `test-all.mjs` Section 5 (systemFiles) and Section 8 (replaced hardcoded `expectedModes` with discovery loop over `agents/{name}/prompt.md` + `workflows/{name}/definition.md`). New agents auto-enroll.
5. ✅ Deleted all 17 Phase-4/5/6 shim files (`modes/{oferta,ofertas,scan,pdf,latex,tracker,apply,interview-prep,deep,contacto,patterns,followup,training,project,auto-pipeline,batch,pipeline}.md`).
6. ✅ Empty `modes/{de,fr,ja,ru,tr,pt}/` directories cleaned (git doesn't track them; Bash `rmdir` confirmed).

**NOT executed** (deferred — see rationale below):

- User-layer file moves (`cv.md` → `me/cv.md` etc.). **Why deferred:** this clone has no user data (no `cv.md`, `portals.yml`, `config/profile.yml`). Moving user-layer files affects real installs only; the canonical `me/` folder is now in `update-system.mjs` USER_PATHS so existing users can voluntarily move their data into `me/` and be protected, but auto-migration of existing user data needs user-facing onboarding (notify-then-move) rather than a silent code change.
- System scripts to `system/`. **Why deferred:** `update-system.mjs`, `test-all.mjs`, `doctor.mjs`, `cv-sync-check.mjs` are user/CI-facing canonical commands. Moving them breaks every script, doc, CI workflow, and user habit that says "run `node update-system.mjs check`". Moving them needs `package.json` script aliases + GitHub Actions workflow updates + user-facing migration messaging. Out of scope for an autonomous restructure.
- `outputs/` unification. **Why deferred:** `reports/`, `output/`, `interview-prep/` are gitignored user-data folders that exist on every user install. Renaming them would orphan existing user reports / PDFs / interview prep. Needs the same notify-then-move pattern as user-layer files. Captured in `wiki/open-questions.md` Q-4.

**Lockstep verification.** `test-all.mjs --quick` = 87 passed / 0 failed / 1 warning. Quote unchanged from intermediate phases — 87 is HIGHER than the original 66 baseline because:
- Section 1 now discovers `agents/*/runners/*.mjs` (+8 syntax checks).
- Section 8 was rewritten from a hardcoded 15-mode list to a discovery loop over agents + workflows (+~30 checks).
- Section 2 now invokes the moved tracker runners at their new paths (path-walk-up validated by actual execution).

**Reverting Phase 7.** `git revert <phase-7-commit>` un-moves the runners and restores the shim files. The runner moves are content-only — branches, locales, agents/, workflows/, wiki/ are unaffected.

---

## 2026-05-19 — Agent contract shape decided (Phase 3)

**Decision.** An agent's folder IS the contract — no separate `contract.yml`. Each `agents/{name}/` folder holds:

```
agents/{name}/
├─ CONTEXT.md     — the contract (what / when / inputs / outputs / failure modes)
├─ prompt.md      — the AI skill (what gets loaded as the mode prompt)
├─ runners/       — .mjs scripts the agent owns
├─ examples/      — sample inputs + expected outputs (empty until first run)
└─ evals/         — user feedback over time (empty until first run)
```

**Why no `contract.yml`.** Three reasons:

1. **No consumer yet.** A machine-readable `contract.yml` only matters when something (a workflow definition, a test harness, a generator) reads it. We don't have any of those yet. Phase 6 might want one for `workflows/`; adding it then is one file per agent. Adding it now is premature infrastructure.
2. **Drift risk.** With `CONTEXT.md` + `contract.yml` + `prompt.md` all describing the agent's surface, three files have to stay in sync. Two-file (`CONTEXT.md` + `prompt.md`) keeps them honest — `CONTEXT.md` is what humans + AI read, `prompt.md` is what gets loaded.
3. **Forward-compatible.** If a workflow eventually needs a structured contract, we extract it from `CONTEXT.md` once. The reverse (consolidate from yaml + markdown into one) is more painful.

**Test harness lockstep (the lesson Phase 3 taught).** When you move an `.mjs` out of root, `test-all.mjs` Section 1 (`readdirSync(ROOT)` for `.mjs`) silently stops checking it — 66 passes drop to 65 with no failure flag. Phase 3 added a discovery loop for `agents/*/runners/*.mjs` so future agents auto-enroll in the syntax check. Phases 4–7 will need to update Section 5 (`systemFiles`), Section 8 (`expectedModes`), and `update-system.mjs` SYSTEM_PATHS in the same atomic commit as each move — otherwise the missing-paths failures slip through as "tests still pass but coverage shrunk."

---
