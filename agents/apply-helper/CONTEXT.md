# agents/apply-helper/ — interactive application form fill

Walks the user through filling out an application form. Reads the form (via Playwright), drafts answers from `cv.md` + the report's Block H ("Draft Application Answers"), and presents each for user review before submission.

**Critical:** never submits silently. The user clicks Submit, not the AI. See `AGENTS.md` "Ethical Use" rule.

## Folder layout

```
agents/apply-helper/
├─ CONTEXT.md     (this file)
├─ prompt.md      — was modes/apply.md
├─ runners/       — empty (prompt-only agent)
├─ examples/
└─ evals/
```

**Inputs.**
- Form URL (Playwright snapshot).
- `cv.md` + `me/_profile.md` (today: `modes/_profile.md`) for content.
- The matching report under `reports/` (if it has Block H draft answers, prefer those).

**Outputs.**
- Filled form fields (via Playwright `browser_fill_form`).
- Optionally update `data/applications.md` row from `Evaluated` → `Applied` AFTER the user confirms submission.

**Dependencies.**
- External: Playwright (for form interaction).
- Composes with: `agents/evaluator/` (provides Block H drafts), `agents/tracker/` (status update on confirmed submit).

**Failure modes.**

| Failure | Fix |
|---|---|
| Form behind auth wall | Ask user to log in first, then re-invoke |
| Form is multi-step / wizard | Process one step at a time, user confirms each |
| Custom resume upload field | Use the latest PDF from `output/cv-{candidate}-{company}-*.pdf` |

**When to invoke.**
- User says "fill out this application form" / "/career-ops apply".
- Score ≥ 4.5 AND CV has been generated AND user hasn't already applied.

**When NOT to invoke.**
- Score < 4.5 (auto-pipeline Step 4 gate). User can override by asking explicitly.
- The application is via email/recruiter (no form to fill).

## Related

- The form-snapshot tool → Playwright
- The CV the form references → `output/cv-*.pdf`
- The status update on confirmed submit → `agents/tracker/`
