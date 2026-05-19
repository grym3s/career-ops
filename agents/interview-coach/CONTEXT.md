# agents/interview-coach/ — company-specific interview prep

Produces a tailored interview prep doc for a specific company × role. Reads the existing evaluation report + STAR+R story bank + company research, generates per-interviewer-audience prep (engineering / hiring-manager / leadership — see PR #489).

## Folder layout

```
agents/interview-coach/
├─ CONTEXT.md     (this file)
├─ prompt.md      — was modes/interview-prep.md
├─ runners/       — empty (prompt-only)
├─ examples/
└─ evals/
```

**Inputs.**
- Report at `reports/{###}-{company-slug}-*.md` for this offer.
- `interview-prep/story-bank.md` — accumulated STAR+R stories across past evaluations.
- WebSearch for current company news, recent hires, eng blog posts.
- `cv.md` for proof-point cross-reference.

**Outputs.**
- `interview-prep/{company}-{role}.md` with three sections per audience (engineering / hiring-manager / leadership).
- Appends new STAR+R stories to `story-bank.md` if the prep surfaced ones not already there.

**Dependencies.**
- External: WebSearch for fresh company context.
- Internal: `reports/` (Block F STAR+R stories), `interview-prep/story-bank.md`.
- Composes with: `agents/evaluator/` (provides initial F-block stories), `agents/deep-research/` (deeper company context if needed).

**Failure modes.**

| Failure | Fix |
|---|---|
| No matching report found | Run `agents/evaluator/` first |
| story-bank.md empty | First prep — that's fine, this fills it |
| Audience not specified by user | Default to engineering + hiring-manager; flag for clarification |

**When to invoke.**
- User says "I have an interview at X — prep me" / "/career-ops interview-prep {company}".
- Status in `data/applications.md` advanced to `Interview` and prep hasn't been done yet.

**When NOT to invoke.**
- The interview is generic (no specific company target yet) — use story-bank directly.

## Related

- The story bank that grows over time → `interview-prep/story-bank.md`
- Source report's Block F → `reports/{###}-*-{date}.md`
- Deeper company context → `agents/deep-research/`
