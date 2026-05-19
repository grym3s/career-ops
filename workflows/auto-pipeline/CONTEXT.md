# workflows/auto-pipeline/ — the default flow

The default flow when the user pastes a JD or URL without an explicit sub-command. Composes the core agents into a single pipeline.

## Composition

```
USER pastes URL or JD
   │
   ▼
Step 0: Extract JD (Playwright → WebFetch → WebSearch fallback chain)
   │
   ▼
Step 1: agents/evaluator/prompt.md (A-G evaluation)
   │
   ▼
Step 2: Save report → reports/{###}-{slug}-{date}.md
   │
   ▼
Step 3: agents/pdf-generator/prompt.md (HTML) or prompt-latex.md (LaTeX)
        Selected by cv.output_format in me/profile.yml
   │
   ▼
Step 3.5: agents/codex-reviewer/prompt.md (if score ≥ 4.0 AND codex CLI installed)
   │
   ▼
Step 4: Draft application answers (only if score ≥ 4.5)
   │
   ▼
Step 5: agents/tracker/ — append to data/applications.md
```

**Score gates:**
- `< 4.0` → skip PDF + Codex + drafting; just save report. Mark `Evaluated` in tracker.
- `≥ 4.0` → generate tailored CV. Offer Codex review.
- `≥ 4.5` → also draft application answers (Step 4).

**If any step fails:** continue with the remaining steps, mark the failed step as pending in the tracker, surface the error to the user.

## Files

| File | What |
|---|---|
| `definition.md` | The full workflow prompt — was `modes/auto-pipeline.md` |
| `CONTEXT.md` | This file |

## Related

- The agents composed → `agents/evaluator/`, `agents/pdf-generator/`, `agents/codex-reviewer/`, `agents/tracker/`
- The user's profile that selects the PDF backend → `me/profile.yml` (Phase 7) / `config/profile.yml` (today)
- Localized versions → `locales/{lang}/workflows/auto-pipeline/` (not yet ported; locales currently only have pipeline-drain)
