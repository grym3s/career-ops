# Customization Guide

## Profile (config/profile.yml)

This is the single source of truth for your identity. All modes read from here.

Key sections:
- **candidate**: Name, email, phone, location, LinkedIn, portfolio
- **target_roles**: Your North Star roles and archetypes
- **narrative**: Your headline, exit story, superpowers, proof points
- **compensation**: Target range, minimum, currency
- **location**: Country, timezone, visa status, on-site availability

## Target Roles (modes/_profile.md)

The archetype table in `_profile.md` determines how offers are scored and CVs are framed. Edit the table to match YOUR career targets:

```markdown
| Archetype | Thematic axes | What they buy |
|-----------|---------------|---------------|
| **Your Role 1** | key skills | what they need |
| **Your Role 2** | key skills | what they need |
```

Also update the "Adaptive Framing" table to map YOUR specific projects to each archetype.

## Portals (portals.yml)

Copy from `templates/portals.example.yml` and customize:

1. **title_filter.positive**: Keywords matching your target roles
2. **title_filter.negative**: Tech stacks or domains to exclude
3. **location_filter** (optional): Constrain scans to specific cities/regions — see below
4. **search_queries**: WebSearch queries for job boards (Ashby, Greenhouse, Lever)
5. **tracked_companies**: Companies to check directly

### location_filter (optional)

Applied after `title_filter` and before dedup. If the block is omitted, or both
`allowed` and `blocked` are empty, no location filtering happens (backward-compatible
default).

```yaml
location_filter:
  allowed: ["Sydney", "Melbourne", "Australia"]
  blocked: ["Perth", "Adelaide"]
  allow_remote: true
```

- **`allowed`** — case-insensitive substring OR-list. `"Sydney"` matches
  `"Sydney NSW, Australia"`, `"Sydney (Hybrid)"`, etc.
- **`blocked`** — explicit blocklist, always wins. Evaluated before the
  remote bypass, so `"Remote - Perth WA"` is still dropped when
  `blocked: ["Perth"]`.
- **`allow_remote`** — defaults to `true`. When on, any location containing
  `remote`, `anywhere`, or `distributed` bypasses the `allowed` allowlist so
  you do not lose remote-friendly roles to a strict city allowlist. Set to
  `false` to exclude remote roles too. The remote bypass never overrides
  `blocked`.
- Jobs with empty/unknown location pass through only when `allowed` is empty.

The scan summary prints a `Filtered by location` line so you can see how
many results the filter dropped.

### linkedin_guest_search (optional, PRIVATE FORK ONLY)

Hits LinkedIn's unauthenticated `jobs-guest/jobs/api/seeMoreJobPostings/search`
endpoint to pull structured job listings the Google `site:linkedin.com/jobs`
queries cannot reach. This is **personal-use only** and **must not be
upstreamed** to `santifer/career-ops` — the upstream `CONTRIBUTING.md`
explicitly rejects PRs that scrape platforms prohibiting automated access.

```yaml
linkedin_guest_search:
  enabled: true
  request_delay_ms: 5000
  max_pages: 2
  user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) ..."
  searches:
    - name: "Head of IT Sydney"
      keywords: "Head of IT"
      geo_id: "103644278"
      location_text: "Sydney, New South Wales, Australia"
      time_range: "r604800"
```

**Fields:**

- **`enabled`** — set to `false` to skip the block without deleting it.
- **`request_delay_ms`** — milliseconds to wait between paginated page
  fetches. Defaults to `5000`. Do not go lower; LinkedIn rate-limits
  aggressively.
- **`max_pages`** — top-level default cap on pagination (each page is
  25 results). Per-search `max_pages` overrides this. LinkedIn rarely
  returns more than a few pages of results for guest queries.
- **`user_agent`** — the User-Agent header to send. Use a recent Chrome
  string. A browser-like UA is required; LinkedIn 403's on obviously
  scripted requests.
- **`searches`** — list of queries. Each item supports `name` (label
  shown in errors), `keywords` (required), `geo_id`, `location_text`,
  `time_range`, `max_pages`, and `enabled`.

**Finding a `geo_id`:**

The `geo_id` is LinkedIn's internal numeric ID for a region. To resolve
a city or country name, hit the guest typeahead endpoint in a browser
or with `curl`:

```
https://www.linkedin.com/jobs-guest/api/typeaheadHits?typeaheadType=GEO&geoTypes=POPULATED_PLACE&query=Sydney
```

Common IDs: Australia `103644278`, United States `103644278` (oversimplified —
use the typeahead), Sydney metro area `90009524`. Cache these in your
`portals.yml` once you have them.

**`f_TPR` time range codes (`time_range`):**

- `r86400` — last 24 hours
- `r604800` — last 7 days
- `r2592000` — last 30 days

Omit `time_range` to search everything (usually too noisy).

**Rate limiting and ToS:**

The scanner treats HTTP `429`, `451`, and LinkedIn's custom `999`
responses as rate-limit signals and throws a `LinkedInGuestError` with
`code: "rate-limit"`. When one search hits a rate limit, the scanner
aborts the remaining LinkedIn searches for that run (but keeps going
on all other sources). Automated access technically breaches LinkedIn's
Terms of Service — keep volume to a handful of scans per day and accept
IP-block risk as the worst case. This feature is intended for individual
job-seekers running personal scans, not for any form of bulk data
collection.

## CV Template (templates/cv-template.html)

The HTML template uses these design tokens:
- **Fonts**: Space Grotesk (headings) + DM Sans (body) -- self-hosted in `fonts/`
- **Colors**: Cyan primary (`hsl(187,74%,32%)`) + Purple accent (`hsl(270,70%,45%)`)
- **Layout**: Single-column, ATS-optimized

To customize fonts/colors, edit the CSS in the template. Update font files in `fonts/` if switching fonts.

## Negotiation Scripts (modes/_shared.md)

The negotiation section provides frameworks for salary discussions. Replace the example scripts with your own:
- Target ranges
- Geographic arbitrage strategy
- Pushback responses

## Hooks (Optional)

Career-ops can integrate with external systems via Claude Code hooks. Example hooks:

```json
{
  "hooks": {
    "SessionStart": [{
      "hooks": [{
        "type": "command",
        "command": "echo 'Career-ops session started'"
      }]
    }]
  }
}
```

Save hooks in `.claude/settings.json`.

## States (templates/states.yml)

The canonical states rarely need changing. If you add new states, update:
1. `templates/states.yml`
2. `normalize-statuses.mjs` (alias mappings)
3. `modes/_shared.md` (any references)
