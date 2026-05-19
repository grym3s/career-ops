# agents/followup-planner/ — follow-up cadence

Calculates when to follow up on an open application: based on submit date, status, last contact, archetype-specific cadence norms. Suggests the specific message angle (curious-not-pushy vs scope-clarifying vs decision-deadline).

## Folder layout

```
agents/followup-planner/
├─ CONTEXT.md     (this file)
├─ prompt.md      — was modes/followup.md
├─ runners/       — empty until Phase 7 (followup-cadence.mjs still at root)
├─ examples/
└─ evals/
```

**Runner (still at repo root pending Phase 7).**
- `followup-cadence.mjs` — Reads `data/follow-ups.md` + `data/applications.md`, emits JSON: per-application "next nudge by" dates, recommended angles, escalation flags.

**Inputs.**
- `data/applications.md` (status + dates).
- `data/follow-ups.md` (per-application contact history).
- Archetype-specific cadence norms (in prompt.md).

**Outputs.**
- JSON to stdout (machine-readable).
- For each pending application: recommended next-action date + suggested angle.
- Escalation flags for applications past the standard cadence with no response.

**Dependencies.**
- Internal only.
- Composes with: `agents/contact-writer/` (drafts the actual follow-up message once cadence triggers).

**Failure modes.**

| Failure | Fix |
|---|---|
| `data/follow-ups.md` missing | Create empty file with header — agent treats every app as "no prior contact" |
| Application has no submit date | Skip with warning — tracker should always have dates |
| Status not canonical | Run `node normalize-statuses.mjs` first |

**When to invoke.**
- User says "who should I follow up with this week?" / "/career-ops followup".
- Weekly cadence (manual today; could be `workflows/` scheduled job after Phase 6).

**When NOT to invoke.**
- < 3 days since application submitted — too early.
- Already in active interview — different cadence rules.

## Cadence defaults (in prompt.md)

- Applied → 7-10 days → curious-not-pushy nudge
- First nudge → 10-14 days → scope-clarifying or specific-question
- Second nudge → 14-21 days → decision-deadline framing
- After third no-response → archive as `Discarded`.

## Related

- The runner → `followup-cadence.mjs` at root (Phase 7 → here)
- Message drafting after this surfaces a candidate → `agents/contact-writer/`
- Source data → `data/follow-ups.md`, `data/applications.md`
