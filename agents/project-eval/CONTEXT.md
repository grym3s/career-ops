# agents/project-eval/ — portfolio project evaluation

Evaluates a portfolio project (build, write-up, case study) against the candidate's target archetypes. "Should I keep building / promoting this, or kill it?"

## Folder layout

```
agents/project-eval/
├─ CONTEXT.md     (this file)
├─ prompt.md      — was modes/project.md
├─ runners/       — empty (prompt-only)
├─ examples/
└─ evals/
```

**Inputs.**
- Project description (one paragraph + status).
- Optional: project URL / repo for deeper context.
- `me/_profile.md` for target archetypes.
- `article-digest.md` (proof-point bank) — to see if this project is already cited there.

**Outputs.**
- Markdown evaluation: which archetypes this proves, whether it's interview-grade, suggested 1-line summary for `article-digest.md`, suggested next milestones if it's not yet interview-grade.

**Dependencies.**
- Optional external: WebFetch repo README or project page.
- Internal: `me/_profile.md`, `article-digest.md`.

**Failure modes.**

| Failure | Fix |
|---|---|
| Project status unclear | Ask: "shipped" / "in progress" / "shelved" |
| Repo private | Use user-pasted description; note that public reviewability is part of the signal |

**When to invoke.**
- User says "should I keep building X?" / "is this portfolio project worth the time?" / "/career-ops project".
- After completing a portfolio project — to decide if it earns a slot in `article-digest.md`.

**When NOT to invoke.**
- The project is already cited in `cv.md` and is shipping — no need to re-evaluate.

## Related

- Sibling evaluator for jobs → `agents/evaluator/`
- Sibling evaluator for courses → `agents/training-eval/`
- Where proven projects land → `article-digest.md` (today) / `me/article-digest.md` (Phase 7)
- Worked-example reference → `examples/dual-track-engineer-instructor/`
