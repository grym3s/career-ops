# agents/project-eval/

Evaluates a portfolio project against target archetypes. "Should I keep building / promoting this, or kill it?"

| Input | Required | Notes |
|---|---|---|
| Project description | yes | One paragraph + status |
| Project URL / repo | optional | For deeper context |
| `me/_profile.md` | yes | Target archetypes |
| `article-digest.md` | auto | Check if already cited |

**Outputs.** Markdown evaluation: which archetypes this proves, whether it's interview-grade, suggested 1-line summary for `article-digest.md`, suggested next milestones if not yet interview-grade.

**Gates.** User asks "should I keep building X?" / after completing a portfolio project (decide if it earns an `article-digest.md` slot).

**Composes with:** `agents/evaluator/` (same framework), `agents/training-eval/` (sibling).

**Failure modes:** project status unclear (ask "shipped"/"in progress"/"shelved") · private repo (use user-pasted description; note that public reviewability is part of the signal).

**Files:** `prompt.md`. No runner.
