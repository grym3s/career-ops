# agents/pdf-generator/

Tailored CV rendering. Two backends: HTML/Playwright (default) or LaTeX/pdflatex. Selected by `cv.output_format` in `me/profile.yml`.

| Input | Required | Notes |
|---|---|---|
| `cv.md` | yes | User layer |
| `templates/cv-template.{html,tex}` | yes | System layer |
| `fonts/*.woff2` | HTML path | Self-hosted DM Sans + Space Grotesk |
| Block-E tailoring from evaluator | yes | Per-role customization |

**Outputs.** `output/cv-{candidate}-{company}-{date}.pdf`. HTML path also writes `/tmp/cv-{candidate}-{company}.html` (reused by codex-reviewer).

**Composes with:** `agents/evaluator/` (provides tailoring spec), `agents/codex-reviewer/` (consumes HTML).

**Failure modes:** Playwright Chromium missing (`npx playwright install chromium`) · `pdflatex` not on PATH (install TeX or switch to HTML in profile) · font file missing (`git checkout fonts/`) · ATS char failure (runner normalizes — see `examples/ats-normalization-test.md`).

**Files:** `prompt.md` (HTML path), `prompt-latex.md` (LaTeX path), `generate-pdf.mjs`, `generate-latex.mjs`.
