# docs/ — human-facing documentation

For people reading the repo on GitHub. Not loaded into the AI's working prompt — `CLAUDE.md` and `AGENTS.md` are.

## Files

| File | What |
|---|---|
| `SETUP.md` | First-run install + config walkthrough |
| `SCRIPTS.md` | Per-script reference (what each `.mjs` does, args, env vars) |
| `CUSTOMIZATION.md` | How to tailor archetypes, modes, scoring, language to your career |
| `ARCHITECTURE.md` | High-level overview, two-layer model, top-level folder map, data flow |

## When to update

- New script lands → update `SCRIPTS.md`
- New mode / agent / workflow → update `ARCHITECTURE.md` folder map
- Onboarding flow changes → update `SETUP.md` (and `AGENTS.md` "First Run" section)
- New customization knob → update `CUSTOMIZATION.md`

Marketing-style images (banners, GIFs, OG images) also live here — they're tracked in git and bundled with cloud uploads like `/ultraplan`. If they're large (today: 28 MB of jpgs/gifs), consider moving to a release asset.

## Related

- AI-facing entry points → `CLAUDE.md`, `AGENTS.md` at repo root
- Decisions of record → `wiki/decisions.md`
