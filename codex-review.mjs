#!/usr/bin/env node

/**
 * codex-review.mjs — Post-CV-generation review via OpenAI Codex CLI
 *
 * Hands the tailored resume + the JD to `codex exec` and asks for:
 *   1) Company language extraction (skills, outcomes, traits)
 *   2) Bullet mapping + gap highlights
 *   3) Clarifying questions + assumed answers for this pass
 *   4) Rewritten bullets (<20 words, metric-driven, high-impact)
 *   5) Score vs JD (overall %, keyword match, skills, outcomes, role fit) + missing terms + weak bullet flags
 *   6) Hiring-manager 10-second scan (interview potential, biggest doubts, fixes)
 *
 * Codex runs OAuth-logged-in (ChatGPT login) by default — no API key needed.
 *
 * Usage:
 *   node codex-review.mjs --cv <path> --jd <path> [--out <path>] [--answers "..."] [--model NAME]
 *
 * Env overrides:
 *   CODEX_BIN     full path to codex binary (default: "codex" on PATH)
 *   CODEX_MODEL   default model id if --model omitted (default: "gpt-5.5")
 *   CODEX_SANDBOX sandbox mode (default: "read-only")
 *
 * Exits 0 on success, prints the review markdown to stdout, also writes it to --out if given.
 */

import { spawn } from 'child_process';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { dirname, resolve } from 'path';

const CODEX_BIN = process.env.CODEX_BIN || 'codex';
const CODEX_SANDBOX = process.env.CODEX_SANDBOX || 'read-only';
const DEFAULT_MODEL = process.env.CODEX_MODEL || 'gpt-5.5';

function parseArgs(argv) {
  const out = { cv: null, jd: null, out: null, answers: '', model: DEFAULT_MODEL };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--cv') out.cv = argv[++i];
    else if (a === '--jd') out.jd = argv[++i];
    else if (a === '--out') out.out = argv[++i];
    else if (a === '--answers') out.answers = argv[++i];
    else if (a === '--model') out.model = argv[++i];
    else if (a === '-h' || a === '--help') { printUsage(); process.exit(0); }
    else { console.error(`Unknown arg: ${a}`); printUsage(); process.exit(2); }
  }
  return out;
}

function printUsage() {
  console.error(
    'Usage: node codex-review.mjs --cv <path> --jd <path> [--out <path>] [--answers "..."] [--model NAME]'
  );
}

function buildPrompt({ cvText, jdText, answers }) {
  return [
    'You are reviewing a tailored resume against a job description for a candidate who is about to apply.',
    'Be direct and specific. No fluff, no corporate-speak, no "leverage" or "passionate about."',
    '',
    'Produce the output as a single markdown document with the seven numbered sections below, in order.',
    'Do not skip sections. Do not add sections. Do not chat before or after the markdown.',
    '',
    '## Required output structure',
    '',
    '### 1) Company language',
    'From the JD, extract the exact vocabulary the company uses. Three subsections:',
    '- **Skills** (technical and methodological terms — use the JD\'s phrasing verbatim)',
    '- **Outcomes** (results the role is expected to drive — verbatim)',
    '- **Traits** (behaviors / dispositions the JD signals — verbatim)',
    'List as bullets. Quote the source phrasing.',
    '',
    '### 2) Bullet mapping + gaps',
    'A markdown table with columns: `Company language` | `Matched resume bullet (verbatim)` | `Match strength (Strong / Weak / Gap)` | `Notes`.',
    'One row per item from section 1. If no bullet matches, write `GAP` and leave matched bullet empty.',
    '',
    '### 3) Clarifying questions',
    'List the 3-7 questions you would ask the candidate before rewriting bullets. Be specific (numbers, scope, ownership, recency).',
    'These are not rhetorical — they are the things you need to know to write accurate, metric-driven bullets.',
    '',
    '### 4) Assumed answers for this pass',
    'For each clarifying question, state the assumption you are making to proceed with the rewrites. Mark each as `[ASSUMED]` so the candidate can correct.',
    'If the candidate provided answers (see "Candidate answers" below), use those verbatim and mark `[PROVIDED]` instead.',
    '',
    '### 5) Rewritten bullets',
    'A markdown table with columns: `#` | `Original bullet` | `Rewrite` | `Company-language terms hit` | `Word count`.',
    'Rules for rewrites:',
    '- Under 20 words (count and report)',
    '- Lead with a verb',
    '- Include a metric or concrete outcome whenever possible',
    '- Use the company\'s vocabulary from section 1 verbatim where truthful',
    '- Never invent skills, projects, or numbers the candidate doesn\'t have',
    'Rewrite every bullet that appears in the resume. If a bullet should be cut, write `CUT` in the rewrite column with a one-line reason.',
    '',
    '### 6) Score vs JD',
    'Report as a markdown table:',
    '- `Overall fit` (%)',
    '- `Keyword match` (%)',
    '- `Skills coverage` (%)',
    '- `Outcomes alignment` (%)',
    '- `Role fit` (%)',
    'Then two subsections:',
    '- **Missing terms** — JD terms not present in the resume after rewrites',
    '- **Weak bullet flags** — bullets that are vague, metric-free, or off-target (cite by # from section 5)',
    '',
    '### 7) Hiring manager — 10-second scan',
    'Read the resume as a hiring manager would in 10 seconds: top of page only, skim.',
    '- **Interview potential**: Yes / Maybe / No, one sentence why',
    '- **Biggest doubts** (top 3, ranked)',
    '- **Quick fixes** (bullet list of changes that would resolve the doubts)',
    '',
    '---',
    '',
    '## Inputs',
    '',
    '### Job description',
    '```',
    jdText,
    '```',
    '',
    '### Resume (tailored for this role)',
    '```',
    cvText,
    '```',
    '',
    '### Candidate answers (optional)',
    answers ? answers : '_(none provided — use [ASSUMED] markers in section 4 and proceed)_',
    '',
    'Now produce the seven-section markdown review.',
  ].join('\n');
}

function runCodex({ prompt, model }) {
  return new Promise((resolvePromise, rejectPromise) => {
    const args = ['exec', '--sandbox', CODEX_SANDBOX, '-m', model, prompt];
    const child = spawn(CODEX_BIN, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false,
    });

    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => {
      const s = chunk.toString();
      stdout += s;
      process.stdout.write(s);
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', (err) => {
      if (err.code === 'ENOENT') {
        rejectPromise(new Error(
          `codex binary not found (tried "${CODEX_BIN}"). ` +
          `Install Codex CLI and run \`codex login\`, or set CODEX_BIN to the full path.`
        ));
      } else {
        rejectPromise(err);
      }
    });

    child.on('close', (code) => {
      if (code === 0) resolvePromise({ stdout, stderr });
      else rejectPromise(new Error(`codex exited with code ${code}\nstderr:\n${stderr}`));
    });
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.cv || !args.jd) { printUsage(); process.exit(2); }

  const cvPath = resolve(args.cv);
  const jdPath = resolve(args.jd);

  const [cvText, jdText] = await Promise.all([
    readFile(cvPath, 'utf-8'),
    readFile(jdPath, 'utf-8'),
  ]);

  const prompt = buildPrompt({ cvText, jdText, answers: args.answers });

  console.error(`→ codex exec -m ${args.model} --sandbox ${CODEX_SANDBOX}`);
  console.error(`  cv: ${cvPath} (${cvText.length} chars)`);
  console.error(`  jd: ${jdPath} (${jdText.length} chars)`);
  console.error('');

  const { stdout } = await runCodex({ prompt, model: args.model });

  if (args.out) {
    const outPath = resolve(args.out);
    await mkdir(dirname(outPath), { recursive: true });
    await writeFile(outPath, stdout, 'utf-8');
    console.error('');
    console.error(`✅ Review written to ${outPath}`);
  }
}

main().catch((err) => {
  console.error(`❌ ${err.message}`);
  process.exit(1);
});
