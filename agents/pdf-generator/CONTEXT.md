# agents/pdf-generator/ — tailored CV rendering (HTML or LaTeX)

Renders a role-tailored CV to PDF. Two backends:
- **HTML/Playwright** (default) — reads `cv-template.html` + `cv.md`, renders via Playwright Chromium.
- **LaTeX/pdflatex** — reads `cv-template.tex`, compiles via system `pdflatex`.

Selected by `cv.output_format` in `me/profile.yml` (today: `config/profile.yml`).

## Folder layout

```
agents/pdf-generator/
├─ CONTEXT.md         (this file)
├─ prompt.md          — HTML/Playwright skill prompt (was modes/pdf.md)
├─ prompt-latex.md    — LaTeX skill prompt (was modes/latex.md)
├─ runners/           — empty until Phase 7 (scripts still at root)
├─ examples/
└─ evals/
```

**Runners (still at repo root pending Phase 7).** Both use `dirname(fileURLToPath(import.meta.url))` for path resolution to templates/, fonts/, output/ — moving them requires lockstep path-walk-up updates.
- `generate-pdf.mjs` — HTML → PDF via Playwright Chromium. ATS-normalizes Unicode before render.
- `generate-latex.mjs` — Validates a LaTeX CV and compiles via `pdflatex`.

**Inputs.**
- `cv.md` (user CV at root, → `me/cv.md` after Phase 7).
- `templates/cv-template.html` or `templates/cv-template.tex` (system layer).
- `fonts/*.woff2` for HTML path — self-hosted DM Sans + Space Grotesk.
- Per-role tailoring instructions from the evaluator's Block E ("Customization Plan").
- `me/profile.yml`'s `cv.output_format` field selects backend.

**Outputs.**
- `output/cv-{candidate-slug}-{company-slug}-{YYYY-MM-DD}.pdf`
- Intermediate `/tmp/cv-{candidate}-{company}.html` (HTML path) — reused by `agents/codex-reviewer/` as its CV input.

**Dependencies.**
- External: Playwright Chromium (HTML path), `pdflatex` (LaTeX path).
- Internal: `templates/cv-template.{html,tex}`, `fonts/*.woff2`.
- Composes with: `agents/evaluator/` (provides Block E tailoring spec), `agents/codex-reviewer/` (consumes the tailored HTML).

**Failure modes.**

| Failure | Fix |
|---|---|
| Playwright Chromium not installed | `npx playwright install chromium` |
| `pdflatex` not on PATH (LaTeX path) | Install TeX Live / MiKTeX, or switch to HTML path in profile |
| Font file missing | Restore `fonts/*.woff2` — these are tracked, run `git checkout fonts/` |
| ATS char failure (em-dash, smart quote) | The runner normalizes these; if seen, check `examples/ats-normalization-test.md` |

**When to invoke.**
- Score ≥ 4.0 in auto-pipeline Step 3.
- User explicitly asks "generate CV for this role" / "make a tailored CV".

**When NOT to invoke.**
- Score < 4.0 (don't burn cycles).
- The CV hasn't drifted from the last generation (check via `node cv-sync-check.mjs`).

## Related

- Source CV → `cv.md` (today) / `me/cv.md` (Phase 7)
- Templates → `templates/cv-template.{html,tex}`
- Drift check between cv.md and PDFs → `cv-sync-check.mjs` at root
- Downstream consumer → `agents/codex-reviewer/`
