# agents/apply-helper/

Interactive application form fill via Playwright. Reads the form, drafts answers from `cv.md` + Block H of the matching report, presents each for review.

**CRITICAL:** Never submits silently. The user clicks Submit. See `AGENTS.md` "Ethical Use".

| Input | Required | Notes |
|---|---|---|
| Form URL | yes | Playwright snapshot to extract fields |
| `cv.md` | yes | User content for answer drafts |
| `me/_profile.md` | yes | Tone/preference overrides |
| Matching `reports/{###}-*.md` | optional | Prefer Block H drafts if present |

**Outputs.** Filled form fields (via `browser_fill_form`). On confirmed submit: tracker row → `Applied`.

**Gates.** Invoke when score ≥ 4.5 AND CV has been generated AND user hasn't already applied. User can override with explicit request.

**Composes with:** `agents/evaluator/` (Block H drafts), `agents/tracker/` (status update on submit).

**Failure modes:** form behind auth (ask user to log in first) · multi-step wizard (process one step at a time) · custom resume upload field (use latest PDF from `output/`).

**Files:** `prompt.md` (skill). No runner — prompt-only agent driving Playwright.
