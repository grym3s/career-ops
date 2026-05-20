@CONTEXT.md
@AGENTS.md
@~/Developer/browser-harness/SKILL.md
<!-- Claude Code-specific:
     - browser-harness is the canonical browser-control skill for this project.
       Install: git clone https://github.com/browser-use/browser-harness ~/Developer/browser-harness
                cd ~/Developer/browser-harness && uv tool install -e .
       It auto-connects to the user's already-running Chrome via CDP — used for
       the SEEK/LinkedIn/Indeed apply flows in agents/apply-helper/.
     - For SEEK-specific quirks not yet in browser-harness domain skills,
       read memory/reference_seek_apply_playbook.md before applying.
-->
