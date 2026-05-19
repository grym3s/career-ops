# agents/training-eval/

Evaluates a course / certification against the candidate's career trajectory. Same spirit as `agents/evaluator/` but for "should I take this course?"

| Input | Required | Notes |
|---|---|---|
| Course info | yes | Name, provider, time, cost, syllabus |
| `cv.md` | yes | Current skill baseline |
| `me/_profile.md` | yes | Target archetypes |

**Outputs.** Markdown evaluation: relevance to target archetypes, cost-vs-signal trade-off, comparable cheaper/faster alternatives, recommended yes/no.

**Gates.** User asks "is course X worth it?" / "should I take cert Y?" Career-pivot consideration.

**Composes with:** `agents/evaluator/` (same scoring framework), `agents/project-eval/` (sibling for portfolio projects).

**Failure modes:** course info incomplete (one clarifying Q) · target archetype unclear (default to current mix, flag).

**Files:** `prompt.md`. No runner.
