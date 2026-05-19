# interview-prep/ — interview material

**User layer.** Story bank that accumulates across evaluations, plus per-company interview intel reports.

## Files

| File | What |
|---|---|
| `story-bank.md` | Accumulated STAR+R stories distilled from evaluations across all offers |
| `{company}-{role}.md` | Per-engagement interview prep with company-specific intel |

Per-interviewer-audience splits (engineering vs hiring-manager vs leadership) are now standard (see PR #489).

## When entries land here

- `agents/interview-coach/` (today: `modes/interview-prep.md`) writes per-company files
- The evaluator agent appends new STAR+R stories to `story-bank.md` after each eval

## After Phase 7

This folder becomes `outputs/interview-prep/` (sibling of `outputs/reports/` and `outputs/pdfs/`).

## Related

- The agent that writes here → `agents/interview-coach/` (eventually) / `modes/interview-prep.md` (today)
- Reports the prep references → `reports/`
