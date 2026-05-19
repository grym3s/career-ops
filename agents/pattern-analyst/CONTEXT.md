# agents/pattern-analyst/ — rejection / scoring pattern analysis

Reads across all evaluations and applications and surfaces patterns: which archetypes score consistently high but reject, which compensation bands you're under-targeting, which signals predict offer success. The system's self-correction loop.

## Folder layout

```
agents/pattern-analyst/
├─ CONTEXT.md     (this file)
├─ prompt.md      — was modes/patterns.md
├─ runners/       — empty until Phase 7 (analyze-patterns.mjs still at root)
├─ examples/
└─ evals/
```

**Runner (still at repo root pending Phase 7).**
- `analyze-patterns.mjs` — Reads `reports/*.md` + `data/applications.md`, emits JSON: archetype-score-vs-status distribution, comp-band hit rate, geography correlations, status-velocity histograms.

**Inputs.**
- All files under `reports/` (markdown evaluations).
- `data/applications.md` (status outcomes).
- Optional: `agents/*/evals/` (per-agent feedback once Phase 5 evals accumulate).

**Outputs.**
- JSON to stdout (machine-readable).
- Markdown summary to `reports/_pattern-analysis-{date}.md` for human review (planned, not yet implemented).
- Suggestions: "consider downgrading SKIP threshold for archetype X", "you're under-applying to Y comp band".

**Dependencies.**
- Internal only — pure analysis over local files. No external calls.
- Composes with: every other agent (analyzes their outputs). Feedback loop to `me/_profile.md` scoring weights.

**Failure modes.**

| Failure | Fix |
|---|---|
| < 10 reports in `reports/` | Analysis is noise; tell user "need more data" |
| All applications still Evaluated (no outcomes) | Can analyze archetype distribution but not outcome correlations |
| Inconsistent status values | Run `node normalize-statuses.mjs` first |

**When to invoke.**
- User says "what patterns am I missing?" / "/career-ops patterns".
- Monthly cadence (manual trigger today; could be a `workflows/` scheduled job after Phase 6).
- After a rejection cluster — to see if it's recalibration time.

**When NOT to invoke.**
- Sample size too small (< 10 evaluations).

## Related

- The runner → `analyze-patterns.mjs` at root (Phase 7 → `agents/pattern-analyst/runners/`)
- Source data → `reports/`, `data/applications.md`
- The user-layer config this might recommend tuning → `me/_profile.md` / `config/profile.yml`
