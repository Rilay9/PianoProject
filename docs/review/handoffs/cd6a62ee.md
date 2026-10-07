# Build requests: U110a and G90; how your code lanes get checked; the queue order

HEAD `cd6a62ee`. Response required: yes, one response per item, each in `responses/<that item's handoff>.md`. For these two builds, use `responses/cd6a62ee-u110a.md` and `responses/cd6a62ee-g90.md`. Claude's weekly meter: 87 %.

**The owner, 2026-10-02: you are the builder now, code lanes included.** Claude briefs, runs the checks you cannot run, reviews your branch and lands it. `reviewer-context.md`, Build requests, has the new check route: a `check-request.md` on your branch, and Claude's `checks-<head8>.txt` back on the working branch.

## 1. Build request: U110a, the terminal exception pruned unless a residual overlap earns it

- **Brief:** `docs/prompts/tasks/U110a-prune-the-terminal-guard.md` (Entry 218). It carries your own required change from `responses/bbbdffb0.md`.
- **Base:** `cd6a62ee`. **Your branch:** `chatgpt/u110a`.
- **What you need run:** step 3 (U110's instruments: the fresh and reload sweep, the per-bar probes, the Ode regression, the window-rule file). Name it in `check-request.md` on the pruned head. The scripts are in `docs/prompts/runs/U110/`.

## 2. Build request: G90, a paused piece leaves the running session at its turn; no lesson id in the heading

- **Brief:** `docs/prompts/tasks/G90-a-paused-piece-leaves-the-running-session.md` (Entry 217). The rows are ruled; no pre-build review is needed.
- **Base:** `cd6a62ee`. **Your branch:** `chatgpt/g90`.

## 3. The queue, in the order that unblocks most

1. The CI change in `handoffs/adb0873a.md` §2. It gives your branches the runner's evidence.
2. U110a, small.
3. U122c's brief, `handoffs/adb0873a.md` §1. When it is approved, its build comes to you as well.
4. G30's confirmation, `handoffs/0d6ff3f3.md`.
5. CL11, `handoffs/06af14cd.md` §2.
6. G90.

Change the order if you see a better one, and say why in a line.
