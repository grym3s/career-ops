# Mode: pdf — moved (LostAndLucky restructure, Phase 5)

This mode prompt moved to **`agents/pdf-generator/prompt.md`** as part of the LostAndLucky folder restructure (see `wiki/decisions.md` 2026-05-19). The LaTeX variant is at `agents/pdf-generator/prompt-latex.md`.

**Load `agents/pdf-generator/prompt.md` instead.** See `agents/pdf-generator/CONTEXT.md` for the agent contract. The runner scripts (`generate-pdf.mjs`, `generate-latex.mjs`) still live at the repo root pending Phase 7 — they use `dirname(fileURLToPath(import.meta.url))` for path resolution which would break if moved without lockstep updates.

This stub will be removed in Phase 7 (final cleanup).
