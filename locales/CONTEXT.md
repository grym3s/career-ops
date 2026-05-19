# locales/ — language overlays (placeholder)

Overlay layer for non-English job markets. Each locale supplies ONLY the prompt diffs from the canonical English agent prompts — `contract.yml`, `examples/`, `evals/`, and the agent's runners are shared.

## Target shape (after Phase 6)

```
locales/
├─ CONTEXT.md
├─ de/                  German (DACH) — Probezeit, Kündigungsfrist, AGG, 13. Monatsgehalt
│  └─ agents/{name}/prompt.md
├─ fr/                  French (FR/BE/CH/LU) — CDI/CDD, RTT, mutuelle, intéressement
│  └─ agents/{name}/prompt.md
├─ ja/                  Japanese — 正社員, 業務委託, 賞与, みなし残業
│  └─ agents/{name}/prompt.md
├─ ru/                  Russian
│  └─ agents/{name}/prompt.md
└─ tr/                  Turkish — SGK, kıdem tazminatı, AGİ, BES, yemek kartı
   └─ agents/{name}/prompt.md
```

## Why overlay, not fork

Today (`modes/{de,fr,ja,ru,tr}/`) fully clones the English `modes/` for each locale — when an English change lands, all locale clones silently drift. Overlay means each locale ships only the prompt that genuinely differs in that market; everything else inherits from the canonical agent.

## Status (2026-05-19)

Phase 6 (the move) hasn't shipped yet. Locale-specific modes still live at `modes/de/`, `modes/fr/`, `modes/ja/`, `modes/ru/`, `modes/tr/` and `update-system.mjs` SYSTEM_PATHS tracks those paths. Use the legacy locations until Phase 6 ships the overlay + updates `language.modes_dir` resolution in `AGENTS.md`.
