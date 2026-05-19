# agents/codex-reviewer/ — second-opinion CV review via Codex CLI

Post-CV-generation second-opinion review. Hands a tailored resume + the JD to the OpenAI Codex CLI (OAuth-logged-in via ChatGPT, no API key) and produces a structured 7-section critique.

This is the **proof-of-concept agent contract** for the LostAndLucky restructure (Phase 3, decision `wiki/decisions.md` 2026-05-19). Phases 4–5 promote 11 more agents to this same shape.

## Folder layout (the agent contract)

```
agents/codex-reviewer/
├─ CONTEXT.md     (this file)           — the contract: what / when / inputs / outputs / failures
├─ prompt.md                            — the AI skill prompt (was modes/codex-review.md)
├─ runners/
│  └─ codex-review.mjs                  — the Node script (was ./codex-review.mjs at root)
├─ examples/                            — sample input + sample output pairs (empty until first run)
└─ evals/                               — user feedback ("this rewrite worked", "rewrite was generic") (empty until first run)
```

**Inputs.**
- `--cv <path>` — required. Tailored CV. Preferred format: HTML written to `/tmp/cv-{candidate}-{company}.html` during PDF generation. Fallback: `cv.md` (today) / `me/cv.md` (after Phase 7).
- `--jd <path>` — required. Job description text file, e.g. `/tmp/codex-jd-{company-slug}.txt`.
- `--answers <string>` — optional. Provide answers to clarifying questions from a previous pass (turns `[ASSUMED]` markers into `[PROVIDED]` in section 4).
- `--model <name>` — optional. Default `gpt-5.5` (env `CODEX_MODEL`).
- `--out <path>` — optional. Where to save the review markdown. If omitted, prints to stdout only.

**Outputs.**
- `reports/{###}-{company-slug}-{YYYY-MM-DD}-codex-review.md` — the 7-section markdown report.
- Refinement runs save to `…-codex-review-v2.md` (audit trail preserved).

**Dependencies.**
- External: Codex CLI on PATH (or `CODEX_BIN` env var), ChatGPT OAuth session (`codex login status` returns "Logged in").
- Internal: `runners/codex-review.mjs` (this agent's runner).
- Composes with: `agents/pdf-generator/` (provides the HTML CV input) and `agents/evaluator/` (produces the JD + score gate).

**Failure modes.**

| Failure | What it means | Fix |
|---|---|---|
| `codex binary not found` | Codex CLI not on PATH | Install Codex; or set `CODEX_BIN` env var to full path |
| `codex exited with code 1` | OAuth session expired or model rejected | `codex login`; or try a different `--model` |
| Output not 7-section markdown | Model ignored structure | Re-run; switch model if persistent |
| Argv length exceeded (~32KB Windows) | CV + JD combined too long | Trim JD to role section; or switch to file-based input (issue tracked) |

**When to invoke.**
- The user just generated a tailored CV via `agents/pdf-generator/` (or legacy `generate-pdf.mjs` / `generate-latex.mjs`) AND the evaluator score is ≥ 4.0.
- The user explicitly says "run codex review", "get a second opinion on this CV", "score this resume against the JD".

**When NOT to invoke.**
- Evaluator score < 4.0 (don't burn Codex cycles on a CV you wouldn't send).
- The candidate has already approved the CV for submission (review goes *before* submission, never after).

**Cost note.** Per-application Codex invocation. Don't loop over the whole batch backlog — the user pays per call. Gate strictly on score ≥ 4.0 unless the user explicitly overrides.

## How to invoke

Direct (manual):
```bash
node agents/codex-reviewer/runners/codex-review.mjs \
  --cv /tmp/cv-{candidate}-{company-slug}.html \
  --jd /tmp/codex-jd-{slug}.txt \
  --out reports/{###}-{company-slug}-{YYYY-MM-DD}-codex-review.md
```

From auto-pipeline (Step 3.5): see `modes/auto-pipeline.md` — the workflow gates on score and Codex availability, then loads `prompt.md` as the skill and calls the runner above.

## Related

- The skill prompt the AI loads → `prompt.md` (this folder)
- The runner script → `runners/codex-review.mjs` (this folder)
- The workflow that gates and composes → `modes/auto-pipeline.md` (today) / `workflows/auto-pipeline/` (after Phase 6)
- Upstream agent that produces the CV → `agents/pdf-generator/` (Phase 5) / `generate-pdf.mjs` (today)
- Upstream agent that produces the score → `agents/evaluator/` (Phase 4) / `modes/oferta.md` (today)
