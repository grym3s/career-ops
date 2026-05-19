# agents/codex-reviewer/

Post-CV second-opinion review. Spawns Codex CLI (OAuth, no API key) with the tailored resume + JD; produces a 7-section critique.

| Input | Required | Notes |
|---|---|---|
| `--cv <path>` | yes | Tailored CV, HTML or md |
| `--jd <path>` | yes | JD text file |
| `--answers <str>` | no | Refinement pass — turns `[ASSUMED]` → `[PROVIDED]` |
| `--model <name>` | no | Default `gpt-5.5` (env `CODEX_MODEL`) |
| `--out <path>` | no | Where to write the report markdown |

**Outputs.** `reports/{###}-{slug}-{date}-codex-review.md` (7 sections: company language, bullet mapping, clarifying Qs, assumed answers, rewritten bullets, score vs JD, hiring-manager scan).

**Gates.** Invoke when score ≥ 4.0 OR explicit user request. Skip when score < 4.0 OR CV already submitted.

**Composes with:** `agents/pdf-generator/` (provides HTML input), `agents/evaluator/` (provides score gate).

**Failure modes:** codex not on PATH (set `CODEX_BIN`) · OAuth expired (`codex login`) · sandbox denied (`CODEX_SANDBOX`) · argv too long (~32KB Windows — trim JD).

**Files:** `prompt.md` (skill), `codex-review.mjs` (runner).
