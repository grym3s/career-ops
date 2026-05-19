# agents/training-eval/ — course / certification evaluation

Evaluates a course, certification, or training program against the candidate's career trajectory. Same scoring spirit as `agents/evaluator/` but for "should I take this course?" instead of "should I apply to this role?"

## Folder layout

```
agents/training-eval/
├─ CONTEXT.md     (this file)
├─ prompt.md      — was modes/training.md
├─ runners/       — empty (prompt-only)
├─ examples/
└─ evals/
```

**Inputs.**
- Course / cert info: name, provider, time commitment, cost, syllabus.
- `cv.md` for current skill baseline.
- `me/_profile.md` for target roles / archetypes.

**Outputs.**
- Markdown evaluation with: relevance to target archetypes, cost-vs-signal trade-off, comparable cheaper / faster alternatives, recommended yes/no.

**Dependencies.**
- External: WebSearch for course reviews, market signal of cert (does industry care?), comparable alternatives.
- Internal: `cv.md`, `me/_profile.md`.

**Failure modes.**

| Failure | Fix |
|---|---|
| Course info incomplete | Ask one clarifying question (e.g. "is this self-paced or cohort?") |
| Target archetype unclear | Default to current archetype mix; flag for user confirmation |

**When to invoke.**
- User says "is course X worth it?" / "should I take cert Y?" / "/career-ops training".
- Career-pivot consideration — user asking what's the fastest credential to add.

**When NOT to invoke.**
- User wants a comparison of multiple courses — extend this agent or use `agents/evaluator/compare.md` shape.

## Related

- Sibling evaluator for jobs → `agents/evaluator/`
- Sibling evaluator for portfolio projects → `agents/project-eval/`
- Source CV → `cv.md` (today) / `me/cv.md` (Phase 7)
