# dashboard/ — Go TUI for browsing applications

Standalone Go application (Bubble Tea + Catppuccin theme). Not loaded by any AI mode — invoked by the user directly.

## Features

- Filter tabs: All / Evaluated / Applied / Interview / Top ≥4 / SKIP
- Sort modes: Score / Date / Company / Status
- Grouped or flat view
- Lazy-loaded report previews
- Inline status picker

## Run

```bash
cd dashboard
go run ./...
# or build:
go build -o career-dashboard . && ./career-dashboard
```

## Files

| Path | What |
|---|---|
| `main.go` | Entry point |
| `internal/model/career.go` | Tracker model (parses `data/applications.md`) |
| `internal/theme/{catppuccin,catppuccin_latte,theme}.go` | Color palettes |
| `internal/ui/screens/{progress,pipeline}.go` | Bubble Tea screens |

## Data dependencies

Reads `data/applications.md` directly. Status filters depend on the values in that file being canonical — see `templates/states.yml`.

## Status filters and `templates/states.yml`

If you add a new status to `states.yml`, the dashboard's filter tabs need a matching entry in `internal/model/career.go`. Mismatch = rows silently dropped from views.

## Related

- The tracker the dashboard renders → `data/applications.md`
- The canonical statuses it filters by → `templates/states.yml`
