# Current product-convergence scheduler

Authoritative from 2026-10-03. This replaces the 2026-10-01 scheduler as the dispatch authority.

The governing boundary is `docs/prompts/charter.md` plus `docs/prompts/runs/disposition.md`. The old content queue, CT1/CL10a direction, September-30 convergence statuses and historical audit rows are evidence only. They do not dispatch work.

The project is now in **product finish**, not architecture discovery.

## Active blocker cap

There is no obligation to fill ten slots. Keep the active list as small as the current learner product permits. A new item enters only if it causes a demonstrated learner-facing failure, corrupts saved state, blocks trustworthy release verification, or lets a responsibility be removed/simplified. Otherwise it stays history.

### Blocker 1 — finish the whole Score experience at the piano

This is the only broad product-design blocker currently established by the existing record.

Close the Score as one product boundary, not a sequence of independent chrome/window patches:

- phone upright: stable portrait reading with useful next music visible; the current system does not visibly jump as the two reading surfaces recycle;
- phone sideways: readable notation, reachable controls, no chrome/notation competition, and the run remains stable while playing;
- tablet: use the available space on its own terms rather than inheriting phone compromises;
- all three: no distortion, no notation/chrome overlap, readable current music, useful look-ahead, honest status, and predictable pause/rotate/background behaviour.

Use the already-set acceptance cells from `docs/04-ui-spec.md` R7 and the existing U122/CL07/U30 evidence. The current Score work is allowed to finish only this whole boundary. Do not create a new viewport architecture, density classifier, control framework or Score subproject unless the accepted design demonstrably requires it.

**Finish condition:** the whole important Score state is inspected on phone upright, phone sideways and tablet; the real-phone pass covers safe areas/system UI, pause/resume/background, rotation and MIDI reconnect where available; the remaining known P1 Score issue is either fixed or shown not to reproduce. Screenshots/metrics support the judgement but do not replace reading the screen as a learner.

### Blocker 2 — representative learner journey release acceptance

After Blocker 1, run one deliberately small whole-product acceptance journey from the current tree:

1. Today explains what to do and why;
2. the learner opens the lesson/activity and can start without hunting;
3. Score/practice behaves as accepted above;
4. the summary says only what was actually measured and gives a sensible next action;
5. Today/Plan/Progress agree about what happened;
6. one real-repertoire transfer path works from learner need to a curated passage/piece;
7. Simon, Lab/Jam and Free Play each communicate their distinct purpose without granting evidence they did not observe.

This is not a new audit matrix. Use representative cases only. If a concrete learner-visible failure appears, it may become an active blocker and must displace lower-value work rather than spawning a new wave. If the journey works, close it; do not broaden the test merely to discover more work.

### Blocker 3 — release hardening only after behaviour is stable

Run the existing H1/H2 release checks after Blockers 1–2 are materially stable. Fix test/load/flakiness issues only where they prevent trustworthy verification of the product. Do not turn suite cleanup into a product program.

## Explicitly parked now

### CL12a

`chatgpt/cl12a` is parked, not an active build. As of 2026-10-03 it is one commit ahead of its old base but 42 commits behind the working branch, and its unique commit adds only a boundary test plus run/check documents; it contains no product implementation. The charter says CL12 survives only if near completion and materially improves the learner experience. This branch does not meet that bar.

Do not port or continue CL12a merely to preserve its purpose taxonomy. During Blocker 2, if the current Today → activity → summary → next flow reveals a specific purpose/wording mismatch, fix that concrete learner-facing mismatch in the smallest current-tree seam. No episode framework or purpose ontology is authorized by default.

### Closed truth work

Do not reopen these merely because older scheduler text named them:

- CQ1 is closed and its authority boundary is merged;
- CL11a's loop-scoring required change was carried by CL11c and CL11a is closed;
- CL11b is closed;
- G90/G90a, U110/U110a/U110b and U118/U118b are closed;
- CL10a is stopped;
- CL17's broad migration remains frozen;
- detector perfection, corpus sweeps, lesson checkbox batches, mass library migration and generator rewrites remain deleted/frozen by the charter/disposition.

## What does not become a blocker by itself

The following are not dispatch reasons without a current learner failure:

- an old backlog row still saying `pending`;
- a drafted brief;
- a validator/report table that is not learner-consumed;
- a cleaner abstraction;
- an unaudited hypothesis;
- a corpus cell that is thin;
- a detector that could be more accurate but has no authoritative learner-facing consumer;
- a source/library that could replace code without a demonstrated parity/simplification win.

## Dispatch rule

Before any new substantial implementation, state in ordinary product language:

1. what the learner currently experiences that is wrong or unfinished;
2. the current evidence that proves it;
3. the smallest change that fixes the experience without creating new authority or architecture;
4. the observable finish condition.

If those four sentences cannot be written from current evidence, do not dispatch.

## End state

The project is finished when the representative learner journey is coherent and trustworthy, the Score is genuinely usable at the piano across its three designs, release verification is trustworthy, and no known active blocker changes what the learner is taught, offered, credited, told or able to do.

Do not search for another program of work after that. Ship the product and let real use generate the next evidence.
