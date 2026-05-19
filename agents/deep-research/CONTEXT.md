# agents/deep-research/

Multi-source company / market research dive. Deeper than the evaluator's Block D — used when seriously considering applying.

| Input | Required | Notes |
|---|---|---|
| Company name | yes | |
| Role title | yes | |
| Existing report | optional | Starting point if already evaluated |

**Outputs.** `reports/{###}-{company}-{date}-deep.md` OR appended to existing report. Covers financial health, recent layoffs / hiring freezes, leadership turnover, eng-blog signals, comp benchmarks, Glassdoor/Blind sentiment, recent launches, ICP/market position.

**Gates.** User explicitly asks "tell me more about X" / "/career-ops deep {company}". Or before a final interview round.

**Composes with:** `agents/evaluator/` (Block D seed), `agents/interview-coach/` (consumes for prep), `agents/contact-writer/` (consumes for outreach hooks).

**Failure modes:** private company, no public financials (mark "no data", never invent) · recent layoffs different dept than role (note, weight carefully) · stale Glassdoor (cite date, weight recency).

**Language:** Always produces output in user's `language.modes_dir`, NOT the JD's language (PR #568).

**Files:** `prompt.md`. No runner.
