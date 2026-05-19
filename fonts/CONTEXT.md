# fonts/ — self-hosted resume fonts

Self-hosted woff2 files referenced by `templates/cv-template.html` via `@font-face`. Self-hosting (vs Google Fonts) ensures:

1. Playwright PDF rendering works offline / in sandboxes
2. Consistent rendering across machines that don't have the fonts installed locally
3. No network call during PDF generation (faster, deterministic)

## Files

| File | Family | Variant |
|---|---|---|
| `dm-sans-latin.woff2` | DM Sans | Latin |
| `dm-sans-latin-ext.woff2` | DM Sans | Latin Extended |
| `space-grotesk-latin.woff2` | Space Grotesk | Latin |
| `space-grotesk-latin-ext.woff2` | Space Grotesk | Latin Extended |

## When to touch

- Don't, unless you're changing the CV typography intentionally. Both families are tuned for the existing template.
- If you add a new family, also update `cv-template.html` `@font-face` rules and add the woff2 here.

## Related

- The template that loads these → `templates/cv-template.html`
- The renderer → `generate-pdf.mjs` (today) / `agents/pdf-generator/runners/` (after Phase 5)
