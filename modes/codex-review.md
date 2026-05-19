# Mode: codex-review — Post-CV Review via OpenAI Codex

A second-opinion review pass that runs after a role-tailored resume is generated. Codex (OAuth-logged-in via ChatGPT) reads the JD and the tailored CV and produces a structured seven-section critique.

**Not a CV generator.** This mode only runs *after* `modes/pdf.md` or `modes/latex.md` produced a tailored resume.

## What Codex produces

A single markdown report saved to `reports/{###}-{company-slug}-{YYYY-MM-DD}-codex-review.md` with:

1. **Company language** — skills, outcomes, traits the JD uses verbatim
2. **Bullet mapping + gaps** — table: company language → matched resume bullet → match strength
3. **Clarifying questions** — what Codex would ask before rewriting
4. **Assumed answers** — explicit assumptions Codex made to proceed (so the candidate can correct)
5. **Rewritten bullets** — under 20 words, metric-driven, using company vocabulary
6. **Score vs JD** — overall fit %, keyword match %, skills %, outcomes %, role fit %, missing terms, weak bullet flags
7. **Hiring-manager 10-second scan** — interview potential, biggest doubts, quick fixes

## Prerequisites

- Codex CLI installed and on PATH (or `CODEX_BIN` env var set to the binary)
- `codex login` run once to authorize via ChatGPT OAuth
- Defaults: model `gpt-5.5`, sandbox `read-only` — override per-run via `--model` or env vars `CODEX_MODEL` / `CODEX_SANDBOX`

## When to invoke

Trigger this mode when:
- The user just generated a tailored CV (auto-pipeline step 3, or explicit `/career-ops pdf`) and the score from block A-F was high enough to consider applying
- The user explicitly asks: "run codex review", "get a second opinion on this CV", "score this resume against the JD"

Do NOT invoke automatically if:
- The evaluation score is below 4.0/5 (don't burn cycles reviewing a CV you wouldn't send)
- The candidate has already approved the CV for submission (review before, not after)

## Workflow

### Step 1 — Resolve inputs

You need two file paths:
- **CV path** — the tailored CV content. Preferred: the HTML you wrote to `/tmp/cv-{candidate}-{company}.html` during PDF generation (Codex reads HTML fine). Fallback: `cv.md` if no tailored source was saved.
- **JD path** — the JD text. If you stored it in `/tmp/batch-jd-{id}.txt` (batch flow) or in the report body, write it to a temp file: `/tmp/codex-jd-{slug}.txt`.

### Step 2 — Run the script

```bash
node codex-review.mjs \
  --cv /tmp/cv-{candidate}-{company-slug}.html \
  --jd /tmp/codex-jd-{slug}.txt \
  --out reports/{###}-{company-slug}-{YYYY-MM-DD}-codex-review.md
```

Optional flags:
- `--model <name>` — override the model (default: `gpt-5.5`)
- `--answers "Q1: ...; Q2: ..."` — provide answers to clarifying questions from a previous pass (turns `[ASSUMED]` markers into `[PROVIDED]` in section 4)

### Step 3 — Present results

After the script writes the review file, summarize for the candidate:
- The overall fit % from section 6
- The top 3 weak bullet flags
- The top 3 quick fixes from section 7
- Whether section 3's clarifying questions have answers worth providing for a refinement pass

Ask: "Want me to apply Codex's rewrites to the CV, or refine the review with your answers to the clarifying questions?"

### Step 4 — Optional refinement pass

If the candidate provides answers, run the script again with `--answers`. Save the refined review to `reports/{###}-{company-slug}-{YYYY-MM-DD}-codex-review-v2.md` (don't overwrite v1 — keep both for audit).

### Step 5 — Optional rewrite application

If the candidate approves the rewrites:
1. Open the source CV HTML
2. Replace the matched bullets with the rewrites from section 5
3. Regenerate the PDF (`node generate-pdf.mjs ...`)
4. Note in the report that bullets were updated post-Codex-review

**Never apply rewrites silently.** The candidate sees the rewrite table and approves before any CV file changes.

## Failure modes

| Failure | What it means | Fix |
|---------|---------------|-----|
| `codex binary not found` | Codex CLI not on PATH or not installed | Install Codex; or set `CODEX_BIN` env var to full path |
| `codex exited with code 1` | OAuth session expired or model rejected | Run `codex login`; or try a different `--model` |
| Output is conversational, not 7-section markdown | Model ignored structure | Re-run; if persistent, switch model |
| Prompt too long | CV + JD combined exceeds OS argv limit (~32KB on Windows) | Trim the JD to the role section, or open an issue to switch to stdin/file input |

## Cost note

This is a per-application Codex invocation. Don't loop over the whole batch backlog. Use it on the offers that scored ≥4.0/5 and that the candidate actually plans to apply to.
