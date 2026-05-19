# me/ — the user's personal contract

Everything personal to the user lives here: CV, profile, proof points, portal preferences. **Never auto-updated by `update-system.mjs`.**

## What goes here (after Phase 7)

```
me/
├─ CONTEXT.md         (this file)
├─ cv.md              Canonical CV — single source of truth
├─ profile.yml        Identity, comp range, target roles, language preference
├─ _profile.md        Archetypes, scoring weights, SKIP rules, narrative
├─ article-digest.md  Detailed proof points from your portfolio (optional)
└─ portals.yml        Company list + filters for `agents/scanner/`
```

## Status (2026-05-19)

Phase 7 (the move) hasn't shipped yet. The canonical locations are still:

| File | Current location | Future location |
|---|---|---|
| CV | `./cv.md` | `me/cv.md` |
| Profile (machine) | `config/profile.yml` | `me/profile.yml` |
| Profile (narrative) | `modes/_profile.md` | `me/_profile.md` |
| Article digest | `./article-digest.md` | `me/article-digest.md` |
| Portals | `./portals.yml` | `me/portals.yml` |

`update-system.mjs` USER_PATHS still tracks the legacy locations — DO NOT move these files until Phase 7 updates USER_PATHS in lockstep, or self-update will overwrite your data.

## The two-layer rule (preserved across the migration)

User layer (everything in here once Phase 7 lands) NEVER gets auto-updated. System layer (agents/, workflows/, system/, templates/, modes/, …) gets updated by `update-system.mjs apply`. See `DATA_CONTRACT.md`.
