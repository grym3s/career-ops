#!/usr/bin/env node

// scan.mjs — root-level shim (LostAndLucky restructure, Phase 4b)
//
// The real scanner lives at agents/scanner/runners/scan.mjs as part of the
// LostAndLucky folder restructure (see wiki/decisions.md 2026-05-19).
// This shim is kept so:
//   - `node scan.mjs`     (legacy command) still works
//   - `npm run scan`      (package.json "scan" script) still works
//   - update-system.mjs SYSTEM_PATHS still resolves the path
//   - test-all.mjs Section 1 (root .mjs syntax check) still has scan.mjs
//
// Importing the moved module triggers its top-level main() execution.
// Phase 7 will remove this shim once package.json + update-system + tests
// are rewritten for the new path.

import './agents/scanner/runners/scan.mjs';
