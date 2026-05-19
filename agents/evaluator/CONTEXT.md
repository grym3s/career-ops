# agents/evaluator/ — core offer evaluation (single or multi)

The highest-value agent in the system. Produces the A–G evaluation that gates every downstream step (PDF generation, Codex review, application drafting). Reads `cv.md` + `me/_profile.md` (today: `modes/_profile.md`) against the JD and outputs the canonical report.

## Folder layout

```
agents/evaluator/
├─ CONTEXT.md     (this file)               — the contract
├─ prompt.md                                — single-offer A–G evaluation (was modes/oferta.md)
├─ compare.md                               — multi-offer comparison (was modes/ofertas.md)
├─ runners/                                 — empty for now (evaluator is prompt-only; no .mjs runner)
├─ examples/                                — sample evaluations from `examples/sample-report.md`
└─ evals/                                   — user feedback on scoring calibration
```

**Inputs.**
- JD text (pasted) OR JD URL (extracted via Playwright → WebFetch → WebSearch fallback chain in `modes/auto-pipeline.md` Step 0).
- `cv.md` (today at root) / `me/cv.md` (after Phase 7).
- `modes/_shared.md` (system layer — base archetypes, scoring framework, NEVER/ALWAYS lists).
- `modes/_profile.md` (today) / `me/_profile.md` (after Phase 7) — user overrides on top of `_shared.md`.

**Outputs.**
- `reports/{###}-{company-slug}-{YYYY-MM-DD}.md` — 7-block report (A–F evaluation + G legitimacy).
- A score 1–5 used by downstream agents as the gate (codex-reviewer at ≥ 4.0, application drafting at ≥ 4.5).
- An entry in `data/applications.md` (status `Evaluated`).

**Dependencies.**
- External: WebSearch for Block D (comp + demand) and Block G (company hiring signals).
- Internal: `modes/_shared.md` (archetype list) + `me/_profile.md` (user overrides).
- Composes with: `agents/pdf-generator/` (gets the score-gated tailored CV next), `agents/codex-reviewer/` (gets the score for its 4.0 gate).

**Failure modes.**

| Failure | What it means | Fix |
|---|---|---|
| JD extraction fails (Step 0) | Playwright + WebFetch + WebSearch all returned empty/error | Ask the candidate to paste the JD manually or share a screenshot |
| Archetype detection ambiguous | JD matches 0 or 3+ archetypes equally | Pick the closest 2 and note in Block A; downstream gating still works |
| No comp data in Block D | WebSearch returned nothing useful | State "no data" — never invent comp numbers |
| Score uncalibrated | User says "too high" / "too low" repeatedly | Update `me/_profile.md` weighting or SKIP rules — never adjust `modes/_shared.md` |

**When to invoke.**
- User pastes a URL or JD text without an explicit sub-command → auto-pipeline Step 1.
- User says "evaluate this offer", "score this role", "is this worth applying to".
- User says "compare these N offers" → load `compare.md` instead of `prompt.md`.

**When NOT to invoke.**
- User is asking about an offer already in `data/applications.md` — go to `agents/tracker/` instead.
- User is asking "what's a fair counter-offer" mid-negotiation — that's a different agent (negotiation, not yet promoted).

## Score → gate map

| Score | Gates |
|---|---|
| < 4.0 | Skip Codex review, skip PDF generation by default. Mark `Evaluated` in tracker. |
| ≥ 4.0 | Generate tailored CV via `agents/pdf-generator/`. Offer Codex review. |
| ≥ 4.5 | Draft application answers (auto-pipeline Step 4). |

## Related

- The skill prompt (single offer) → `prompt.md`
- The skill prompt (compare N) → `compare.md`
- Shared archetypes + scoring framework → `modes/_shared.md`
- User overrides → `modes/_profile.md` (today) / `me/_profile.md` (Phase 7)
- Where reports land → `reports/` (today) / `outputs/reports/` (Phase 7)
- The workflow that gates everything off this score → `modes/auto-pipeline.md`
- Localized evaluator prompts (will become locale overlays in Phase 6) → `modes/{de/angebot,fr/offre,ja/kyujin,tr/is-ilani,ru/oferta}.md`
