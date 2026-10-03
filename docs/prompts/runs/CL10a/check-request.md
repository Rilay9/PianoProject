# CL10a — round-two independent oracle, before changing the detector

Base for this test-only checkpoint: `bdbee1365f8c89e6f4493400b218ab59c320084e`.
Oracle and research read at working head `d1b40b9828eeeaf62889d9509effddd05f32cb51`.
No implementation change is included in this checkpoint. The published first-round counts are not a correctness verdict.

## Run this checkpoint first

Use the same isolated checkout/content setup as the previous CL10a checks. From repository root run `python tools/content/build.py --offline`; from `app/`:

```sh
npx vitest run tests/unit/cl10aTextureOracle.test.ts --reporter=verbose
```

The test uses the existing shipped-catalog helper, OSMD loading and extraction, and the production detector. It reads the independent oracle's eleven unconditional items, prints the three conditional items, and checks every generated scale/Hanon/arpeggio/chromatic member. Each score load is bounded at two minutes; each complete family case at ten minutes. Missing catalogue items are errors, never skips. No `describe.sequential` is used.

Expected on this unchanged first-round detector: false positives on the five two-hand exercise oracle items and on all four family checks. Lower-line-only controls should remain false; the four accompanied-melody positives should remain true. These are predictions, not observations. Conditional traces have no asserted pedagogical verdict.

Publish the actual assertion results and the `CL10A_TEXTURE_ORACLE` / `CL10A_TEXTURE_FAMILY` lines. The interval traces are explicitly scoped to the first four performed bars; the bar eligibility/qualification arrays cover the whole score. First read the similar-motion scale, Hanon and both-hand Alberti traces. Do not interpret an item name as a score reading. Then inspect the conditional stride, oom-pah and Clementi cases using the printed indices and source score; a truncated trace does not establish their whole-piece texture.

## Why this checkpoint precedes a guard

The relay explicitly asks for two exercises and an Alberti piece through the detector before a fix. This workspace has the committed source but no built catalogue, score binaries or executable OSMD checkout. Generator source confirms the mechanism is plausible: accompaniment adds a separate upper scale, whereas parallel exercises double the line. That is source evidence, not an executed score trace. Publishing this probe makes the required measurement concrete without pretending it happened.

The primary research treats voice count and layer count separately (Giraud et al., ISMIR 2014, section 2.1). Synchronised parallel parts can be one melodic layer; melody/accompaniment roles remain ambiguous. It does not validate the note's guessed 90%/80% thresholds. Proposed next guard: exact onset-and-duration locking of two single-note lines, with consistent same or mirrored moving contour; reject the locked bars as accompaniment while retaining them in the eligible denominator. This is a candidate, not a settled universal texture classifier. Approximate locking, chordal homorhythm and counterpoint remain open. No threshold will be chosen to empty the deferred table.

## Next phase after these readings

Implement the discriminated guard in the existing CL10a branch, then request the independent oracle again, the full corpus diff, and two score samples from each classical/pop/folk/ragtime gain family with qualifying bars. Only after that measurement repin each affected bridge/untaught fixture deliberately and regenerate the two goldens, itemising new fields. Explain 1.3 bass-clef and technique.5 hand-independence from their actual requirement readers. All 22 lane-owned content failures must be resolved; the scratch import-test loader issue reproduced on base is an environment failure. No pass, golden regeneration, musical acceptance or landing readiness is claimed here. Nobody in this process can hear music: unverified as music.

Original first-round request remains in the preceding commit. Commit ids above come from repository commit records, not a claimed local git log.
