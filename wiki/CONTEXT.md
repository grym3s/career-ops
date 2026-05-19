# wiki/ — meta layer

The append-only narrative history of decisions, open questions, and known conflicts. Pattern lifted from the LostAndLucky reference (`~/wiki/wiki/projects/liahn-tattoo-social-strategy.md`).

## What lives here

| File | What |
|---|---|
| `decisions.md` | **Append-only**, dated. Every architectural / pattern / policy decision with rationale. |
| `open-questions.md` | Things known to be unresolved. Each entry has an ID (Q-N), state, and recommended path. |
| `conflicts.md` | Where two decisions or rules collide and the resolution hasn't been written yet. |

The auto-generated release changelog stays at root `./CHANGELOG.md` (owned by release-please via `release-please-config.json`). Don't move it — release automation hardcodes that path. `wiki/` is for **narrative** history; `CHANGELOG.md` is for **version** history.

## When to enter

- "Why did we do X?" → `decisions.md` (search for the date or topic)
- "What's still up in the air?" → `open-questions.md`
- "What changed in v1.X.Y?" → `changelog.md`
- You just made an architectural choice → append a dated entry to `decisions.md` BEFORE you forget the why

## Append rule

`decisions.md` is **append-only**. Never edit a past entry to "fix" it — instead, write a new dated entry that supersedes it (link back to the old one). Reading the file top-to-bottom shows how thinking evolved.
