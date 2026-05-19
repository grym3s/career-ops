# Data Contract

This document defines which files belong to the **system** (auto-updatable) and which belong to the **user** (never touched by updates).

## User Layer (NEVER auto-updated)

These files contain your personal data, customizations, and work product. Updates will NEVER modify them.

**LostAndLucky Phase 7 (2026-05-19) introduced `me/` as the canonical user-layer folder.** Legacy paths are still supported — the safety guard in `update-system.mjs` USER_PATHS rejects updates that would touch either location. Existing users can move their files into `me/` voluntarily; new users are guided to use `me/` from onboarding.

| File | Purpose |
|------|---------|
| `me/cv.md` (canonical) or `cv.md` (legacy) | Your CV in markdown |
| `me/profile.yml` (canonical) or `config/profile.yml` (legacy) | Your identity, targets, comp range |
| `me/_profile.md` (canonical) or `modes/_profile.md` (legacy) | Your archetypes, narrative, negotiation scripts |
| `me/article-digest.md` (canonical) or `article-digest.md` (legacy) | Your proof points from portfolio |
| `me/portals.yml` (canonical) or `portals.yml` (legacy) | Your customized company list |
| `interview-prep/story-bank.md` | Your accumulated STAR+R stories |
| `data/applications.md` | Your application tracker |
| `data/pipeline.md` | Your URL inbox |
| `data/scan-history.tsv` | Your scan history |
| `data/follow-ups.md` | Your follow-up history |
| `writing-samples/*` | Your personal writing samples for style calibration (except `writing-samples/README.md`, which is system-owned documentation delivered by updates) |
| `reports/*` | Your evaluation reports |
| `output/*` | Your generated PDFs |
| `jds/*` | Your saved job descriptions |

## System Layer (safe to auto-update)

These files contain system logic, scripts, templates, and instructions that improve with each release.

| File | Purpose |
|------|---------|
| `CONTEXT.md` | Root task router (LostAndLucky entry point) |
| `CLAUDE.md` | Claude Code entry — re-imports CONTEXT.md + AGENTS.md |
| `AGENTS.md` | Cross-CLI system contract |
| `modes/_shared.md` | Scoring system, global rules, archetypes |
| `modes/_profile.template.md` | Onboarding template — user copies to `me/_profile.md` |
| `agents/{name}/` | Each agent: CONTEXT.md (contract) + prompt.md (skill) + runners/ + examples/ + evals/. 13 agents promoted in Phases 3–5: codex-reviewer, evaluator, scanner, pdf-generator, tracker, apply-helper, interview-coach, deep-research, contact-writer, pattern-analyst, followup-planner, training-eval, project-eval |
| `workflows/{name}/` | Each workflow: CONTEXT.md + definition.md. Workflows compose agents: auto-pipeline, batch-pipeline, pipeline-drain |
| `locales/{lang}/` | Language overlays for non-English markets. Each locale ships only the prompt diff; contract/runners/examples/evals are shared with canonical English. Locales: de, fr, ja, ru (incl interview-coach), tr, pt |
| `wiki/` | Append-only narrative: decisions.md, open-questions.md, conflicts.md |
| `batch/batch-prompt.md` | Batch worker prompt |
| `batch/batch-runner.sh` | Batch orchestrator |
| `dashboard/*` | Go TUI dashboard |
| `templates/*` | Base templates (cv-template.html/tex, states.yml, *.example.yml) |
| `fonts/*` | Self-hosted fonts |
| `cv-sync-check.mjs`, `update-system.mjs`, `scan.mjs` (shim), `doctor.mjs`, `check-liveness.mjs`, `liveness-core.mjs`, `gemini-eval.mjs`, `test-all.mjs` | User/CI-facing scripts (canonical root paths) |
| `agents/{name}/runners/*.mjs` | Agent-owned scripts: scan, generate-pdf, generate-latex, merge-tracker, dedup-tracker, normalize-statuses, verify-pipeline, analyze-patterns, followup-cadence, codex-review |
| `.agents/` | Cross-CLI agent definitions |
| `.claude/skills/` | Claude Code skill plugin |
| `.gemini/commands/` | Gemini CLI command plugin |
| `docs/*` | Human-facing documentation |
| `.claude/skills/*` | Skill definitions |
| `docs/*` | Documentation |
| `VERSION` | Current version number |
| `DATA_CONTRACT.md` | This file |
| `writing-samples/README.md` | System-owned onboarding documentation for the writing-samples directory |

## The Rule

**If a file is in the User Layer, no update process may read, modify, or delete it.**

**If a file is in the System Layer, it can be safely replaced with the latest version from the upstream repo.**
