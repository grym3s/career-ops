# workflows/pipeline-drain/ — drain the URL inbox

Process URLs queued in `data/pipeline.md` (typically written by `agents/scanner/`). For each URL, run the auto-pipeline.

## Composition

```
data/pipeline.md (URL inbox)
   │
   ▼ (one URL at a time)
   workflows/auto-pipeline/  (the full per-URL flow)
   │
   ▼
   Mark URL processed in data/pipeline.md
   │
   ▼
   Repeat until inbox empty
```

## Difference vs batch-pipeline

| | `workflows/pipeline-drain/` | `workflows/batch-pipeline/` |
|---|---|---|
| Source | `data/pipeline.md` (URL queue) | `batch/batch-input.tsv` (TSV input) |
| Concurrency | Sequential (interactive) | Parallel (N workers) |
| User interaction | Yes — pauses to confirm score, present rewrites | Headless — no user interaction |
| Use when | You want to walk through 5-15 offers carefully | You have 50+ offers to grind through |

## Files

| File | What |
|---|---|
| `definition.md` | The workflow prompt — was `modes/pipeline.md` |
| `CONTEXT.md` | This file |

## Localized versions

Every locale (`locales/{de,fr,ja,ru,tr,pt}/workflows/pipeline-drain/definition.md`) supplies its own translation of the workflow prompt. The AI resolves the right one via `me/profile.yml`'s `language.modes_dir` (see `AGENTS.md` "Folder Routing" + locale resolution rule).

## Related

- The scanner that fills the queue → `agents/scanner/`
- The full per-URL flow → `workflows/auto-pipeline/`
- The queue itself → `data/pipeline.md`
