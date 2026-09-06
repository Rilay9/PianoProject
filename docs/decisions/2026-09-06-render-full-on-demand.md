# The full render check runs on demand, not on a schedule

Date: 2026-09-06 · Owner decision · Amends the P11 prompt

`prompts/P11-pipeline-robustness.md` §3 asked for `.github/workflows/render-full.yml`
"on `workflow_dispatch` and a weekly schedule". It was built with both and the cron has
now been removed. `workflow_dispatch` stays.

## Why

The weekly job existed to close one specific hole. The render check is incremental — it
engraves only files whose sha256 is not already in `build/render-manifest.json` — and that
has a blind spot by construction: a change in OpenSheetMusicDisplay, in the ScoreModel
extractor or in the browser leaves every remembered result standing, because no score file
moved. A scheduled `--full` run meant a renderer regression had at most seven days to hide.

Three things make the schedule a poor way to buy that.

**It is now a five-minute local command.** Before P11 a full render was the expensive thing
you would only do on a runner. Measured after it: `build.py --offline --render` from an
empty manifest is **300 s** on the owner's laptop, including the content build. Something
that cheap does not need a robot to remember it.

**The trigger is a version bump, not a date.** OpenSheetMusicDisplay is pinned at 2.1.2
(`01` §3) and moves only when someone deliberately moves it. A check tied to the calendar
runs fifty-one times against an unchanged library to catch the one week that mattered — and
it would report the regression *after* the merge, where running `--full` on the branch
reports it before.

**The repository is going private** (`00` A6, D19). While it is public, Actions minutes are
free; once private they come out of a monthly allowance, and the artifacts this job uploads —
a render report and ~690 preview PNGs, retained 14–30 days — come out of the storage
allowance, which is the smaller of the two. Paying that every Monday for a library that has
not changed is the wrong shape.

The owner's framing, 2026-09-06: happy to do this sort of thing locally.

## What replaces it

Run `python3 tools/content/render_check.py --full` — or dispatch the workflow from the
Actions tab — whenever **OSMD, `convert.py` or the ScoreModel extractor changes**, before
merging that change. `docs/01` §7 and `docs/03` §3a say the same in the places a builder
will actually be reading.

## What was kept

`ci.yml` stays on every push. It is not a duplicate of this: it runs the *incremental*
check, and it is the only place the suite runs on Linux. Two things depend on that — the
`-linux` visual-snapshot baselines in `score.spec.ts` and `score.layout.spec.ts`, which
have no Windows equivalent and so only compare anything in CI, and the clean-clone path
(fresh `npm ci`, fresh content build, no warm cache), which is exactly the class of bug P11
spent its time on.
