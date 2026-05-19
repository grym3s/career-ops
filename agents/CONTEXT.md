# agents/ — first-class agents

Each subfolder is one agent — a focused unit of behavior with its own prompt, contract, runners, examples, and evals. This is where the AI-facing skill prompts live (replacing the flat `modes/` layout) and where the `.mjs` scripts that an agent owns are colocated with their prompt.

## What lives in an agent folder

```
agents/{name}/
├─ CONTEXT.md        Task router — when to enter, what this agent does, related folders
├─ prompt.md         The AI-facing skill prompt (was modes/{name}.md)
├─ contract.yml      Inputs, outputs, dependencies, failure modes
├─ runners/          .mjs scripts owned by this agent (was scripts at root)
├─ examples/         Sample inputs + expected outputs
└─ evals/            User feedback: "this rewrite worked" / "score too high" / etc.
```

Not every agent will have all six pieces yet — some only have `prompt.md` until promoted (Phases 3–5).

## Agent index

| Agent | Status | What it does |
|---|---|---|
| `codex-reviewer/` | ✅ promoted (Phase 3) | Second-opinion review on a tailored CV via Codex CLI |
| `evaluator/` | pending Phase 4 | A–G evaluation of a single offer (`modes/oferta.md` + `ofertas.md`) |
| `scanner/` | pending Phase 4 | Zero-LLM portal scan (`scan.mjs` + `providers/`) |
| `pdf-generator/` | pending Phase 5 | HTML or LaTeX CV generation (`generate-pdf.mjs` + `generate-latex.mjs`) |
| `tracker/` | pending Phase 5 | merge / dedup / normalize / verify the applications ledger |
| `apply-helper/` | pending Phase 5 | Interactive application form fill |
| `interview-coach/` | pending Phase 5 | Company-specific interview prep |
| `deep-research/` | pending Phase 5 | Deep company research |
| `contact-writer/` | pending Phase 5 | LinkedIn / cold-outreach drafts |
| `pattern-analyst/` | pending Phase 5 | Rejection / scoring pattern analysis |
| `followup-planner/` | pending Phase 5 | When-to-follow-up cadence |

While an agent is "pending", the legacy `modes/{name}.md` + script-at-root path is canonical and still works.

## When to enter

- You want to know what a specific agent does → enter that agent's folder
- You want to add a new agent → copy the `codex-reviewer/` template
- You want to wire agents into a multi-step flow → go to `workflows/`
