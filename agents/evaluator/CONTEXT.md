# agents/evaluator/

Core A–G evaluation of one offer (or comparison of N). Produces the score that gates every downstream step (PDF, Codex review, application drafting).

| Input | Required | Notes |
|---|---|---|
| JD text or URL | yes | URL extracted via Playwright → WebFetch → WebSearch chain |
| `cv.md` | yes | User layer (`me/cv.md` after Phase 7 migration) |
| `modes/_shared.md` | yes | System layer — archetypes + scoring framework |
| `modes/_profile.md` | yes | User overrides (archetypes, scoring weights, SKIP rules) |

**Outputs.** `reports/{###}-{slug}-{date}.md` (7 blocks: A role · B match · C level · D comp · E customization · F interview · G legitimacy). Appends Evaluated row to `data/applications.md`.

**Gates.** `score < 4.0` → skip downstream. `≥ 4.0` → PDF + offer Codex. `≥ 4.5` → also draft application answers.

**Composes with:** `agents/pdf-generator/`, `agents/codex-reviewer/`, `agents/tracker/`.

**Failure modes:** JD extraction fails (ask user to paste) · archetype ambiguous (pick closest 2) · no comp data (state "no data", never invent) · uncalibrated scoring (tune `_profile.md`, not `_shared.md`).

**Files:** `prompt.md` (single offer), `compare.md` (N offers).
