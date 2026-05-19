# career-ops — task router

You're at the root. Read `CLAUDE.md` first (project map and rules), then enter the folder for your task.

## What do you want to do?

| Task | Enter |
|---|---|
| Evaluate a job offer (paste a URL/JD) | `workflows/auto-pipeline/` |
| Run a batch of offers | `workflows/batch-pipeline/` |
| Drain the URL inbox | `workflows/pipeline-drain/` |
| Scan portals for new offers | `agents/scanner/` |
| Generate a tailored CV (HTML or LaTeX) | `agents/pdf-generator/` |
| Get a second-opinion review on a CV | `agents/codex-reviewer/` |
| Prep for an interview | `agents/interview-coach/` |
| Draft outreach to a contact | `agents/contact-writer/` |
| Deep company research | `agents/deep-research/` |
| Update the tracker / merge batch results | `agents/tracker/` |
| Look up rejection or scoring patterns | `agents/pattern-analyst/` |
| Plan follow-ups | `agents/followup-planner/` |
| Fill out an application form interactively | `agents/apply-helper/` |
| Tailor the system to me | `me/` |
| Read decisions / changelog / open questions | `wiki/` |
| Run the dashboard TUI | `dashboard/` |
| See examples / sample reports | `examples/` |
| Read the human-facing docs | `docs/` |

## Folder routing rule

Every domain folder has its own `CONTEXT.md` (task router for that folder). Read it before scanning the files inside — it tells you which file you actually want.

## Restructure status (2026-05-19)

This repo is migrating to a LostAndLucky-style folder layout — `wiki/decisions.md` 2026-05-19 entry is the decision of record. The migration is phased:

| Phase | Status | What lands |
|---|---|---|
| 1. CONTEXT.md sweep | ✅ | Routers in every folder |
| 2. wiki/ meta layer | ✅ | decisions / changelog / open-questions |
| 3. codex-reviewer agent | ✅ | Proof-of-concept agent contract |
| 4. evaluator + scanner | pending | Highest-value agents |
| 5. remaining 9 agents | pending | All modes promoted |
| 6. workflows/ + locales/ | pending | Workflows first-class, language overlays |
| 7. me/ + system/ + outputs/ | pending | Final shape |

**While the migration is in progress, both old and new paths work.** If a path is missing under the new layout, fall back to the legacy location:

| New (target) | Legacy (still works) |
|---|---|
| `agents/{name}/prompt.md` | `modes/{name}.md` |
| `agents/{name}/runners/*.mjs` | `./*.mjs` (root) |
| `workflows/auto-pipeline/` | `modes/auto-pipeline.md` |
| `me/cv.md` | `./cv.md` (root) |
| `me/profile.yml` | `config/profile.yml` |
| `me/_profile.md` | `modes/_profile.md` |
| `wiki/changelog.md` | `CHANGELOG.md` (root) |
| `system/*.mjs` | `./*.mjs` (root) |

Don't preemptively migrate paths in user-facing flows; the migration phases handle that with `test-all.mjs` + `update-system.mjs` in lockstep.
