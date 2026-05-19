# agents/contact-writer/

Drafts outreach: LinkedIn connect notes, recruiter responses, hiring-manager cold emails, referral asks. Produces 2-3 framing variations.

| Input | Required | Notes |
|---|---|---|
| Contact info | yes | LinkedIn URL or name+company+role |
| Target role | optional | Hook for the outreach |
| `cv.md` | yes | Proof points |
| `me/_profile.md` | yes | Tone preferences |

**Outputs.** 2-3 draft variations (proof-first, mutual-context-first, ask-direct) + brief explanation of why each works for this contact.

**Tone defaults.** No emojis. No "circling back" / "wanted to reach out". Specific proof point first, ask second. Two sentences max for LinkedIn connects.

**Composes with:** `agents/deep-research/` (company context for the hook).

**Failure modes:** LinkedIn URL behind auth (ask user to paste profile snippet) · contact's role unclear (one clarifying Q before drafting) · tone feels off (adjust `me/_profile.md` outreach-style, re-run).

**Files:** `prompt.md`. No runner.
