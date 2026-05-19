# career-ops — open questions

Things known to be unresolved. Each entry has an ID (Q-N), state, and recommended path. Resolve by either (a) making the decision and recording it in `decisions.md`, or (b) deleting the entry if it's no longer relevant.

---

## Q-1 — Locale resolution after Phase 6 overlay

**State.** Pending Phase 6.

After locale modes move from `modes/{de,fr,ja,ru,tr}` (full clones) to `locales/{lang}/agents/{name}/prompt.md` (overlays), `AGENTS.md` needs a resolution rule: when `language.modes_dir = locales/de` is set in `me/profile.yml`, how does the AI decide whether to use `locales/de/agents/evaluator/prompt.md` or fall back to `agents/evaluator/prompt.md`?

**Options.**
- A. Strict: only use the locale prompt if it exists; otherwise fall back to canonical English.
- B. Merge: load both, with the locale prompt prepended as an overlay header.
- C. Per-section override: locale supplies named sections (`## Compensation`, `## Mitigations`) that replace the same-named sections in canonical English.

**Recommendation.** Start with A (strict). Move to C if locale-vs-canonical drift becomes painful — but that won't happen until locale prompts have lived through one update cycle.

---

## Q-2 — Where does `agents/{name}/evals/` data come from?

**State.** Pending Phase 3 (we'll discover this as we ship the first agent contract).

Per-agent `evals/` should capture user feedback ("this Codex rewrite worked", "this evaluator score was too high"). But who writes these files?

**Options.**
- A. User writes them manually after each interaction.
- B. The agent's prompt asks "did this help?" at the end and appends to evals on yes.
- C. A separate `agents/{name}/eval.md` mode that the user invokes when they want to record feedback.

**Recommendation.** Decide after Phase 3 ships and we see real usage of `agents/codex-reviewer/`.

---

## Q-3 — Does `agents/scanner/` keep `providers/` colocated, or stay shared at the repo root?

**State.** Pending Phase 4.

Today `providers/{greenhouse,ashby,lever}.mjs` lives at the repo root and is only used by `scan.mjs`. Phase 4 plan moves scanner into `agents/scanner/`. Question: do `providers/` move into `agents/scanner/providers/`?

**Recommendation.** Yes — only scanner uses them today, and colocation is the LostAndLucky default. If a second consumer emerges (e.g., a "company-watcher" agent), promote to `agents/_shared/providers/`.

---

## Q-4 — `output/` vs `outputs/` naming after Phase 7

**State.** Pending Phase 7.

Current naming: `reports/` (markdown), `output/` (PDFs), `interview-prep/` (per-company prep). Plan was to unify under `outputs/` (plural, matching LostAndLucky's `handoffs/`). But `output/` is also gitignored and aliased in lots of places.

**Recommendation.** Unify to `outputs/` plural. Adds one rename to Phase 7, but eliminates the singular/plural confusion. `update-system.mjs` USER_PATHS needs both paths during transition (a release that ships only the plural would orphan the old singular dir on existing user installs).

---
