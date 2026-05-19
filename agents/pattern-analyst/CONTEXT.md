# agents/pattern-analyst/

Reads across all evaluations + applications + agent evals; surfaces patterns (which archetypes score high but reject, comp-bands under-targeted, scoring miscalibration). The system's self-correction loop.

| Input | Used | Notes |
|---|---|---|
| `reports/*.md` | yes | All evaluations |
| `data/applications.md` | yes | Status outcomes |
| `agents/*/evals/` | future | Per-agent feedback once populated |

**Outputs.** JSON to stdout (machine-readable). Markdown summary at `reports/_pattern-analysis-{date}.md` planned. Suggestions: "downgrade SKIP threshold for X", "you're under-applying to Y comp band".

**Gates.** User asks "what patterns am I missing?" / monthly cadence / after rejection cluster. Skip if < 10 reports (analysis is noise).

**Composes with:** every agent (analyzes outputs). Feedback loop to `me/_profile.md` scoring weights.

**Failure modes:** sample too small (< 10) → tell user "need more data" · all apps still Evaluated → can analyze archetype dist but not outcome correlations · inconsistent statuses → run `normalize-statuses.mjs` first.

**Files:** `prompt.md`, `analyze-patterns.mjs`.
