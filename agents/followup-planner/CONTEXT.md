# agents/followup-planner/

When to follow up on each open application. Archetype-specific cadence + suggested message angle (curious-not-pushy / scope-clarifying / decision-deadline).

| Input | Used | Notes |
|---|---|---|
| `data/applications.md` | yes | Status + submit dates |
| `data/follow-ups.md` | yes | Per-application contact history |
| Cadence norms (in prompt) | yes | Archetype-specific |

**Outputs.** JSON per pending application: next-action date + angle + escalation flags.

**Cadence defaults:** Applied → 7-10d → curious-not-pushy · first nudge → 10-14d → scope-clarifying · second → 14-21d → decision-deadline · after third no-response → archive `Discarded`.

**Gates.** User asks "who should I follow up with?" / weekly cadence. Skip if < 3 days since submit OR already in active interview.

**Composes with:** `agents/contact-writer/` (drafts the actual message once cadence triggers).

**Failure modes:** `follow-ups.md` missing (treats every app as "no prior contact") · app has no submit date (skip with warning) · non-canonical status (run `normalize-statuses.mjs`).

**Files:** `prompt.md`, `followup-cadence.mjs`.
