# locales/ — language overlays

Overlay layer for non-English job markets. Each locale supplies the prompts that genuinely differ from canonical English — the agent contract (`CONTEXT.md`, `runners/`, `examples/`, `evals/`) is shared with `agents/{name}/`.

## Resolution rule

When the AI needs an agent's prompt, it resolves in this order:

1. **If `language.modes_dir` is set in `me/profile.yml`** (e.g. `locales/de`):
   - Try `locales/{lang}/agents/{agent}/prompt.md` — load if exists.
   - Else fall back to `agents/{agent}/prompt.md` (canonical English).
2. **Else** (no locale set):
   - Load `agents/{agent}/prompt.md` (canonical English).

Same shape for workflows: `locales/{lang}/workflows/{workflow}/definition.md` overlays `workflows/{workflow}/definition.md`.

`_shared.md` is special — `locales/{lang}/_shared.md` fully replaces `modes/_shared.md` for that locale (it's the locale-specific archetype list, scoring framework, NEVER/ALWAYS rules). Not an overlay — a full replacement.

## Current locale coverage

| Locale | Evaluator | Apply-helper | Interview-coach | Pipeline-drain | _shared | README |
|---|---|---|---|---|---|---|
| **de** (DACH — DE/AT/CH) | ✅ | ✅ | — (uses English) | ✅ | ✅ | ✅ |
| **fr** (FR/BE/CH/LU) | ✅ | ✅ | — | ✅ | ✅ | ✅ |
| **ja** (Japan) | ✅ | ✅ | — | ✅ | ✅ | ✅ |
| **ru** (Russia) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **tr** (Turkey) | ✅ | ✅ | — | ✅ | ✅ | ✅ |
| **pt** (Brazil / Portugal) | ✅ | ✅ | — | ✅ | ✅ | ✅ |

Other agents (`codex-reviewer`, `scanner`, `pdf-generator`, `tracker`, `deep-research`, `contact-writer`, `pattern-analyst`, `followup-planner`, `training-eval`, `project-eval`) currently have no locale overlays — they fall back to canonical English.

## Why overlay, not fork

Before Phase 6, locales lived as full clones of `modes/` under `modes/{lang}/`. When the English `modes/oferta.md` updated, all locale clones (`modes/de/angebot.md`, `modes/fr/offre.md`, …) silently drifted. The overlay model means each locale ships **only the prompt that's intentionally different**; everything else (contract, runners, examples, evals) is the canonical English — guaranteed in sync.

When the canonical English prompt updates, locale prompts are explicitly the "things we needed to translate / re-frame for this market" — small, focused, hand-maintained.

## File layout per locale

```
locales/{lang}/
├─ _shared.md                              — locale's archetypes + scoring (full replacement of modes/_shared.md)
├─ README.md                                — locale onboarding
├─ agents/
│  ├─ evaluator/prompt.md                   — was modes/{lang}/{angebot,offre,kyujin,oferta,is-ilani,oferta}.md
│  ├─ apply-helper/prompt.md                — was modes/{lang}/{bewerben,postuler,oubo,apply,basvuru,aplicar}.md
│  └─ interview-coach/prompt.md             — was modes/ru/interview-prep.md (RU only)
└─ workflows/
   └─ pipeline-drain/definition.md          — was modes/{lang}/pipeline.md
```

## Setting your locale

Add to `me/profile.yml` (today: `config/profile.yml`):

```yaml
language:
  modes_dir: locales/de       # or locales/fr, locales/ja, locales/ru, locales/tr, locales/pt
```

The AI resolves agent and workflow prompts via the rule at the top of this file.
