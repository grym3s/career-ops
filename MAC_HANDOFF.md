# MAC_HANDOFF — career-ops evaluation worker (Mac side)

Procedural handoff for a Claude Code session running on Mac, working in parallel with the primary Windows session. Mac does **evaluations only**; Windows handles browser-driven applications.

This document is **public-safe**. Personal context (CV, profile, target URLs, prior applications) ships separately in `career-ops-userlayer-{date}.tar.gz` via the user's own channel (iCloud / Dropbox / OneDrive / AirDrop), **not via git**.

---

## Why split work this way

- **Browser sessions are pinned to Windows.** The apply flow uses `browser-harness` over CDP to a logged-in Chrome at `127.0.0.1:9222` on Windows. SEEK/LinkedIn/Indeed cookies, MFA, device-trust prompts — all live there. Re-auth on Mac means new device prompts, possible captcha, possibly 2FA SMS, and a worse session.
- **Submit clicks are user-only.** Per `AGENTS.md` "Ethical Use" rule, the agent never clicks Submit. So "background autonomous applies" is not a thing in either OS.
- **Evaluation is pure file I/O.** Fetch JD content → score against `cv.md` + `memory/user_profile.md` → write report. No browser session, no auth, no apply path. Parallelisable across machines.

The split: Mac evaluates the backlog, Windows applies to whatever scored high.

---

## Prerequisites on Mac

1. **Claude Code** installed (`brew install --cask claude-code` or the dmg, latest version with Skill / TaskCreate support)
2. **Node.js 18+** (`brew install node` or via Homebrew already present per `~/.zshrc`)
3. **git** (Xcode Command Line Tools — `xcode-select --install` if missing)
4. **No browser-harness, no Chrome remote debugging needed** on Mac — evaluation uses `WebFetch` only

That's the whole Mac toolchain for this scope.

---

## Setup (supervised, ~5 min)

### 1. Clone the repo

```bash
mkdir -p ~/Projects
cd ~/Projects
git clone git@github.com:grym3s/career-ops.git
cd career-ops
git checkout feat/mac-evaluations
```

(If SSH not set up: use the HTTPS URL `https://github.com/grym3s/career-ops.git` and let GitHub prompt for credentials / PAT.)

### 2. Restore the user-layer bundle

The Windows side wrote `career-ops-userlayer-{date}.tar.gz` to `C:\Users\admin\Downloads\` (or wherever the user moved it). Get it onto the Mac via whichever channel is easiest:

- **iCloud Drive** — Windows → iCloud for Windows → drag the tarball into iCloud Drive folder → Mac picks it up
- **Dropbox / OneDrive / Google Drive** — same idea
- **AirDrop** — only works if Windows-to-Mac AirDrop has a bridge (rare; usually requires both Macs)
- **USB stick** — works always
- **scp** over local network — if SSH is configured between machines

Once the tarball is on the Mac, untar from the repo root:

```bash
cd ~/Projects/career-ops
tar -xzvf ~/Downloads/career-ops-userlayer-2026-05-20.tar.gz
```

The tarball restores these (all gitignored — they will never be committed):

```
cv.md                              # canonical CV
data/applications.md               # 15 prior applications (don't re-evaluate these)
data/pipeline.md                   # 35 URLs queued (16 in Mac scope)
data/scan-history.tsv              # scanner dedup history
memory/                            # user profile + SEEK playbook + voice rules + prior decisions
modes/_profile.md                  # user-specific archetypes + targeting narrative
reports/                           # 8 prior reports for calibration reference
interview-prep/story-bank.md       # STAR+R stories
.opencode/                         # slash commands
mac-handoff-bundle/QUEUE.md        # Mac-specific URL queue (see "Scope" below)
mac-handoff-bundle/SECRETS.md      # private constraint summary (PR status, comp range, etc.)
```

### 3. Verify

```bash
node test-all.mjs --quick
```

Expect `88/0/1` (1 warning is `cv-sync-check.mjs` — known, not blocking). If `cv.md` is missing or memory/ didn't untar, this will tell you.

### 4. Read these before any evaluation

In order:

1. `mac-handoff-bundle/SECRETS.md` — Richard's hard constraints (PR status, comp, voice rules, score gates)
2. `memory/user_profile.md` — full profile, ~5KB
3. `memory/reference_seek_apply_playbook.md` — SEEK-specific gotchas (not all relevant since Mac doesn't apply, but useful for scoring "low-cost apply path" criterion)
4. `agents/evaluator/prompt.md` — the A–G evaluation contract
5. `cv.md` — the canonical CV to score JDs against

---

## Scope (what Mac actually does)

**16 URLs reserved for Mac**, listed in `mac-handoff-bundle/QUEUE.md`. Top 5 are reserved for Windows (the strongest matches — Windows applies first to those).

For each URL in the queue:

1. **Fetch the JD content** via `WebFetch <url> "Extract the full JD: role, company, responsibilities, requirements, comp/benefits if listed, location, hybrid/remote/onsite, application path"`
2. **Score A–G** per `agents/evaluator/prompt.md` — six fit blocks plus Block G (Posting Legitimacy)
3. **Write report** to `mac-handoff-bundle/reports/{slug}-2026-05-20.md` (NOT `reports/` — that's gitignored, won't transport back)
4. **Append TSV row** to `mac-handoff-bundle/applications-additions.tsv` per the 9-column format in `AGENTS.md`
5. **Tick the URL** in `data/pipeline.md` (in-tarball copy; will be reconciled on Windows)
6. **Move on to the next URL**

Score gates (from `mac-handoff-bundle/SECRETS.md`):

- `≥ 4.0` → recommend apply
- `3.0–3.9` → recommend apply if **legit Head-of / Director / GM seat** AND coherent JD AND low-cost apply path
- `< 3.0` → SKIP, document why

Mac **does not**:
- Apply, submit, or open any apply URL in a browser
- Generate tailored CVs (`build-cvs.mjs` is intentionally excluded — Playwright dependency, Windows-only)
- Write cover letters as PDFs (markdown drafts only, in the report under a `## Cover letter draft` section)
- Modify `cv.md`, `memory/`, `modes/_profile.md`, or `config/profile.yml` — these are user-curated, Windows authoritative
- Run `scan.mjs` or any portal scanner (would diverge from Windows scan-history)

---

## Output convention

Everything Mac produces lives under `mac-handoff-bundle/`:

```
mac-handoff-bundle/
├── QUEUE.md                          # the 16 URLs (read-only reference from tarball)
├── SECRETS.md                        # Richard's private context (read-only reference)
├── reports/
│   ├── {slug}-2026-05-20.md          # one report per evaluated URL
│   └── ...
├── applications-additions.tsv         # 9-column TSV, one row per eval
├── STATUS.md                          # short summary written at session end
└── pipeline-updates.md                # any URLs to add (if scans extend the queue)
```

**Important:** `mac-handoff-bundle/` is gitignored (see `.gitignore` "Mac handoff bundle" stanza). Outputs travel back to Windows via the **same tarball channel** Mac received the inbound bundle — Mac tars its bundle at session end and sends it back the way it came.

```bash
# At Mac session end:
cd ~/Projects/career-ops
tar -czvf ~/Downloads/career-ops-mac-results-2026-05-20.tar.gz mac-handoff-bundle/
# Move via iCloud / Dropbox / etc. back to Windows
```

Windows then untars and reconciles: copies `mac-handoff-bundle/reports/*` into `reports/`, appends the TSV to `data/applications.md` via `node merge-tracker.mjs`, ticks the corresponding URLs in `data/pipeline.md`.

---

## Hard constraints (also in SECRETS.md — repeated here for emphasis)

| Rule | Reason |
|---|---|
| **No em-dashes** in any drafted copy (cover letters, emails, summary text) | Richard's voice |
| **PR not citizen** — never claim citizenship; "Australian PR" is the right phrase | Factual + legal |
| **Apply at 3.0+** for legit Head-of/Director/GM, not 4.0 default | Richard's expanded appetite, documented in user_profile.md |
| **Mac never submits anything** | Submit-only-by-user rule from AGENTS.md |
| **Mac never creates accounts** on Richard's behalf | Safety policy |
| **No browser-harness, no apply attempts** | Out of scope |
| **Comp target AUD $250K–$350K** (min $220K) | If JD lists comp < $220K, score it down accordingly |
| **Sydney AU based; hybrid or remote-AU OK; NOT fully onsite-only** | Location filter |

---

## Coordination protocol

Two heads on the same repo state — these rules prevent merge churn:

1. **Mac never edits Windows-canonical files.** `cv.md`, `data/applications.md`, `data/pipeline.md`, `memory/`, `modes/_profile.md`, `reports/` — read only. Mac writes to `mac-handoff-bundle/` exclusively.

2. **Tarball is the only sync channel.** No git pull from Mac, no git push from Mac. The branch `feat/mac-evaluations` exists for Mac to clone the code state, not for round-tripping data.

3. **Windows is authoritative** for the merge — Windows decides which Mac evaluations land, in what order, with what edits.

4. **Sessions are bounded.** Mac works one batch (typically 5–10 evals), then tars + sends back. Don't try to "run forever in the background" — every batch should end with a tarball handoff so Windows can act on results promptly.

---

## What to do if something is off

| Symptom | Action |
|---|---|
| Tarball untar fails / missing files | Stop. Tell user. Don't proceed with stale data. |
| `node test-all.mjs --quick` fails | Stop. Read the failure. If it's the known `cv-sync-check` warning (status `0/0/1`), proceed. Anything else, stop and report. |
| URL in QUEUE.md returns 404 / expired | Mark `### Verdict: SKIP — posting closed` in report, still write the report, continue |
| URL redirects to an external ATS Mac can't read via WebFetch (Workday, Greenhouse, etc.) | Note `## Apply path: external ATS — Windows browser handoff required` and skip the deep eval — Windows browser-harness will handle |
| JD requires citizenship | Score Block A appropriately, recommend SKIP unless role accepts PR |
| Score lands exactly at 4.0 | Apply gate ≥, so 4.0 = apply |

---

## At session end

Write `mac-handoff-bundle/STATUS.md` with:

```markdown
# Mac evaluation session — {date}

## Done
- {slug}: {score}/5 — {one-line verdict}
- ...

## Skipped (with reason)
- {slug}: {reason}

## Needs Windows browser handoff (couldn't evaluate via WebFetch)
- {slug}: {reason}

## Recommended Windows next-actions (sorted by priority)
1. {slug} — {score} — {why this one first}
2. ...
```

Then tar and send back per the "Output convention" section above.

---

## Don't do (red flags)

- **Don't `git push`** from Mac. Branch is read-only on Mac side. Outputs travel via tarball.
- **Don't `git pull --rebase`** without checking what Windows has changed. Safest: don't pull at all once you've cloned `feat/mac-evaluations`. Use what's in the tarball as authoritative for user-layer state.
- **Don't run `scan.mjs`** or any portal scanner — would diverge `data/scan-history.tsv`.
- **Don't try to install browser-harness** on Mac to "be thorough" — explicitly out of scope, and the live Chrome session is on Windows.
- **Don't auto-update career-ops** (`node update-system.mjs apply`) — Windows is authoritative for branch state.
- **Don't commit `mac-handoff-bundle/`** — gitignored; tarball-only.

---

## End state expected

After a Mac batch + Windows reconcile:

- `data/applications.md` has new rows with status `Evaluated`
- `reports/` has new `{###}-{slug}-2026-05-20.md` reports
- `data/pipeline.md` has ticked checkboxes for Mac-evaluated URLs
- Windows knows which evaluations cleared the score gate and can proceed to Step 2 (CV generation) for those, leaving Mac free to take another batch

That's the cycle.

---

## File-by-file pointer (so the next agent doesn't have to grep)

| What | Where |
|---|---|
| The 16-URL Mac queue | `mac-handoff-bundle/QUEUE.md` (in tarball) |
| Richard's private context | `mac-handoff-bundle/SECRETS.md` (in tarball) |
| Evaluator contract (the A–G blocks) | `agents/evaluator/prompt.md` (in repo, public) |
| Canonical CV | `cv.md` (in tarball, gitignored in repo) |
| User profile | `memory/user_profile.md` (in tarball) |
| SEEK apply playbook | `memory/reference_seek_apply_playbook.md` (in tarball) |
| Voice rule: no em-dashes | `memory/feedback_no_em_dashes.md` (in tarball) |
| TSV format reference | `AGENTS.md` "TSV Format for Tracker Additions" section (in repo, public) |
| Canonical states list | `templates/states.yml` (in repo, public) |
| Don't-redo list (April 14 applies) | `data/applications.md` (in tarball) |

---

## Branch state

- Branch: `feat/mac-evaluations` (created from `feat/agent-first-layout` on Windows 2026-05-20)
- Pushed to: `git@github.com:grym3s/career-ops.git`
- Contains: code state + this MAC_HANDOFF.md only. **No user-layer files in git.**
