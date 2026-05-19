# Career-Ops — Architecture & Folder Map

A scannable overview of what's in this repo and how the pieces fit together. Pair this with `docs/SETUP.md` (how to set it up), `docs/SCRIPTS.md` (per-script reference), and `docs/CUSTOMIZATION.md` (how to tailor it to you).

## What it does

Career-ops is a CLI-agnostic AI job-search pipeline. You point it at a job posting (or it scans portals for you), and it:

1. **Evaluates** the offer against your CV across six dimensions (role fit, comp, level, market, mitigations, interview plan) plus a posting-legitimacy block — produces a markdown report in `reports/`.
2. **Generates** an ATS-optimized PDF resume tailored to the role (HTML→PDF via Playwright, or LaTeX via pdflatex).
3. **(New)** Asks Codex (GPT-5.5 via ChatGPT OAuth) for a second-opinion review of the tailored resume — extracts company language, flags weak bullets, scores resume vs JD, and gives a hiring-manager 10-second skim.
4. **Tracks** the application in a markdown ledger, suggests follow-ups, and prepares interview material when the role advances.
5. **Scales** through a batch flow that spawns headless workers for high-volume processing.

It runs on any AI coding CLI that follows the open agent-skill standard — Claude Code, Codex, Gemini, OpenCode, Qwen, Copilot, Kimi.

## Two-layer mental model (critical)

Per `AGENTS.md`, every file in this repo is either **user layer** (your personal data — never auto-overwritten) or **system layer** (code and prompts — auto-updatable via `update-system.mjs`).

| Layer | Examples | Rule |
|-------|----------|------|
| **User** | `cv.md`, `config/profile.yml`, `modes/_profile.md`, `article-digest.md`, `portals.yml`, `data/*`, `reports/*`, `output/*`, `interview-prep/*` | Personalization goes here. Survives updates. |
| **System** | `modes/_shared.md`, `modes/{oferta,apply,batch,…}.md`, `AGENTS.md`, `*.mjs` scripts, `dashboard/*`, `templates/*`, `batch/*` | Updated by `update-system.mjs`. Don't store user-specific overrides here. |

See `DATA_CONTRACT.md` (referenced in `AGENTS.md`) for the full per-file list.

## Top-level folder map

```
career-ops/
├─ AGENTS.md                      System contract for all CLIs (Claude reads this via CLAUDE.md)
├─ CLAUDE.md                      Claude-specific entrypoint → re-imports AGENTS.md
├─ cv.md                          [USER] Canonical CV — single source of truth for resume content
├─ article-digest.md              [USER] Detailed proof points from your portfolio (optional)
├─ portals.yml                    [USER] Company list + search filters for the scanner
│
├─ config/
│  ├─ profile.example.yml         Template — copy to profile.yml
│  └─ profile.yml                 [USER] Your identity, comp range, target roles, language preference
│
├─ modes/                         The skill prompts the AI reads to know how to behave
│  ├─ _shared.md                  Shared rules — base archetypes, scoring framework, NEVER/ALWAYS lists
│  ├─ _profile.md                 [USER] Your overrides on top of _shared (archetypes, scoring weights, SKIP rules)
│  ├─ _profile.template.md        Template — copy to _profile.md
│  ├─ auto-pipeline.md            Default flow: paste a JD/URL → evaluate → PDF → codex review → tracker
│  ├─ oferta.md                   Single-offer evaluation (blocks A–G)
│  ├─ ofertas.md                  Compare multiple offers side-by-side
│  ├─ apply.md                    Interactive form-fill helper (reads the page, drafts answers)
│  ├─ scan.md                     Zero-token portal scan (calls Greenhouse/Ashby/Lever APIs directly)
│  ├─ pipeline.md                 Process URLs queued in data/pipeline.md
│  ├─ batch.md                    Mass-process offers via batch-runner.sh
│  ├─ pdf.md                      HTML-template CV generation
│  ├─ latex.md                    LaTeX/Overleaf CV generation
│  ├─ codex-review.md             [NEW] Post-CV second-opinion review via Codex CLI
│  ├─ deep.md                     Deep company research
│  ├─ contacto.md                 LinkedIn outreach drafts
│  ├─ interview-prep.md           Company-specific interview intel
│  ├─ training.md                 Course/certification evaluation
│  ├─ project.md                  Portfolio project evaluation
│  ├─ tracker.md                  Query the application tracker
│  ├─ patterns.md                 Rejection-pattern analysis
│  ├─ followup.md                 Follow-up cadence calculator
│  ├─ de/  fr/  ja/  ru/          Localized mode bundles (German, French, Japanese, Russian)
│  └─ tr/                         (Turkish — landed via PR #341 on the worktree branch)
│
├─ templates/                     Source templates the modes reference
│  ├─ cv-template.html            HTML resume template (Space Grotesk + DM Sans)
│  ├─ cv-template.tex             LaTeX resume template
│  ├─ portals.example.yml         Scanner config template (~45 companies pre-wired)
│  └─ states.yml                  Canonical application states (Evaluated, Applied, …)
│
├─ data/                          [USER] State that grows over time
│  ├─ applications.md             The tracker — every offer you've evaluated/applied to
│  ├─ pipeline.md                 Inbox of URLs to process
│  ├─ scan-history.tsv            Scanner dedup history (per-URL fingerprints)
│  └─ follow-ups.md               Follow-up history
│
├─ reports/                       [USER] One markdown report per evaluation (###-{slug}-{date}.md)
│                                 Block G (legitimacy) included in header. Codex reviews land
│                                 here as ###-{slug}-{date}-codex-review.md
│
├─ output/                        [USER, gitignored] Generated PDFs (cv-{candidate}-{company}-{date}.pdf)
│
├─ jds/                           [USER] Saved JD text files referenced as local:jds/{file}
│
├─ interview-prep/                [USER] Story bank + per-company interview intel
│  ├─ story-bank.md               Accumulated STAR+R stories across evaluations
│  └─ {company}-{role}.md         Per-engagement interview prep
│
├─ batch/                         Mass-processing infrastructure (Claude-Code-specific today)
│  ├─ batch-runner.sh             Orchestrator — spawns `claude -p` workers, resumable via .tsv state
│  ├─ batch-prompt.md             Self-contained worker prompt (evaluation + PDF + tracker)
│  ├─ batch-input.tsv             [USER, gitignored] URLs to process
│  ├─ batch-state.tsv             [auto, gitignored] Per-offer progress (id/status/score/report_num)
│  ├─ logs/                       [gitignored] Per-worker logs
│  └─ tracker-additions/          [gitignored] TSV lines that merge-tracker.mjs folds into applications.md
│
├─ dashboard/                     Go TUI for browsing applications (Bubble Tea + Catppuccin theme)
│  ├─ main.go
│  ├─ internal/model/career.go
│  ├─ internal/theme/             Catppuccin palettes
│  └─ internal/ui/screens/progress.go
│
├─ docs/                          Human-facing documentation
│  ├─ SETUP.md                    First-run install + config walkthrough
│  ├─ SCRIPTS.md                  Per-script reference (what each .mjs does)
│  ├─ CUSTOMIZATION.md            How to tailor archetypes, modes, scoring to your career
│  └─ ARCHITECTURE.md             This file
│
├─ providers/                     Job-portal API clients used by scan.mjs
│  ├─ _http.mjs                   Shared HTTP plumbing
│  ├─ greenhouse.mjs              Greenhouse public board API
│  ├─ ashby.mjs                   Ashby public API
│  └─ lever.mjs                   Lever public API
│
├─ examples/                      Reference material new users can copy from
│  ├─ cv-example.md               Example CV in the expected format
│  ├─ article-digest-example.md   Example proof-point digest
│  ├─ sample-report.md            What a finished evaluation looks like
│  └─ dual-track-engineer-instructor/  Worked example for a hybrid IC/educator profile
│
├─ fonts/                         Self-hosted resume fonts (DM Sans, Space Grotesk woff2)
│
├─ .github/                       CI, issue/PR templates, labeler, dependabot, sbom workflow
│
├─ flake.nix / flake.lock         Nix dev shell (optional)
├─ .envrc                         direnv hook (optional)
├─ CITATION.cff                   Cite-this-repo metadata
├─ LICENSE                        MIT
└─ CODE_OF_CONDUCT.md / GOVERNANCE.md / SECURITY.md / SUPPORT.md   Community files
```

## Scripts at the repo root

All are Node ESM (`.mjs`). Run with `node <script>.mjs [args]`.

| Script | What it does |
|--------|--------------|
| `generate-pdf.mjs` | HTML → PDF via Playwright Chromium. ATS-normalizes Unicode (em-dashes, smart quotes) before render. |
| `generate-latex.mjs` | Validates a LaTeX CV and compiles via pdflatex. |
| `scan.mjs` | Zero-LLM portal scan — hits Greenhouse/Ashby/Lever APIs directly using `portals.yml`. Writes new URLs to `data/pipeline.md`. |
| `check-liveness.mjs` | Confirms a job posting is still open before applying (expired-signals-win logic in `liveness-core.mjs`). |
| `merge-tracker.mjs` | Folds `batch/tracker-additions/*.tsv` into `data/applications.md` (handles the col-5/col-6 swap). |
| `dedup-tracker.mjs` | Removes duplicate entries from `applications.md`. |
| `normalize-statuses.mjs` | Forces tracker statuses to the canonical set in `templates/states.yml`. |
| `verify-pipeline.mjs` | Health check — reports must have `**URL:**`, statuses must be canonical, no dupes. |
| `cv-sync-check.mjs` | Detects when `cv.md` has drifted from generated PDFs. |
| `analyze-patterns.mjs` | Rejection-pattern analysis across reports (JSON output). |
| `followup-cadence.mjs` | When-to-follow-up calculator based on `data/follow-ups.md` (JSON output). |
| `doctor.mjs` | Project health check — file presence, config sanity. |
| `test-all.mjs` | 63+ checks run by CI on every PR. |
| `update-system.mjs` | Self-updater — pulls system-layer changes from GitHub, leaves user layer untouched. |
| `gemini-eval.mjs` | Second-opinion evaluator via Gemini (older sibling of the new codex-review pattern). |
| `codex-review.mjs` | **[NEW]** Post-CV review via Codex CLI on ChatGPT OAuth. Reads CV + JD, asks for a 7-section critique. |

## The main data flow

```
   ┌──────────────────────────────────────────────────────────────────────────┐
   │  USER PASTES URL OR JD TEXT                                              │
   └──────────────────────┬───────────────────────────────────────────────────┘
                          │
                          ▼
   ┌──────────────────────────────────────────────────────────────────────────┐
   │  modes/auto-pipeline.md  (the default flow)                              │
   │                                                                          │
   │  Step 0: Extract JD (Playwright > WebFetch > WebSearch)                  │
   │  Step 1: A–G evaluation per modes/oferta.md (using cv.md + _profile.md)  │
   │  Step 2: Save report → reports/{###}-{slug}-{date}.md                    │
   │  Step 3: Generate PDF per modes/pdf.md or modes/latex.md                 │
   │           → /tmp/cv-{candidate}-{slug}.html → output/cv-…-{date}.pdf     │
   │  Step 3.5 (NEW): Codex review per modes/codex-review.md                  │
   │           → reports/{###}-{slug}-{date}-codex-review.md                  │
   │  Step 4: Draft application answers (only if score ≥ 4.5)                 │
   │  Step 5: Append to data/applications.md                                  │
   └──────────────────────────────────────────────────────────────────────────┘

   BATCH FLOW (high-volume):
   batch/batch-input.tsv  →  batch-runner.sh  →  N×(`claude -p` worker)
                                                  │
                                                  ├─ reports/{###}-…
                                                  ├─ output/cv-…
                                                  └─ batch/tracker-additions/{id}.tsv
                                                  │
                                                  ▼
                                          merge-tracker.mjs
                                                  │
                                                  ▼
                                          data/applications.md
```

## Where the new Codex hook lives

Three files were added/modified:

| File | Role |
|------|------|
| `codex-review.mjs` | Node script. Spawns `codex exec -m gpt-5.5 --sandbox read-only` with a 7-section prompt built from `--cv` + `--jd`. Captures stdout to `--out`. Configurable via env: `CODEX_BIN`, `CODEX_MODEL`, `CODEX_SANDBOX`. |
| `modes/codex-review.md` | Skill prompt. Tells the AI when to invoke the script, how to wire inputs, and how to present the seven sections back to the candidate. |
| `modes/auto-pipeline.md` | Step 3.5 inserted between PDF generation and application-answer drafting. Score-gated at ≥ 4.0 to avoid burning cycles on offers you won't apply to. |

**Prerequisites (verified on this host):** Codex CLI installed (`codex-cli 0.131.0`), ChatGPT OAuth session active (`codex login status` returns "Logged in using ChatGPT"), `model = "gpt-5.5"` set in `~/.codex/config.toml`.

## The seven-section Codex review

When the script runs, Codex produces a markdown report with:

1. **Company language** — skills, outcomes, traits the JD uses verbatim
2. **Bullet mapping + gaps** — table of company-language → matched resume bullet → strength
3. **Clarifying questions** — what Codex would ask before rewriting
4. **Assumed answers** — explicit assumptions Codex made to proceed (so you can correct)
5. **Rewritten bullets** — under 20 words, metric-driven, using the company's vocabulary
6. **Score vs JD** — overall fit %, keyword match %, skills %, outcomes %, role fit % + missing terms + weak bullet flags
7. **Hiring-manager 10-second scan** — interview potential, biggest doubts, quick fixes

Re-run with `--answers "Q1: …; Q2: …"` to refine — saves a `-v2.md` next to the original (audit trail preserved).

## Dashboard TUI

The `dashboard/` directory is a standalone Go application (Bubble Tea + the Catppuccin theme) for browsing applications:

- Filter tabs: All, Evaluated, Applied, Interview, Top ≥ 4, SKIP
- Sort modes: Score, Date, Company, Status
- Grouped/flat view
- Lazy-loaded report previews
- Inline status picker

Build and run from the `dashboard/` directory with `go run ./...`.

## Pointers

- **Setting it up for the first time** → `docs/SETUP.md`
- **What each script does** → `docs/SCRIPTS.md`
- **Tailoring the system to your career** → `docs/CUSTOMIZATION.md`
- **System contract / rules** → `AGENTS.md`
- **Examples to copy from** → `examples/`
- **Community** → `CODE_OF_CONDUCT.md`, `GOVERNANCE.md`, Discord link in `AGENTS.md`
