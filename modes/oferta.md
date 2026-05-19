# Mode: oferta — moved (LostAndLucky restructure, Phase 4a)

This mode prompt moved to **`agents/evaluator/prompt.md`** as part of the LostAndLucky folder restructure (see `wiki/decisions.md` 2026-05-19).

**Load `agents/evaluator/prompt.md` instead.** Its content is identical to the historical `modes/oferta.md` plus the agent contract (inputs / outputs / failure modes) in the sibling `agents/evaluator/CONTEXT.md`.

This file is kept as a redirect stub during the migration so that:

- `update-system.mjs` SYSTEM_PATHS still resolves cleanly
- `test-all.mjs` Section 5 (`systemFiles`) and Section 8 (`expectedModes`) still pass
- Localized modes (`modes/de/angebot.md`, `modes/fr/offre.md`, `modes/ja/kyujin.md`, `modes/tr/is-ilani.md`, `modes/ru/oferta.md`) that still reference `modes/oferta.md` as the canonical English source keep resolving

This stub will be removed in Phase 7 (final cleanup), once Phase 6 lockstep-updates the test harness, the updater, and the localized modes.
