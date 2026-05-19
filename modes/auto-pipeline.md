# Mode: auto-pipeline — Full Automatic Pipeline

When the user pastes a JD (text or URL) without an explicit sub-command, execute the ENTIRE pipeline in sequence:

## Step 0 — Extract JD

If the input is a **URL** (not pasted JD text), follow this strategy to extract the content:

**Priority order:**

1. **Playwright (preferred):** Most job portals (Lever, Ashby, Greenhouse, Workday) are SPAs. Use `browser_navigate` + `browser_snapshot` to render and read the JD.
2. **WebFetch (fallback):** For static pages (ZipRecruiter, WeLoveProduct, company career pages).
3. **WebSearch (last resort):** Search for the role title + company in secondary portals that index the JD in static HTML.

**If no method works:** Ask the candidate to paste the JD manually or share a screenshot.

**If the input is JD text** (not a URL): use directly, without needing to fetch.

## Step 1 — A-G Evaluation

Execute the same as the `oferta` mode (read `modes/oferta.md` for all A-F blocks + Block G Posting Legitimacy).

## Step 2 — Save Report .md

Save the full evaluation in `reports/{###}-{company-slug}-{YYYY-MM-DD}.md` (see format in `modes/oferta.md`).
Include Block G in the saved report. Add **URL:** {url} and **Legitimacy:** {tier} to the report header.

## Step 3 — Generate PDF

Read `config/profile.yml`. Check `cv.output_format`:

- If `"latex"`, execute the full pipeline from `modes/latex.md`
- Otherwise (default), execute the full pipeline from `modes/pdf.md`

## Step 3.5 — Codex Review (optional, score >= 4.0)

If the evaluation score from Step 1 is >= 4.0 AND the Codex CLI is installed (`codex --version` succeeds), offer a second-opinion review of the tailored resume.

Ask once: "Run Codex review on the tailored CV? (extracts company language, flags weak bullets, scores resume vs JD)"

If yes, follow `agents/codex-reviewer/prompt.md` (LostAndLucky restructure moved this from the old `modes/codex-review.md` path in Phase 3). The script call is:

```bash
node agents/codex-reviewer/runners/codex-review.mjs \
  --cv /tmp/cv-{candidate}-{company-slug}.html \
  --jd /tmp/codex-jd-{company-slug}.txt \
  --out reports/{###}-{company-slug}-{YYYY-MM-DD}-codex-review.md
```

You may need to first write the JD text to `/tmp/codex-jd-{company-slug}.txt` if it isn't already on disk. After the review file is written, summarize the overall fit %, top weak bullets, and top quick fixes for the candidate before moving on.

Skip this step silently if Codex is not installed, if the score is below 4.0, or if the candidate has previously declined Codex review in this session.

## Step 4 — Draft Application Answers (only if score >= 4.5)

If the final score is >= 4.5, generate a draft of responses for the application form:

1. **Extract form questions**: Use Playwright to navigate to the form and take a snapshot. If they cannot be extracted, use the generic questions.
2. **Generate responses** following the tone (see below).
3. **Save in the report** as section `## H) Draft Application Answers`.

### Generic questions (use if they cannot be extracted from the form)

- Why are you interested in this role?
- Why do you want to work at [Company]?
- Tell us about a relevant project or achievement
- What makes you a good fit for this position?
- How did you hear about this role?

### Tone for Form Answers

**Position: "I'm choosing you."** The candidate has options and is choosing this company for specific reasons.

**Tone rules:**
- **Confident without arrogance**: "I've spent the past year building production AI agent systems — your role is where I want to apply that experience next"
- **Selective without arrogance**: "I've been intentional about finding a team where I can contribute meaningfully from day one"
- **Specific and concrete**: Always reference something REAL from the JD or the company, and something REAL from the candidate's experience
- **Direct, without fluff**: 2-4 sentences per response. No "I'm passionate about..." or "I would love the opportunity to..."
- **The hook is the proof, not the statement**: Instead of "I'm great at X", say "I built X that does Y"

**Framework per question:**
- **Why this role?** → "Your [specific thing] maps directly to [specific thing I built]."
- **Why this company?** → Mention something specific about the company. "I've been using [product] for [time/purpose]."
- **Relevant experience?** → A quantified proof point. "Built [X] that [metric]. Sold the company in 2025."
- **Good fit?** → "I sit at the intersection of [A] and [B], which is exactly where this role lives."
- **How did you hear?** → Honest: "Found through [portal/scan], evaluated against my criteria, and it scored highest."

**Language**: Always in the language of the JD (EN default). Apply `/tech-translate`.

## Step 5 — Update Tracker

Record it in `data/applications.md` with all columns including Report and PDF as ✅.

**If any step fails**, continue with the next ones and mark the failed step as pending in the tracker.
