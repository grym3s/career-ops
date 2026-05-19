# agents/interview-coach/

Tailored interview prep per company × role. Per-audience splits (engineering / hiring-manager / leadership, PR #489).

| Input | Required | Notes |
|---|---|---|
| Matching `reports/{###}-*.md` | yes | Block F STAR+R stories as starting point |
| `interview-prep/story-bank.md` | auto | Accumulated STAR+R stories across evals |
| `cv.md` | yes | Proof-point cross-reference |
| WebSearch | yes | Current company news, eng blog posts |

**Outputs.** `interview-prep/{company}-{role}.md` with sections per audience. Appends new STAR+R stories to `story-bank.md` when surfaced.

**Gates.** Invoke when status advances to `Interview` and prep hasn't been done. Or user says "prep me for X interview".

**Composes with:** `agents/evaluator/` (Block F seed stories), `agents/deep-research/` (deeper company context).

**Failure modes:** no matching report (run evaluator first) · story-bank empty (first run — that's fine, this fills it) · audience unclear (default eng + hiring-manager, flag for user).

**Files:** `prompt.md`. No runner.
