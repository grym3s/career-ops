# output/ — generated PDFs

**User layer, gitignored.** Tailored CV PDFs produced by `agents/pdf-generator/` (today: `generate-pdf.mjs` and `generate-latex.mjs` at root).

## File naming

```
cv-{candidate-slug}-{company-slug}-{YYYY-MM-DD}.pdf
```

- `candidate-slug` — from `me/profile.yml` (today: `config/profile.yml`).
- `company-slug` — same slug used in the matching report under `reports/`.

## How files land here

1. Mode `pdf.md` builds `/tmp/cv-{candidate}-{company}.html` from `cv-template.html` + `cv.md`.
2. Playwright Chromium renders the HTML to PDF.
3. Output is written here.

LaTeX path: `latex.md` → `cv-template.tex` → `pdflatex` → PDF.

## After Phase 7

This folder becomes `outputs/pdfs/` (sibling of `outputs/reports/` and `outputs/interview-prep/`).

## Related

- The HTML template → `templates/cv-template.html`
- The LaTeX template → `templates/cv-template.tex`
- Drift detection between `cv.md` and generated PDFs → `node cv-sync-check.mjs`
