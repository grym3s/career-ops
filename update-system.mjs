#!/usr/bin/env node

/**
 * update-system.mjs — Safe auto-updater for career-ops
 *
 * Updates ONLY system layer files (modes, scripts, dashboard, templates).
 * NEVER touches user data (cv.md, profile.yml, _profile.md, data/, reports/).
 *
 * Usage:
 *   node update-system.mjs check      # Check if update available
 *   node update-system.mjs apply      # Apply update (after user confirms)
 *   node update-system.mjs rollback   # Rollback last update
 *   node update-system.mjs dismiss    # Dismiss update check
 *
 * See DATA_CONTRACT.md for the full system/user layer definitions.
 */

import { execFileSync, execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync, unlinkSync, rmSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = __dirname;

const CANONICAL_REPO = 'https://github.com/santifer/career-ops.git';
const RAW_VERSION_URL = 'https://raw.githubusercontent.com/santifer/career-ops/main/VERSION';
const RELEASES_API = 'https://api.github.com/repos/santifer/career-ops/releases/latest';

// System layer paths — ONLY these files get updated.
// LostAndLucky restructure (2026-05-19, see wiki/decisions.md):
//   - Agents now live under agents/{name}/ (prompt.md, CONTEXT.md, runners/, etc.).
//   - Workflows under workflows/{name}/ (definition.md, CONTEXT.md).
//   - Locales under locales/{lang}/ (overlay shape — was modes/{lang}/ clones).
//   - Wiki narrative under wiki/.
// Scripts that stay at root (canonical user/CI invocation points):
//   update-system.mjs, test-all.mjs, doctor.mjs, cv-sync-check.mjs, scan.mjs (shim),
//   check-liveness.mjs, liveness-core.mjs, gemini-eval.mjs.
const SYSTEM_PATHS = [
  // Shared rules (still canonical at modes/)
  'modes/_shared.md',
  'modes/_profile.template.md',
  // Root CONTEXT.md (project map / task router)
  'CONTEXT.md',
  // AI entry points
  'CLAUDE.md',
  'AGENTS.md',
  'GEMINI.md',
  // First-class agents, workflows, locales, wiki (sweep entire trees)
  'agents/',
  'workflows/',
  'locales/',
  'wiki/',
  // Root system scripts (kept at root for user/CI stability)
  'cv-sync-check.mjs',
  'update-system.mjs',
  'scan.mjs',           // shim wrapper; canonical runner at agents/scanner/scan.mjs
  'doctor.mjs',
  'check-liveness.mjs',
  'liveness-core.mjs',
  'gemini-eval.mjs',
  'test-all.mjs',
  // Batch infrastructure (orchestrator + state)
  'batch/batch-prompt.md',
  'batch/batch-runner.sh',
  // Other system layers
  'dashboard/',
  'templates/',
  'fonts/',
  '.agents/',
  '.claude/skills/',
  '.gemini/commands/',
  'docs/',
  'writing-samples/README.md',
  'VERSION',
  'DATA_CONTRACT.md',
  'CONTRIBUTING.md',
  'README.md',
  'LICENSE',
  'CITATION.cff',
  '.github/',
  'package.json',
];

// Fork overrides — files THIS fork has intentionally modified vs upstream.
// apply() skips these so fork-specific changes aren't clobbered on update.
// Use `node update-system.mjs apply --force` to override and accept upstream.
//
// Each entry needs a comment explaining WHY it's locally modified, so future
// maintainers can decide whether the fork modification is still load-bearing
// or whether it's safe to drop the override and re-sync with upstream.
//
// Added in LostAndLucky Phase 7 (2026-05-19) — see wiki/decisions.md.
const FORK_OVERRIDES = [
  // SYSTEM_PATHS list rewritten for the LostAndLucky folder layout.
  // Upstream still has the original flat-modes list; clobbering this would
  // make apply() try to checkout modes/oferta.md etc. which no longer exist.
  'update-system.mjs',

  // Section 1 discovers agents/{name}/*.mjs; Section 2 paths point at
  // agents/tracker/*; Section 5 systemFiles points at
  // agents/{evaluator,pdf-generator,scanner}/prompt.md; Section 8 replaces
  // hardcoded expectedModes with a discovery loop over agents/ + workflows/.
  // Upstream version would lose all of this.
  'test-all.mjs',

  // Root scan.mjs is now a thin shim wrapper that imports the canonical
  // runner at agents/scanner/scan.mjs. Upstream version is the original
  // full script which would crash because it imports ./providers/_http.mjs
  // which now lives at agents/scanner/providers/.
  'scan.mjs',
];

// Upstream path translation — santifer/career-ops uses the original flat
// layout (modes/oferta.md, scan.mjs at root, providers/ at root). This fork
// uses the agent-first layout (agents/evaluator/prompt.md, agents/scanner/
// scan.mjs, agents/scanner/providers/). apply() reads each entry's
// `upstream` from FETCH_HEAD and writes its content to the `local` path,
// preserving the fork's layout while flowing upstream improvements in.
//
// Pass-through entries (upstream == local) are listed explicitly too so
// you can see the full set of paths the fork tracks against santifer in
// one place.
//
// Added 2026-05-19 (LostAndLucky restructure Fix 3).
const UPSTREAM_TRACKED_PATHS = [
  // ── Shared rules (same path in fork) ───────────────────────────
  { upstream: 'modes/_shared.md',          local: 'modes/_shared.md' },
  { upstream: 'modes/_profile.template.md', local: 'modes/_profile.template.md' },

  // ── Mode prompts → agent prompts ───────────────────────────────
  { upstream: 'modes/oferta.md',         local: 'agents/evaluator/prompt.md' },
  { upstream: 'modes/ofertas.md',        local: 'agents/evaluator/compare.md' },
  { upstream: 'modes/scan.md',           local: 'agents/scanner/prompt.md' },
  { upstream: 'modes/pdf.md',            local: 'agents/pdf-generator/prompt.md' },
  { upstream: 'modes/latex.md',          local: 'agents/pdf-generator/prompt-latex.md' },
  { upstream: 'modes/codex-review.md',   local: 'agents/codex-reviewer/prompt.md' },
  { upstream: 'modes/apply.md',          local: 'agents/apply-helper/prompt.md' },
  { upstream: 'modes/contacto.md',       local: 'agents/contact-writer/prompt.md' },
  { upstream: 'modes/deep.md',           local: 'agents/deep-research/prompt.md' },
  { upstream: 'modes/interview-prep.md', local: 'agents/interview-coach/prompt.md' },
  { upstream: 'modes/patterns.md',       local: 'agents/pattern-analyst/prompt.md' },
  { upstream: 'modes/followup.md',       local: 'agents/followup-planner/prompt.md' },
  { upstream: 'modes/training.md',       local: 'agents/training-eval/prompt.md' },
  { upstream: 'modes/project.md',        local: 'agents/project-eval/prompt.md' },
  { upstream: 'modes/tracker.md',        local: 'agents/tracker/prompt.md' },

  // ── Workflow prompts (modes/{flow}.md → workflows/{flow}/definition.md)
  { upstream: 'modes/auto-pipeline.md', local: 'workflows/auto-pipeline/definition.md' },
  { upstream: 'modes/batch.md',         local: 'workflows/batch-pipeline/definition.md' },
  { upstream: 'modes/pipeline.md',      local: 'workflows/pipeline-drain/definition.md' },

  // ── Scripts → agent runners (Fix 2 flattened agents/*/runners/) ─
  { upstream: 'codex-review.mjs',      local: 'agents/codex-reviewer/codex-review.mjs' },
  { upstream: 'generate-pdf.mjs',      local: 'agents/pdf-generator/generate-pdf.mjs' },
  { upstream: 'generate-latex.mjs',    local: 'agents/pdf-generator/generate-latex.mjs' },
  { upstream: 'merge-tracker.mjs',     local: 'agents/tracker/merge-tracker.mjs' },
  { upstream: 'dedup-tracker.mjs',     local: 'agents/tracker/dedup-tracker.mjs' },
  { upstream: 'normalize-statuses.mjs', local: 'agents/tracker/normalize-statuses.mjs' },
  { upstream: 'verify-pipeline.mjs',   local: 'agents/tracker/verify-pipeline.mjs' },
  { upstream: 'analyze-patterns.mjs',  local: 'agents/pattern-analyst/analyze-patterns.mjs' },
  { upstream: 'followup-cadence.mjs',  local: 'agents/followup-planner/followup-cadence.mjs' },

  // ── Provider plugins → agents/scanner/providers/ ────────────────
  { upstream: 'providers/_http.mjs',      local: 'agents/scanner/providers/_http.mjs' },
  { upstream: 'providers/_types.js',      local: 'agents/scanner/providers/_types.js' },
  { upstream: 'providers/greenhouse.mjs', local: 'agents/scanner/providers/greenhouse.mjs' },
  { upstream: 'providers/ashby.mjs',      local: 'agents/scanner/providers/ashby.mjs' },
  { upstream: 'providers/lever.mjs',      local: 'agents/scanner/providers/lever.mjs' },

  // ── Locales (modes/{lang}/ → locales/{lang}/) ──────────────────
  { upstream: 'modes/de/_shared.md',     local: 'locales/de/_shared.md' },
  { upstream: 'modes/de/README.md',      local: 'locales/de/README.md' },
  { upstream: 'modes/de/angebot.md',     local: 'locales/de/agents/evaluator/prompt.md' },
  { upstream: 'modes/de/bewerben.md',    local: 'locales/de/agents/apply-helper/prompt.md' },
  { upstream: 'modes/de/pipeline.md',    local: 'locales/de/workflows/pipeline-drain/definition.md' },
  { upstream: 'modes/fr/_shared.md',     local: 'locales/fr/_shared.md' },
  { upstream: 'modes/fr/README.md',      local: 'locales/fr/README.md' },
  { upstream: 'modes/fr/offre.md',       local: 'locales/fr/agents/evaluator/prompt.md' },
  { upstream: 'modes/fr/postuler.md',    local: 'locales/fr/agents/apply-helper/prompt.md' },
  { upstream: 'modes/fr/pipeline.md',    local: 'locales/fr/workflows/pipeline-drain/definition.md' },
  { upstream: 'modes/ja/_shared.md',     local: 'locales/ja/_shared.md' },
  { upstream: 'modes/ja/README.md',      local: 'locales/ja/README.md' },
  { upstream: 'modes/ja/kyujin.md',      local: 'locales/ja/agents/evaluator/prompt.md' },
  { upstream: 'modes/ja/oubo.md',        local: 'locales/ja/agents/apply-helper/prompt.md' },
  { upstream: 'modes/ja/pipeline.md',    local: 'locales/ja/workflows/pipeline-drain/definition.md' },
  { upstream: 'modes/ru/_shared.md',     local: 'locales/ru/_shared.md' },
  { upstream: 'modes/ru/README.md',      local: 'locales/ru/README.md' },
  { upstream: 'modes/ru/oferta.md',      local: 'locales/ru/agents/evaluator/prompt.md' },
  { upstream: 'modes/ru/apply.md',       local: 'locales/ru/agents/apply-helper/prompt.md' },
  { upstream: 'modes/ru/interview-prep.md', local: 'locales/ru/agents/interview-coach/prompt.md' },
  { upstream: 'modes/ru/pipeline.md',    local: 'locales/ru/workflows/pipeline-drain/definition.md' },
  { upstream: 'modes/tr/_shared.md',     local: 'locales/tr/_shared.md' },
  { upstream: 'modes/tr/README.md',      local: 'locales/tr/README.md' },
  { upstream: 'modes/tr/is-ilani.md',    local: 'locales/tr/agents/evaluator/prompt.md' },
  { upstream: 'modes/tr/basvuru.md',     local: 'locales/tr/agents/apply-helper/prompt.md' },
  { upstream: 'modes/tr/pipeline.md',    local: 'locales/tr/workflows/pipeline-drain/definition.md' },
  { upstream: 'modes/pt/_shared.md',     local: 'locales/pt/_shared.md' },
  { upstream: 'modes/pt/README.md',      local: 'locales/pt/README.md' },
  { upstream: 'modes/pt/oferta.md',      local: 'locales/pt/agents/evaluator/prompt.md' },
  { upstream: 'modes/pt/aplicar.md',     local: 'locales/pt/agents/apply-helper/prompt.md' },
  { upstream: 'modes/pt/pipeline.md',    local: 'locales/pt/workflows/pipeline-drain/definition.md' },

  // ── Pass-through (same path on both sides) ─────────────────────
  { upstream: 'CLAUDE.md',                       local: 'CLAUDE.md' },
  { upstream: 'AGENTS.md',                       local: 'AGENTS.md' },
  { upstream: 'GEMINI.md',                       local: 'GEMINI.md' },
  { upstream: 'cv-sync-check.mjs',               local: 'cv-sync-check.mjs' },
  { upstream: 'doctor.mjs',                      local: 'doctor.mjs' },
  { upstream: 'check-liveness.mjs',              local: 'check-liveness.mjs' },
  { upstream: 'liveness-core.mjs',               local: 'liveness-core.mjs' },
  { upstream: 'gemini-eval.mjs',                 local: 'gemini-eval.mjs' },
  { upstream: 'batch/batch-prompt.md',           local: 'batch/batch-prompt.md' },
  { upstream: 'batch/batch-runner.sh',           local: 'batch/batch-runner.sh' },
  { upstream: 'VERSION',                         local: 'VERSION' },
  { upstream: 'DATA_CONTRACT.md',                local: 'DATA_CONTRACT.md' },
  { upstream: 'CONTRIBUTING.md',                 local: 'CONTRIBUTING.md' },
  { upstream: 'README.md',                       local: 'README.md' },
  { upstream: 'LICENSE',                         local: 'LICENSE' },
  { upstream: 'CITATION.cff',                    local: 'CITATION.cff' },
  { upstream: 'package.json',                    local: 'package.json' },
  { upstream: 'writing-samples/README.md',       local: 'writing-samples/README.md' },
];

// User layer paths — NEVER touch these (safety check).
// LostAndLucky Phase 7 added me/ as the canonical user-layer folder.
// Legacy paths kept for users who haven't migrated yet — the safety guard
// in apply() rejects updates that would touch any of these.
const USER_PATHS = [
  // LostAndLucky canonical location (Phase 7)
  'me/',
  // Legacy user-layer locations (still supported during migration)
  'cv.md',
  'config/profile.yml',
  'modes/_profile.md',
  'portals.yml',
  'article-digest.md',
  'interview-prep/story-bank.md',
  'data/',
  'reports/',
  'output/',
  'jds/',
  'writing-samples/',
];

function parseVersionFile(raw) {
  // VERSION may carry a release-please marker, e.g. "1.6.0 # x-release-please-version".
  // Take the first whitespace-delimited token so the marker doesn't break semver parsing.
  return raw.trim().split(/\s+/)[0] || '';
}

function localVersion() {
  const vPath = join(ROOT, 'VERSION');
  return existsSync(vPath) ? parseVersionFile(readFileSync(vPath, 'utf-8')) : '0.0.0';
}

function compareVersions(a, b) {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if ((pa[i] || 0) < (pb[i] || 0)) return -1;
    if ((pa[i] || 0) > (pb[i] || 0)) return 1;
  }
  return 0;
}

function git(...args) {
  return execFileSync('git', args, { cwd: ROOT, encoding: 'utf-8', timeout: 30000 }).trim();
}

function gitStatusEntries() {
  const status = git('status', '--porcelain');
  if (!status) return [];

  return status.split('\n')
    .filter(Boolean)
    .map(line => ({
      code: line.slice(0, 2),
      path: line.slice(3),
    }));
}

function revertPaths(paths) {
  if (paths.length === 0) return;
  git('checkout', '--', ...paths);
}

function addPaths(paths) {
  if (paths.length === 0) return;
  git('add', '--', ...paths);
}

// ── CHECK ───────────────────────────────────────────────────────

async function check() {
  // Respect dismiss flag
  if (existsSync(join(ROOT, '.update-dismissed'))) {
    console.log(JSON.stringify({ status: 'dismissed' }));
    return;
  }

  const local = localVersion();
  let remote = '';
  let releaseVersion = '';
  let changelog = '';

  // Fetch both sources in parallel — only fail offline if BOTH are unreachable.
  // Use AbortSignal so a hung TCP connection can't stall the session-start check.
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  let versionResult, releaseResult;
  try {
    [versionResult, releaseResult] = await Promise.allSettled([
      fetch(RAW_VERSION_URL, { signal: controller.signal }),
      fetch(RELEASES_API, {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'career-ops-update-checker',
        },
        signal: controller.signal,
      }),
    ]);
  } finally {
    clearTimeout(timeoutId);
  }

  const SEMVER_RE = /^v?(\d+\.\d+\.\d+)$/i;

  if (versionResult.status === 'fulfilled' && versionResult.value.ok) {
    try {
      const raw = parseVersionFile(await versionResult.value.text());
      const match = raw.match(SEMVER_RE);
      remote = match ? match[1] : '';
    } catch {
      // Body read failed; treat as no VERSION source
    }
  }

  if (releaseResult.status === 'fulfilled' && releaseResult.value.ok) {
    try {
      const release = await releaseResult.value.json();
      changelog = release.body || '';
      const rawTag = String(release.tag_name || '').trim();
      const match = rawTag.match(SEMVER_RE);
      releaseVersion = match ? match[1] : '';
    } catch {
      // Body parse failed; treat as no release source
    }
  }

  if (!remote && !releaseVersion) {
    // Distinguish true network failures from "fetched OK but response was
    // unparseable" — the latter shouldn't be silenced as offline since the
    // network is actually fine.
    const bothNetworkFailed =
      versionResult.status !== 'fulfilled' &&
      releaseResult.status !== 'fulfilled';
    const status = bothNetworkFailed ? 'offline' : 'no-remote-version';
    console.log(JSON.stringify({ status, local }));
    return;
  }

  // Use the higher version between VERSION file and GitHub Release
  // (handles cases where VERSION file is not bumped after a release,
  // or the raw host is unreachable but the API is).
  if (!remote) {
    remote = releaseVersion;
  } else if (releaseVersion && compareVersions(releaseVersion, remote) > 0) {
    remote = releaseVersion;
  }

  if (compareVersions(local, remote) >= 0) {
    console.log(JSON.stringify({ status: 'up-to-date', local, remote }));
    return;
  }

  console.log(JSON.stringify({
    status: 'update-available',
    local,
    remote,
    changelog: changelog.slice(0, 500),
  }));
}

// ── APPLY ───────────────────────────────────────────────────────

async function apply() {
  const local = localVersion();
  const force = process.argv.includes('--force');
  const dryRun = process.argv.includes('--dry-run');
  const initialStatusPaths = new Set(gitStatusEntries().map(entry => entry.path));

  // Check for lock (skip in dry-run — read-only)
  const lockFile = join(ROOT, '.update-lock');
  if (!dryRun) {
    if (existsSync(lockFile)) {
      console.error('Update already in progress (.update-lock exists). If stuck, delete it manually.');
      process.exit(1);
    }
    writeFileSync(lockFile, new Date().toISOString());
  }

  try {
    // 1. Backup branch (skip in dry-run — no writes happen anyway).
    if (!dryRun) {
      const backupBranch = `backup-pre-update-${local}`;
      try {
        git('branch', backupBranch);
        console.log(`Backup branch created: ${backupBranch}`);
      } catch {
        console.log(`Backup branch already exists (${backupBranch}), continuing...`);
      }
    }

    // 2. Fetch from canonical repo (always — read-only network op).
    console.log('Fetching latest from upstream...');
    git('fetch', CANONICAL_REPO, 'main');

    // 3. Checkout system files only
    console.log('Updating system files...');
    const updated = [];

    // 3a. Bootstrap newly-introduced paths that the local update-system.mjs
    // doesn't yet know about. Without this, cross-version migrations where
    // a path is added to SYSTEM_PATHS by the new version can leave dangling
    // symlinks — e.g. v1.6.x → v1.7.x where .agents/ was introduced but the
    // local v1.6.x SYSTEM_PATHS didn't include it, so `.agents/` was never
    // checked out while `.claude/skills/` was updated to symlink into it.
    // See: https://github.com/santifer/career-ops/issues/649
    const BOOTSTRAP_PATHS = ['.agents/'];
    for (const path of BOOTSTRAP_PATHS) {
      if (SYSTEM_PATHS.includes(path)) continue; // already in main loop
      try {
        git('checkout', 'FETCH_HEAD', '--', path);
        updated.push(path);
      } catch {
        // Path may not exist in FETCH_HEAD yet
      }
    }

    // Translated upstream sync (LostAndLucky Fix 3). For each upstream
    // path the fork tracks, read its content from FETCH_HEAD and write
    // it to the mapped local path. This preserves the fork's folder
    // layout while flowing upstream improvements in.
    const skipped = [];
    const changes = [];  // dry-run preview entries
    const notInUpstream = [];

    for (const { upstream, local: localPath } of UPSTREAM_TRACKED_PATHS) {
      // Skip fork-modified files unless --force.
      if (!force && FORK_OVERRIDES.includes(localPath)) {
        skipped.push({ upstream, local: localPath });
        continue;
      }

      // Read upstream content via git show. Suppress stderr — `git show`
      // emits `fatal: path 'X' does not exist in 'FETCH_HEAD'` to stderr
      // for paths that exist in the fork but not upstream (e.g. files
      // added on this branch but never PR'd back), and that noise would
      // bleed through into otherwise-clean dry-run output.
      let upstreamContent;
      try {
        upstreamContent = execFileSync('git', ['show', `FETCH_HEAD:${upstream}`], {
          cwd: ROOT, encoding: 'utf-8', timeout: 30000,
          stdio: ['pipe', 'pipe', 'ignore'],
        }).trim();
      } catch {
        notInUpstream.push(upstream);
        continue;
      }

      const absLocal = join(ROOT, localPath);
      let oldContent = '';
      try { oldContent = readFileSync(absLocal, 'utf-8'); } catch {}

      if (oldContent === upstreamContent) {
        continue;  // no change — skip silently
      }

      if (dryRun) {
        changes.push({
          upstream,
          local: localPath,
          action: oldContent ? 'modify' : 'create',
          sizeDelta: upstreamContent.length - oldContent.length,
        });
      } else {
        mkdirSync(dirname(absLocal), { recursive: true });
        writeFileSync(absLocal, upstreamContent, 'utf-8');
        updated.push(localPath);
      }
    }

    // Bootstrap pass for tree-prefix paths from the legacy SYSTEM_PATHS
    // (`.github/`, `templates/`, `fonts/`, `dashboard/`, etc. — directories
    // we want to mirror wholesale from upstream). These don't fit the
    // 1:1 path translation model.
    const TREE_PREFIX_PATHS = ['.github/', '.agents/', '.claude/skills/', '.gemini/commands/', 'templates/', 'fonts/', 'docs/', 'dashboard/'];
    for (const path of TREE_PREFIX_PATHS) {
      if (!force && FORK_OVERRIDES.some(o => o.startsWith(path))) continue;
      try {
        if (!dryRun) {
          git('checkout', 'FETCH_HEAD', '--', path);
          updated.push(path);
        }
      } catch {
        // Path may not exist in remote
      }
    }

    if (dryRun) {
      console.log('\n=== DRY RUN — no files written ===');
      if (changes.length === 0) {
        console.log('No upstream changes to apply.');
      } else {
        console.log(`Would update ${changes.length} file(s):\n`);
        for (const c of changes) {
          const arrow = c.upstream === c.local ? '' : ` (was upstream: ${c.upstream})`;
          const sign = c.sizeDelta > 0 ? '+' : '';
          console.log(`  [${c.action}] ${c.local}${arrow}  ${sign}${c.sizeDelta} bytes`);
        }
      }
      if (skipped.length > 0) {
        console.log(`\nWould skip ${skipped.length} fork-modified file(s) — use --force to override.`);
      }
      if (notInUpstream.length > 0) {
        console.log(`\n${notInUpstream.length} tracked path(s) not present in upstream (likely renamed/deleted upstream-side).`);
      }
      return;
    }

    if (skipped.length > 0) {
      console.log(`\nSkipped ${skipped.length} fork-modified file(s):`);
      for (const s of skipped) console.log(`  - ${s.local}`);
      console.log(`Use \`node update-system.mjs apply --force\` to overwrite with upstream.`);
    }

    // 4. Validate: check NO user files were touched.
    //
    // Track which user paths the update unexpectedly touched so we
    // can revert them too — reverting only `updated` would leave the
    // repo in a half-applied state with the user-layer changes still
    // staged.
    const violatedUserPaths = new Set();
    try {
      for (const entry of gitStatusEntries()) {
        const file = entry.path;
        if (initialStatusPaths.has(file)) continue;
        // Explicit SYSTEM_PATHS entries override USER_PATHS prefix matches.
        // (e.g. writing-samples/README.md is system-owned doc inside a user dir.)
        if (SYSTEM_PATHS.includes(file)) continue;
        for (const userPath of USER_PATHS) {
          if (file.startsWith(userPath)) {
            console.error(`SAFETY VIOLATION: User file was modified: ${file}`);
            violatedUserPaths.add(file);
          }
        }
      }
    } catch (err) {
      // Fail closed: if we can't validate the safety invariant we must
      // not silently proceed — that would let a real violation slip
      // through. Revert what we already applied and abort.
      console.error(`Aborting: could not validate user-layer safety (${err.message}).`);
      try {
        revertPaths(updated);
      } catch (revertErr) {
        // If the revert itself fails (likely whatever broke `git
        // status` also broke `git checkout --`), don't lose the
        // original validation error — chain it via `cause`.
        throw new Error(
          `Validation failed (${err.message}) and revert also failed (${revertErr.message})`,
          { cause: err },
        );
      }
      throw err;
    }

    if (violatedUserPaths.size > 0) {
      console.error('Aborting: user files were touched. Rolling back...');
      // Revert BOTH the system-layer updates and the user-layer paths
      // the update unexpectedly modified — otherwise the repo is left
      // in a half-applied state.
      const violation = new Error('Update aborted: user files were touched.');
      try {
        revertPaths([...updated, ...violatedUserPaths]);
      } catch (revertErr) {
        // If the revert itself fails, don't lose the safety-violation
        // diagnostic — chain it via `cause` so the user sees both.
        throw new Error(
          `Safety violation (${violation.message}) and revert also failed (${revertErr.message})`,
          { cause: violation },
        );
      }
      // `throw` (not `process.exit`) so the outer `finally` runs and
      // .update-lock is removed. Exiting here would leak the lock and
      // permanently block subsequent updates until the user deletes
      // it manually.
      throw violation;
    }

    // 5. Install any new dependencies
    try {
      execSync('npm install --silent', { cwd: ROOT, timeout: 60000 });
    } catch {
      console.log('npm install skipped (may need manual run)');
    }

    // 6. Commit the update
    const remote = localVersion(); // Re-read after checkout updated VERSION
    try {
      const pathsToStage = [...updated];
      const dismissFile = join(ROOT, '.update-dismissed');
      if (existsSync(dismissFile)) {
        unlinkSync(dismissFile);
        pathsToStage.push('.update-dismissed');
      }
      addPaths(pathsToStage);
      git('commit', '-m', `chore: auto-update system files to v${remote}`);
    } catch {
      // Nothing to commit (already up to date)
    }

    console.log(`\nUpdate complete: v${local} → v${remote}`);
    console.log(`Updated ${updated.length} system paths.`);
    console.log(`Rollback available: node update-system.mjs rollback`);

  } finally {
    // Remove lock (only created in non-dry-run)
    if (!dryRun && existsSync(lockFile)) unlinkSync(lockFile);
  }
}

// ── ROLLBACK ────────────────────────────────────────────────────

function rollback() {
  // Find most recent backup branch
  try {
    const branches = git('for-each-ref', '--sort=-committerdate', '--format=%(refname:short)', 'refs/heads/backup-pre-update-*');
    const branchList = branches.split('\n').map(b => b.trim()).filter(Boolean);

    if (branchList.length === 0) {
      console.error('No backup branches found. Nothing to rollback.');
      process.exit(1);
    }

    const latest = branchList[0];
    console.log(`Rolling back to: ${latest}`);

    // Checkout system files from backup branch.
    //
    // Two failure modes for `git checkout` here:
    //   (a) the path didn't exist in the backup branch — the apply()
    //       that produced this backup was on an older version that
    //       didn't track this path yet. Rollback must DELETE the path
    //       so the working tree mirrors the backup state.
    //   (b) anything else — propagate so we don't silently leave the
    //       working tree in a partially-restored state.
    //
    // Limitation: `git checkout <ref> -- <dir>` restores blobs from
    // the backup tree but doesn't remove files that were added INSIDE
    // an already-tracked directory between backup and rollback. Rolling
    // back per-file via `git diff --name-status <backup>` would catch
    // that but is a larger change; tracked separately if it ever bites.
    const restored = [];
    const removed = [];
    for (const path of SYSTEM_PATHS) {
      try {
        git('checkout', latest, '--', path);
        restored.push(path);
      } catch (err) {
        const pathspec = path.endsWith('/') ? path.slice(0, -1) : path;
        let existedInBackup = true;
        try {
          git('cat-file', '-e', `${latest}:${pathspec}`);
        } catch {
          existedInBackup = false;
        }
        if (existedInBackup) {
          throw err;
        }
        // Path was introduced by a later apply() — remove it so the
        // tree truly matches the backup. `git rm` stages the deletion
        // for tracked files; `rmSync` cleans up the untracked-but-
        // on-disk case (e.g. an apply() that crashed between checkout
        // and commit, leaving the path untracked locally).
        git('rm', '-r', '-f', '--ignore-unmatch', '--', pathspec);
        try {
          rmSync(join(ROOT, pathspec), { recursive: true, force: true });
        } catch {
          // Already gone, or not present on disk — fine.
        }
        removed.push(pathspec);
      }
    }

    if (restored.length > 0) addPaths(restored);
    try {
      git('commit', '-m', `chore: rollback system files from ${latest}`);
    } catch {
      // Tolerate any commit failure here — the common case is the
      // "nothing to commit" no-op when the working tree already
      // matched the backup (e.g. user ran rollback twice). This
      // mirrors apply()'s broad-catch in the commit step; narrowing
      // to a specific git-error string is fragile and would diverge
      // from that pattern. Genuine setup problems (hooks, signing,
      // disk full) will resurface on the next normal git operation.
    }

    console.log(`Rollback complete. Restored ${restored.length} path(s) from ${latest}, removed ${removed.length} path(s) added after the backup.`);
    console.log('Your data (CV, profile, tracker, reports) was not affected.');
  } catch (err) {
    console.error('Rollback failed:', err.message);
    process.exit(1);
  }
}

// ── DISMISS ─────────────────────────────────────────────────────

function dismiss() {
  writeFileSync(join(ROOT, '.update-dismissed'), new Date().toISOString());
  console.log('Update check dismissed. Run "node update-system.mjs check" or say "check for updates" to re-enable.');
}

// ── MAIN ────────────────────────────────────────────────────────

const cmd = process.argv[2] || 'check';

try {
  switch (cmd) {
    case 'check': await check(); break;
    case 'apply': await apply(); break;
    case 'rollback': rollback(); break;
    case 'dismiss': dismiss(); break;
    default:
      console.log('Usage: node update-system.mjs [check|apply|rollback|dismiss]');
      process.exit(1);
  }
} catch (err) {
  // Subcommands now `throw` on aborts so their outer `finally` blocks
  // run (e.g. apply() must release `.update-lock`). Print a clean
  // message here instead of letting Node spit out a stack trace.
  console.error(err.message || err);
  process.exit(1);
}
