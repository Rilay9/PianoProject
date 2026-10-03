# What lives only on the local machine (the local orchestrator's handover, 2026-10-03)

The cloud foreman owns content recovery (`docs/prompts/cloud-primary-content-recovery.md`). This note lists what is not in GitHub, so the cloud foreman neither looks for it here nor rebuilds it by accident.

## Local-only artifacts

1. **The landing scripts.** These are `record-app-seam.py` (it writes an entry, the handoff, the records and the backlog rows from a landed lane), the per-lane chain scripts (`chain<LANE>/run.sh`) and the night runbook. They live in the local orchestrator's session scratchpad, not in the repository; a copy of `record-app-seam.py` is in `C:\Users\yalir\repos\Piano Stuff\orchestrator\`. The repository holds what they call: `tools/docs/record_mirrors.py`, `tools/docs/split_prompt_views.py`, `tools/docs/checks_for_paths.py` and the content tools. The landing loop itself is in `operating-procedure.md` §14:
   1. merge the lane `--no-ff`;
   2. run the mapped checks (`checks_for_paths.py` on the changed paths): tsc, lint, vitest, the app build, the browser specs the map names;
   3. record the landing;
   4. run `split_prompt_views.py`, then `record_mirrors.py`, then `record_mirrors.py --check` (unpiped);
   5. commit the named paths and push.

   A cloud lander can do the same with the repository tools, writing the entry and handoff by hand.
2. **The build's untracked inputs.**
   - `content/scores/imported/{kern,musetrainer,mutopia}` and `build/cache` exist locally from earlier fetches. CI rebuilds them with `python3 tools/content/build.py` (online), and a cloud session should do the same.
   - The owner's local PDMX archive, if one exists outside the repository, is local-only: ask for an exact bounded query.
3. **Local-machine rules that do not apply in the cloud.** One shared browser lock (`/c/Users/yalir/repos/pw-lock`), at most two Playwright workers (this PC crashed under three browser runs), and Windows Git Bash quirks.
4. **The five-question stop hook** is in the repository (`.claude/settings.json`, `.claude/hooks/stop-checklist.js`), so a cloud session gets it too.

## State at handover

- **The working branch** is `claude/piano-teaching-app-bo19td`, including the adopted recovery path. Every push deploys to the owner's phone (`pages.yml`). PR #1 is never merged.
- **Open and in flight:**
  - CL12a on `chatgpt/cl12a`, the outside builder's slice A of the composed day, with its handback decided in `docs/prompts/runs/CL12a/checks-23606e0a.txt`;
  - CT1's evidence handback, pending on `claude/content-truth`.
- **Superseded or stopped:** CL10a (by CT1); CT1 (by the recovery path). The landed lanes and their records are in `docs/pending-review.md` and `docs/prompts/tasks/README.md`.
- **Rules added on 2026-10-03,** each in the repository:
  - reuse before reinvention (`CLAUDE.md`, first section);
  - the content mistakes (`docs/prompts/content-mistakes.md`);
  - a builder's tests prove intent, not correctness (`operating-procedure.md` §12);
  - the first decision of every piece of work (§10a);
  - the reviewer's verdict is evidence, not a gate (the second-read paragraph).
