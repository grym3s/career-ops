# workflows/ — agents composed end-to-end

Each subfolder is one workflow — a multi-agent flow that the user invokes as a single command. Workflows reference agents from `agents/` and stitch them into a pipeline.

## What lives in a workflow folder

```
workflows/{name}/
├─ CONTEXT.md        When to enter, what the flow does
├─ definition.md     The step-by-step prompt (was modes/{name}.md for the workflow-shaped modes)
└─ state/            Optional gitignored state if the workflow is resumable (e.g. batch-pipeline)
```

## Workflow index

| Workflow | Status | Composes |
|---|---|---|
| `auto-pipeline/` | pending Phase 6 | evaluator → pdf-generator → codex-reviewer → tracker |
| `batch-pipeline/` | pending Phase 6 | batch worker spawner + tracker merge |
| `pipeline-drain/` | pending Phase 6 | Process queued URLs from `data/pipeline.md` |
| `interview-flow/` | future | evaluator → interview-coach |
| `outreach-flow/` | future | scanner → deep-research → contact-writer |

While "pending", the legacy `modes/{auto-pipeline,batch,pipeline}.md` paths are canonical and still work.

## When to enter

- The user pasted a JD or URL → `auto-pipeline/`
- The user has a queue of URLs to grind through → `pipeline-drain/` or `batch-pipeline/`
- The user wants to chain two existing agents → add a new workflow folder here
