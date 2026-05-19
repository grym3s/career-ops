# agents/contact-writer/ — LinkedIn / cold outreach drafting

Drafts outreach messages: LinkedIn connection requests, recruiter responses, hiring-manager cold emails, referral asks. Reads the report + the contact's public profile context (LinkedIn URL, eng blog, etc.) and produces a few framing variations the candidate picks from.

## Folder layout

```
agents/contact-writer/
├─ CONTEXT.md     (this file)
├─ prompt.md      — was modes/contacto.md
├─ runners/       — empty (prompt-only)
├─ examples/
└─ evals/
```

**Inputs.**
- Contact info: LinkedIn URL or name + company + role.
- Target role / hook: which JD this outreach is about (optional).
- `cv.md` for proof points.
- `me/_profile.md` for tone preferences.

**Outputs.**
- 2-3 draft variations of the message (different framings — proof-first, mutual-context-first, ask-direct).
- Brief explanation of why each works for this specific contact.

**Dependencies.**
- External: WebFetch / WebSearch for the contact's public profile (LinkedIn often blocks WebFetch — fall back to user-pasted snippet).
- Internal: `cv.md`, `me/_profile.md`, optionally the matching report under `reports/`.
- Composes with: `agents/deep-research/` (provides company context for the outreach hook).

**Failure modes.**

| Failure | Fix |
|---|---|
| LinkedIn URL returns auth wall | Ask user to paste the relevant profile context |
| Contact's role / seniority unclear | Ask one clarifying question before drafting |
| Tone-matched output feels off | Adjust `me/_profile.md` outreach-style preference, re-run |

**When to invoke.**
- User says "draft a message to X at Y" / "/career-ops contacto".
- Score ≥ 4.0 AND the user wants a warm intro path instead of cold applying.

**When NOT to invoke.**
- The user wants a generic networking message — that's a different (untracked) task.
- Outreach is via the application form — use `agents/apply-helper/` instead.

**Tone defaults.** No emojis. No "circling back" / "wanted to reach out". Specific proof point first, ask second. Two sentences max for LinkedIn connect notes.

## Related

- Upstream context → `agents/deep-research/`
- The CV proof points → `cv.md` + `article-digest.md`
