# agents/deep-research/ — deep company / market research

Multi-source research dive on a specific company or role/market. More thorough than the evaluator's Block D — used when the candidate is seriously considering applying and wants to understand the company's fundamentals before investing interview prep time.

## Folder layout

```
agents/deep-research/
├─ CONTEXT.md     (this file)
├─ prompt.md      — was modes/deep.md
├─ runners/       — empty (prompt-only)
├─ examples/
└─ evals/
```

**Inputs.**
- Company name.
- Role title.
- Optional: existing report at `reports/{###}-{company}-*.md` as a starting point.

**Outputs.**
- Markdown report saved to `reports/{###}-{company}-{date}-deep.md` OR appended to the existing report as a section.
- Covers: financial health, recent layoffs / hiring freezes, leadership turnover, eng-blog / culture signals, comp benchmarks, glassdoor / blind sentiment, recent product launches, ICP / market position.

**Dependencies.**
- External: WebSearch (multiple queries), occasional WebFetch for eng blogs / press releases.
- Internal: Existing report (if any) for cross-reference.
- Composes with: `agents/evaluator/` (provides starting context), `agents/interview-coach/` (consumes deep research for interview prep).

**Failure modes.**

| Failure | Fix |
|---|---|
| Private company, no public financials | Mark "no data" — never invent numbers |
| Recent layoffs in different department than role | Note in report; weight carefully |
| Glassdoor / Blind data is stale | Cite the date; weight recency |

**When to invoke.**
- User says "tell me more about X" / "research X for me" / "/career-ops deep {company}".
- Before a final interview round.
- After a high-fit evaluation when the user is on the fence.

**When NOT to invoke.**
- The basic Block D from the evaluator is sufficient.
- Cost-aware mode: deep research = multiple WebSearches, more expensive than basic eval.

## Respect the user's language

Always produces output in the user's language (`me/profile.yml` `language.modes_dir`), NOT the JD's language. PR #568 made this explicit.

## Related

- Initial research depth → `agents/evaluator/` Block D
- Downstream consumer → `agents/interview-coach/`, `agents/contact-writer/`
