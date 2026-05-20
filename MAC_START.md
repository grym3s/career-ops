# MAC_START — Mac-side Claude Code prompt

Open Claude Code in `~/Projects/career-ops/` on the Mac and tell it: **"Read MAC_START.md and follow it."**

---

You are the Mac evaluation worker for Richard Garnett's career-ops job pipeline. Windows handles browser-driven applications; you handle JD evaluations in parallel.

## Read first (in this exact order)

1. `MAC_HANDOFF.md` — full procedural brief (scope, what to do, what NOT to do, output convention, coordination protocol)
2. `mac-handoff-bundle/QUEUE.md` — your 16-URL queue + which 5 to start with
3. `mac-handoff-bundle/SECRETS.md` — Richard's private constraints (PR not citizen, comp range, score gates, voice rules)
4. `agents/evaluator/prompt.md` — Blocks A–G evaluation contract
5. `cv.md` + `memory/user_profile.md` — what you're scoring JDs against

## Your task this session

Evaluate the **first 5 URLs** in `mac-handoff-bundle/QUEUE.md` (Lanson Partners, Nuage Technology, Merivale, HMIA, Global 360). For each one:

1. `WebFetch <url>` to pull the JD content (asking for role, company, requirements, comp, location, work model, apply path)
2. Score Blocks A–G per `agents/evaluator/prompt.md` against `cv.md` + `memory/user_profile.md`
3. Apply Richard's score gates (from `SECRETS.md`):
   - `≥ 4.0` → APPLY
   - `3.0 – 3.9` → APPLY if it's a legit Head-of / Director / GM / CTO / CIO seat AND coherent JD AND low-cost apply path
   - `< 3.0` → SKIP
4. Write the report to `mac-handoff-bundle/reports/{seq}-{slug}-2026-05-20.md` — sequence numbers start at **016** (data/applications.md has 1–15)
5. Append one 9-column TSV row to `mac-handoff-bundle/applications-additions.tsv` per `AGENTS.md` "TSV Format for Tracker Additions" — status `Evaluated`, PDF emoji `❌`

After 5 evaluations, write `mac-handoff-bundle/STATUS.md` with:

```markdown
# Mac evaluation session — 2026-05-20

## Done
- {seq} {slug}: {score}/5 — {one-line verdict}

## Skipped (with reason)
- {slug}: {reason}

## Needs Windows browser handoff (couldn't evaluate via WebFetch)
- {slug}: {reason}

## Recommended Windows next-actions
1. {seq} {slug} — {score} — {why this one first}
```

Then stop. Don't proceed past the first 5 unless Richard tells you to continue.

## Hard rules (will reject the session if violated)

- **Do NOT apply, submit, or open any apply URL** — Submit clicks are Windows + Richard only
- **Do NOT create accounts** on any site
- **Do NOT generate tailored CV PDFs** (`build-cvs.mjs` is Windows-only, not in your bundle)
- **Do NOT modify** `cv.md`, `memory/*`, `data/applications.md`, `data/pipeline.md`, `modes/_profile.md`, `config/*`, `reports/*` (the gitignored top-level reports/, not mac-handoff-bundle/reports/) — these are Windows-canonical, you are read-only on them
- **Do NOT run** `scan.mjs`, `batch-runner.sh`, or any portal scanner — would diverge `data/scan-history.tsv`
- **Do NOT push to git** — outputs travel back via tarball, branch is read-only on Mac side
- **Do NOT auto-update** career-ops (`update-system.mjs apply`) — Windows is authoritative
- **No em-dashes** in any drafted copy (cover letter snippets in reports, summary text) — use commas, periods, or parens
- **PR not citizen** — never claim Australian citizenship; the right phrase is "Australian Permanent Resident"
- **Comp floor AUD $220K** — score Block D badly below this, recommend SKIP at <$200K unless there's a very specific reason

## Citizenship-sensitive URLs in the queue

Three URLs in QUEUE.md (Audit Office of NSW, Infrastructure NSW, Infrastructure Australia) may require Australian citizenship rather than PR. **Verify the JD's eligibility section before scoring.** If citizenship is required and PR isn't accepted, score Block A low and recommend SKIP regardless of other fits. These are in positions 9, 10, 15 — not in your first-5 scope unless explicitly told to extend.

## When you finish

1. Write `mac-handoff-bundle/STATUS.md` (template above)
2. Tar the bundle: `cd ~/Projects/career-ops && tar -czvf ~/Downloads/career-ops-mac-results-2026-05-20.tar.gz mac-handoff-bundle/`
3. Tell Richard the tarball path so he can move it back to Windows
4. **Do not push to git. Do not commit anything to feat/mac-evaluations.** Exit.

## If something is off

| Symptom | Action |
|---|---|
| WebFetch returns a login wall or captcha | Note `## Apply path: external ATS — Windows browser handoff required` in the report, skip deep eval, continue |
| JD URL is 404 / expired | Mark `### Verdict: SKIP — posting closed` in report, continue |
| `mac-handoff-bundle/` is missing | Stop. Tell Richard the tarball didn't restore properly |
| Anything ambiguous about Richard's preferences | Read `memory/user_profile.md` end-to-end. If still ambiguous, surface to Richard in your final STATUS.md — don't guess |
| You hit the same failure twice on the same URL | STOP, write the partial work to STATUS.md, surface the blocker. Don't try a third approach (per Richard's retry-cap rule) |

## Sanity checks before you start

Run these three commands; if any fail, stop and tell Richard:

```bash
ls -la cv.md mac-handoff-bundle/QUEUE.md mac-handoff-bundle/SECRETS.md memory/user_profile.md agents/evaluator/prompt.md
git branch --show-current   # should be feat/mac-evaluations
PATH=/opt/homebrew/bin:$PATH node test-all.mjs --quick 2>&1 | tail -3   # 85/2/27 is the expected baseline — anything worse, stop
```

Now read `MAC_HANDOFF.md` in full, then `QUEUE.md`, then `SECRETS.md`, then start evaluation #1 (Lanson Partners — Head of Digital & AI Delivery, SEEK 92143674).
