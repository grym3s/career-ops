# workflows/auto-pipeline/

Default flow when user pastes a JD or URL without explicit sub-command.

```
URL/JD → Step 0: extract (Playwright → WebFetch → WebSearch)
       → Step 1: agents/evaluator/prompt.md (A-G eval)
       → Step 2: save → reports/{###}-{slug}-{date}.md
       → Step 3: agents/pdf-generator/ (HTML or LaTeX per profile.cv.output_format)
       → Step 3.5: agents/codex-reviewer/ (if score >= 4.0 AND codex CLI present)
       → Step 4: draft application answers (if score >= 4.5)
       → Step 5: agents/tracker/ → append to data/applications.md
```

**Score gates.** `< 4.0` → save report only, mark Evaluated. `≥ 4.0` → generate CV, offer Codex. `≥ 4.5` → also draft answers.

**Failure handling.** Any step fails → continue with remaining steps, mark failed step pending in tracker, surface error.

**Files:** `definition.md` (full workflow prompt).
