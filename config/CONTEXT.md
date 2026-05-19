# config/ — machine-readable profile (legacy location)

Holds the user's machine-readable profile during the migration. **Will move to `me/profile.yml` in Phase 7.**

## Files

| File | Layer | What |
|---|---|---|
| `profile.example.yml` | system (template, tracked) | Onboarding copy-source. Mirrored at `templates/profile.example.yml`. |
| `profile.yml` | **user** (gitignored) | Identity, comp range, target roles, archetype overrides, language preference |

## After Phase 7

- `profile.yml` moves to `me/profile.yml`
- `update-system.mjs` USER_PATHS gets the new path
- `config/` folder gets removed

**Do not move `profile.yml` manually until Phase 7 ships** — `update-system.mjs apply` would treat the new location as a user-layer leak and abort.

## Related

- Onboarding step that creates `profile.yml` → `AGENTS.md` "First Run — Onboarding" Step 2
- Where the profile is read → `modes/_shared.md` and `modes/_profile.md`
