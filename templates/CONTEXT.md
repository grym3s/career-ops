# templates/ — source templates and canonical contracts

Templates the modes / agents reference, and canonical contract files (like the application-status enum). System layer — auto-updated.

## Files

| File | Used by |
|---|---|
| `cv-template.html` | `agents/pdf-generator/` (HTML path) — Space Grotesk + DM Sans |
| `cv-template.tex` | `agents/pdf-generator/` (LaTeX path) |
| `portals.example.yml` | Onboarding — copied to `me/portals.yml` (today: `./portals.yml`) on first run |
| `profile.example.yml` | Onboarding — copied to `me/profile.yml` (today: `config/profile.yml`) |
| `states.yml` | **Source of truth** for canonical application statuses |

## States contract

`states.yml` is the single source of truth for the status column in `data/applications.md`. Every script that touches the tracker reads this:

- `normalize-statuses.mjs` forces non-canonical statuses to the closest canonical
- `verify-pipeline.mjs` rejects anything not in this list
- The dashboard filters tabs by these statuses

If you need a new status, add it here first — don't introduce it in scripts.

## Related

- Onboarding flow that reads templates here → `AGENTS.md` "First Run — Onboarding"
- Mode that documents the CV template structure → `modes/pdf.md` / `modes/latex.md`
