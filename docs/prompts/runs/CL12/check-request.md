# CL12 Round 1 — measurement request

Base: `9dedcc0560503f46b18387a5eddf6d0274d54fe2`.
Probe implementation: `1a04c6fe94be86d7c9a96da0df39521d903f5dc5`.
Both SHAs were copied from the repository connector's commit records/results. No local checkout or `git log` was available; no SHA is claimed to come from a local command.

## Run

Use a scratch worktree at the branch head, with built content under `app/public/content` and dependencies installed by the existing setup. From `app/`, copy the probe into the unit-test directory, where its relative imports resolve:

PowerShell:
```powershell
Copy-Item ../docs/prompts/runs/CL12/scripts-probe.test.ts tests/unit/cl12ScriptsProbe.test.ts
npx vitest run tests/unit/cl12ScriptsProbe.test.ts --reporter=verbose --no-file-parallelism *> ../docs/prompts/runs/CL12/checks-1a04c6fe.txt
```

POSIX equivalent:
```sh
cp ../docs/prompts/runs/CL12/scripts-probe.test.ts tests/unit/cl12ScriptsProbe.test.ts
npx vitest run tests/unit/cl12ScriptsProbe.test.ts --reporter=verbose --no-file-parallelism > ../docs/prompts/runs/CL12/checks-1a04c6fe.txt 2>&1
```

Record the actual branch head and exit code in the published output. Remove the copied test after running; do not land it under app/. Leave C4C_DIARY, C4C_DIARY_ROWS, C6_DIARY, C4D_COMPOSED_REPORT and E0_FLOOR unset so the shipping defaults are measured and no optional output paths need creating. This probe has not been run here. No red/green claim is made.

## What it measures

The probe copies the existing diary setup at the base, keeps the generator/engine/evidence/IndexedDB progression and all scenario-specific actions, and executes the two families sequentially. The experienced musician retains WORDS for 4.1 and 4.2; the intermediate retains the Library day and Petzold actions.

It prints:
- `CL12_DAY`: every morning's row kind, item id, reason and judging lesson. Skip: 30 days; ambiguity-a and ambiguity-b: 10 each; intermediate and musician: 30 each. These are fixture lengths, not observed results.
- `CL12_COUNT`: by learner and row kind, row count, distinct item count, longest same-item consecutive-day streak, rows without items/reasons, and review fallback count. A missing-item day breaks a streak.
- `CL12_EXHAUSTION`: two counterfactuals per learner. First mark ordinary work from placement onward met while preserving behind-placement and set-aside states; then mark all ordinary work met while preserving set-aside states. Print the exact nextRecommended result, including null. These edits are in-memory probe input only, explicitly synthetic, and fabricate no stored learner evidence.

`composedContract.test.ts` is imported unchanged, so its established curriculum/reader/generator contract assertions run as well. It walks composed recipes; it defines no additional daily learner. Its assertions do not classify Today purposes.

The base has row kinds and free reasons but no shared typed five-purpose model. The probe deliberately reports those raw inputs rather than pretending a technique/review/new label establishes retrieval/application/development/exploration/project. Round 2 may map purpose only after these results and settled rules are read.

## Prior checkpoint comparison

Read `docs/prompts/checkpoint-2026-09-26-slots-diaries-after.md`: its printed skip, intermediate and musician histories supply the three original 30-day cards. The brief's skip review observation is three distinct items and a ten-day repetition. This probe re-measures distinct review items, longest consecutive repetition and exact reasons on the current base; it also measures every other row kind and both ambiguity variants, absent from that checkpoint. It does not assume the old counts still hold.

## Next action

Publish the stdout/stderr and exit code as `docs/prompts/runs/CL12/checks-<reviewed-head8>.txt` on the working branch, naming the actual probe implementation SHA if the filename uses a later docs-only head. Round 2 waits for those results. No purpose model, layout design, app code, stored schema or lane records are changed by this round.
