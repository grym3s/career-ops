# jds/ — saved job-description text

**User layer, gitignored.** Local copies of JD text for offers you've evaluated, referenced from `data/pipeline.md` as `local:jds/{filename}`.

## When to save a JD here

- The posting is behind auth (LinkedIn, paywalled portals) and the AI can't refetch it later
- You want a reproducible eval if the company takes the posting down
- You're working through a recruiter forward and there's no public URL

## File naming

No strict convention. `{company}-{role}-{YYYY-MM-DD}.txt` is a common pattern.

## After Phase 7

This folder becomes `inputs/jds/` (sibling of any future `inputs/contacts/` or `inputs/recruiter-emails/`).

## Related

- The queue that references these → `data/pipeline.md`
- The mode that drains the queue → `modes/pipeline.md` (today) / `workflows/pipeline-drain/` (after Phase 6)
