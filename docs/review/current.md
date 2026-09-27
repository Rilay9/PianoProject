# Reviewer handoff

HEAD: 7bf7838 (F0's commit is `b8f713c`, the T53 brief `4c69c7a`, the merge of the reviewer's response `7bf7838`; this handoff's commit follows)

## Dispositions of the reviewer's last response (`responses/8686421.md`, for the T52 handoff)

| finding | status | disposition |
|---|---|---|
| T52 boundary and copy | ACCEPT | closed; E21's wording part marked done; nothing further |
| deliberately no-rung pieces returning in Review | LATER WAVE | recorded in E21 and R19 with the required distinction ("not on a rung" ≠ "opted out of maintenance"; never overloaded onto `lessonIds`); no change now; the owner is asked when the repertoire semantics are specified |
| rungs where an assigned import cannot satisfy a song-run requirement | LATER WAVE | recorded in E21; no interim warning on the sheet; the workflow must say what an assignment can satisfy |
| L96 | LATER WAVE | recorded in L96 with the invariant kept (a Review slot needs a retrieval, retention, reinforcement or revisit purpose); resolved when X owns composition |
| sequence F0 → C7 → D0 → E | ACCEPT | followed: F0 delivered, C7 dispatched |

## What changed since the last handoff (8cffecd)

- **F0 delivered, Entry 82** (`docs/prompts/entry-82.md`): 32 lessons corrected under the three-layer rule — the rhythm sentence (1.2), the single dot and the double dot (1.4), the anacrusis as a convention with *When the Saints* read from the score (1.4), the half pedal as the dampers' partial engagement sourced to Lehtonen 2009 with the Score screen's range in the lesson's words (technique.7, T51), tonicisation and modulation (theory.7, .8, jazz.8), chord-scales as one framework (theory.7, improv.6), the modes as colour (theory.5), the technique universals (technique.4–.7), the safety law (practice.4, 4.4), swing as a first model (4.5, jazz.3–.5, blues.4); every corrected sentence with its layer and source in `docs/prompts/f0-corrected-sentences.md`; the old audit's 87 boxes reconciled with a category on each deferral in `docs/prompts/f0-disposition-85.md`; the absolutes lint (`tools/content/lint_absolutes.py`, diagnostic) with its output in `docs/prompts/lint-absolutes-2026-09-26.md`.
- **A P0 found by F0 outside its files**: the generator prints impossible arpeggio fingering (left hand two octaves 5-3-2-5-3-2-1 ascending; finger 2 twice in a row on black-key arpeggios; A♭ spelled with G♯; 89 of 120 arpeggio items flagged in `docs/prompts/f0-arpeggio-fingering-scan.txt`). Lesson 4.3 line 40 warns the learner about the printed left hand until it is fixed, with a test row that fails the day it is. Rows G41 (P0), R48 (*Ode to Joy (full)* bar 12, repeated from T22), G42 (two comments with the old half-pedal model). **T53** is written for the gate: `docs/prompts/tasks/T53-fingering-truth.md`.
- Rows T28–T41, T51, T40, T49 and M11 built; T52–T54 new (lessons contradicting the app; the absolutes and the 39 deferrals for F; the outside-expert list).
- C7 dispatched as Entry 83 after F0's chain.

## Decisions made (the orchestrator's, to overrule)

- F0's 4.3 stopgap (teach the common fingering, warn that the printed one is wrong) accepted as honest until T53.
- T53 sequenced after C7 unless the reviewer says before (P0, but it touches the generator, not C7's files; either order is safe).

## Files to inspect, in order

1. `docs/prompts/entry-82.md` — judgement first; the red captures summarised in it.
2. `docs/prompts/f0-corrected-sentences.md` and the lessons the brief named: `content/lessons/1.2.md`, `1.4.md`, `technique.7.md`, `practice.4.md`; then `4.3.md` line 40.
3. `app/tests/unit/lessonClaimsNeverTeachWrong.test.ts`; the F0 blocks in `lessonClaimsAboutApp.test.ts` (9 rows) and `lessonClaimsAboutMusic.test.ts` (13 rows).
4. `docs/prompts/f0-disposition-85.md` — the 87 boxes; the 39 deferred with categories.
5. `docs/prompts/pictures/f0/` — technique.7 and 1.2 at 342 × 740.
6. `docs/prompts/tasks/T53-fingering-truth.md` — the gate.

## Tests and verification

- The builder's runs, unpiped: content build 0, validator 0, content tests 0, tsc 0, lint 0, vitest 0 (the built copy of 4.3 was two words behind its source at the builder's last run; the orchestrator's chain rebuilt it).
- The orchestrator's chain over `b8f713c`: content build, validator, content tests, tsc, lint, vitest, app build exit 0; the full default Playwright configuration 791 passed, 7 skipped, none failed. The states gallery not run (no score rendering changed).
- Nothing heard. The outside-expert list (eleven items) is in the entry and in row T54.

## Questions for the reviewer

1. **T53's gate** (BLOCKS T53 DISPATCH): approve as written, change, or run before C7 finishes?
2. The half-pedal register under a part-way pedal: should F say anything once a source is found, or leave it to the ear? F0 left it out.
3. The 39 old-audit deferrals: is the category set (musical judgement; voice rewrite; contested fact; outside expert) the right ordering for F?

## Do not re-review

Parts 12–27; the C6 fix-forward; T52 (accepted).
