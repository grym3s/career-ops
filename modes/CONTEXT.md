# modes/ — legacy skill prompts (during migration)

The flat directory of skill prompts the AI reads. Each file maps to one job in the system. While the LostAndLucky restructure is in progress (Phases 4–6), prompts that have been promoted to `agents/{name}/prompt.md` are still mirrored here for backwards compatibility with `update-system.mjs`.

## Picking a mode

| If the user wants to... | Read |
|---|---|
| Paste a JD or URL (default flow) | `auto-pipeline.md` → eventually `workflows/auto-pipeline/` |
| Evaluate one offer (blocks A–G) | `oferta.md` → eventually `agents/evaluator/` |
| Compare multiple offers | `ofertas.md` → eventually `agents/evaluator/` |
| Fill an application form | `apply.md` → eventually `agents/apply-helper/` |
| Scan portals | `scan.md` → eventually `agents/scanner/` |
| Drain the URL inbox | `pipeline.md` → eventually `workflows/pipeline-drain/` |
| Run a batch | `batch.md` → eventually `workflows/batch-pipeline/` |
| Generate a CV (HTML / LaTeX) | `pdf.md` or `latex.md` → eventually `agents/pdf-generator/` |
| Run a Codex review on a CV | `codex-review.md` → already promoted to `agents/codex-reviewer/` |
| Deep company research | `deep.md` → eventually `agents/deep-research/` |
| LinkedIn outreach | `contacto.md` → eventually `agents/contact-writer/` |
| Interview prep | `interview-prep.md` → eventually `agents/interview-coach/` |
| Course / cert evaluation | `training.md` |
| Portfolio project evaluation | `project.md` |
| Query the tracker | `tracker.md` → eventually `agents/tracker/` |
| Rejection-pattern analysis | `patterns.md` → eventually `agents/pattern-analyst/` |
| Follow-up cadence | `followup.md` → eventually `agents/followup-planner/` |

## Shared rules

- `_shared.md` — base archetypes, scoring framework, NEVER / ALWAYS lists. System layer.
- `_profile.md` — user's overrides on top of `_shared.md`. **User layer — never auto-updated.**
- `_profile.template.md` — template the user copies to `_profile.md` on first run.

## Localized modes

`de/`, `fr/`, `ja/`, `ru/`, `tr/` are localized clones of the English modes. They will be refactored into `locales/{name}/agents/{agent}/prompt.md` overlays in Phase 6.
