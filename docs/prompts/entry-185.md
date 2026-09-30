### Entry 185 — X42 — A sound that agrees with the mark wins: among several sounds at one position with a printed metronome mark, `tempoFromXml` now plays the one serialization-equivalent to the position's first mark (`SERIALIZATION_TOLERANCE` = 0.01 quarter notes a minute, derived from the corpus: its writers' largest noise 0.0002, the nearest difference any file here writes that is not noise 0.1), moving exactly *Maple Leaf Rag*'s bars 1 and 51 (120 → 100) and Satie's first *Gymnopédie*'s opening (60 → 76.0002) of 2,013 built scores; *Hungarian Dance* 5 pinned unchanged by the first-mark tie-break; X40's findings 15 on 4 rows → 12 on 2 (2026-09-30)

**Base.** `36be5a50`, origin's head at dispatch, confirmed with `git log -1` before anything else. Nothing committed, staged or stashed; the orchestrator commits the named files. The content is the main checkout's `app/public/content` copied read-only (the **personal** flavour: all 228 personal-tagged rows carry a file; 2,013 built scores, 226 of them MuseTrainer or kern), not rebuilt, since no content byte changes. Also copied read-only where a test needed it: `build/score-checks.json` (`test_measured_truth`), `build/rung-claims.json`, `build/midi-parity/`, `build/midi-real/` (two unit files), and `app/public/dev/` into the private builds (the microscope and excerpt specs).

**Product layer, first.** Nothing was heard. The Score screen was driven in a private build of the committed reader and one of the amended reader (`probe.txt`): its tempo label and bpm field, a Tempo run's label, and the dev harness's model, every number the model's own. Satie's new opening is **unverified as music**.

## Judgement

- ***Maple Leaf Rag* now plays at 100 throughout.** Before, it opened at the pickup's 100 and switched to 120 a sixteenth into bar 1, then stayed there. Bar 51 said 120 again. The 120 rode on two words-only directions, "Tempo Di Marcia" and "TRIO". Each stands first at its position, beside the printed quarter = 100 and that mark's own `<sound tempo="100">`. The reader now takes the 100 that agrees with the mark (`app/src/score/tempoFromXml.ts`:259–261, the amended `resolve`). On the Score screen the label five seconds into a Tempo run read "100% · 120 bpm" on the committed build and reads "100% · 100 bpm" now. The model's length for the piece at 100 % goes from 145.1 s to 174 s (computed from the map, not timed). This is a correction, not only an internal consistency fix. The Sapp kern edition already plays 100 throughout (`runs/X40/table.tsv`). The 1899 first edition prints no number at all, only "Tempo di marcia." (X40's reading of `reference-edition/mapleleaf.pdf`). So 100 is the transcriber's figure, and the file itself states it three times, each time with its own sound.
- **Satie's first *Gymnopédie* now counts in and plays its first beat at 76.0002, not 60. From its second beat it plays 61.9998 as before.** The opening direction prints "Lent et douloureux" with quarter = ca. 76 and sounds 60. The next direction, at the same place, is an empty text sounding 76.0002, which agrees with the printed 76 and now wins (`tempoFromXml.ts`:259–261). One quarter later (@0:1) four unmarked sounds stand, 61.9998, 69, 72 and 76.0002. The unchanged first-sound rule keeps 61.9998 there, as the ruling requires (`responses/81d9e4af.md`, "Maple Leaf and Satie"). On the Score screen the label at the opening reads "76 bpm" where it read "60 bpm", and the bpm field says 76 where it said 60. The count-in clicks at the map's tempo at the run's first step, so at 76.0002 (`docs/04-ui-spec.md`:1916–1918; inferred from the model, since no click was heard or timed). Five seconds into a run both builds read "62 bpm". Whether a count-in and first beat at 76 into a body near 62 reads better than today's near-steady 60 into 62 needs an ear: *unverified as music*. No one in this process can decide it, and it stays open.
- **The hypothesis held, corpus-wide.** Every one of the 2,013 built scores was read through the app's own unzip and `tempoEvents` on the committed reader and on the amended one (`corpus-diff.txt`, run at `SERIALIZATION_TOLERANCE` = 0.01). Exactly three positions changed, on two rows: Maple Leaf @1:0.25 and @51:0, and Satie @0:0. No other event on any row moved, the 226 MuseTrainer and kern rows included. X40's findings (a played sound beyond R = 1.1 of the mark beside it) go from 15 on 4 rows to 12 on 2 (`bach-toccata-fugue-bwv565` 7, `g-minor-bach.alt` 5); none newly appears anywhere. The file-level scan agrees: of the 2,013 built scores, only five positions carry more than one sound beside a mark (`noise-built.txt`). They are Brahms HD5 @65:0 and @67:1, Satie @0:0, and Maple Leaf @1:0.25 and @51:0. The three that move are the three the brief predicted. No fourth position was found.
- ***Hungarian Dance* 5 is unchanged, and the tie-break keeps it so.** @65:0 prints quarter = 40 with its 40, then quarter = 50 with its 50. It plays 40 before and after (@67:1, 20 with 20 then 40 with 40, likewise plays 20). The position's first mark is 40, the tie-break consults that mark only (`marks[:1]`), and the first sound agreeing with it is 40. A reading that took a sound agreeing with *any* mark would still give 40 here, because the sounds stand in the marks' order. So the unit test adds the order that tells the two apart: mark 40 alone, then mark 50 with 50, then a lone 40. The amended reader plays 40 and shows mark 40. The committed reader played 50 (red), and mutant c (any mark) plays 50 (red). X40's ratio 1.1 (mutant b) changes none of the *Hungarian Dance* guards: their siblings stand 25 % and 12.5 % from the first mark, beyond 1.1.
- **The tolerance.** `SERIALIZATION_TOLERANCE` = **0.01** quarter notes a minute (`tempoFromXml.ts`:239). The **maximum observed serialization delta is 0.0002** (`noise-built.txt`). Across the 2,013 built scores there are 2,361 sound/first-mark pairs at one position. 2,298 are equal, and the 63 that are not fall into three groups, with nothing between them:
  - 33 differ by exactly 0.0002. Every one is a MuseScore sound whose quarters-a-second figure has six significant digits: 76/60 is kept as 1.26667, and × 60 that is 76.0002. That form bounds the noise at 0.0003 from 60 to 600 a minute.
  - 2 PDMX pairs differ by a float's last bit, 1.4 × 10⁻¹⁴ (dotted quarter = 67 written 100.49999999999999).
  - 28 differ by 3 or more (*La Campanella*'s 88 against a printed eighth = 182, which is 91 in quarters).

  The 38,362 unbuilt PDMX pool files write nothing under 0.1 and 303 pairs at 0.1, such as 68.1 beside a printed 68 (`noise-pdmx-pool-summary.txt`). That is the nearest difference any file here writes that is not serialization noise. 0.01 is the one power of ten at least an order of magnitude clear of both ends. It is 50 times the observed maximum and 33 times the writer's bound. It is a tenth of 0.1, so one order of magnitude too wide already takes 100.1 for 100 (mutant d). It is two orders of magnitude under 1 bpm. It is neither X40's R = 1.1, which would take 95 for 100 (mutant b), nor the reviewer's illustrative 0.001.
- **Technical and pedagogical verdicts apart.** Technical: the rule is built as ruled, the census confirms its reach, and six mutants each redden a named test. Pedagogical: this bears only on Satie, and it is unverified as music. Maple Leaf's change needs no ear by the rulings' own standard, since the file prints 100 three times with agreeing sounds and the kern edition plays 100.

## Mechanism

The fault: `resolve` took `here.find((one) => one.sound !== undefined)?.sound`, the first raw sound at a position, unconditionally (committed `tempoFromXml.ts`:237). Separately it took the first mark (:238), so an event could play 120 while showing quarter = 100. The amendment keeps `mark` exactly as computed and lists the position's sounds in score order. Where a mark stands, it takes the first sound within `SERIALIZATION_TOLERANCE` of `mark.quarters` (the mark already normalised to quarter notes). Otherwise, or where none agrees, it takes the first sound as before:

```ts
const mark = here.find((one) => one.mark !== undefined)?.mark;
const sounds = here.flatMap((one) => (one.sound === undefined ? [] : [one.sound]));
const agreeing = mark === undefined ? undefined : sounds.find((bpm) => Math.abs(bpm - mark.quarters) <= SERIALIZATION_TOLERANCE);
const sound = agreeing ?? sounds[0];
```

The brief's alternative asked whether the tie-break's mark and the event's `mark` field could differ. They cannot: both are the one `mark` constant, and the reordered *Hungarian Dance* case asserts that the event shows the mark whose sound it plays. The contract comment's precedence paragraph (`tempoFromXml.ts`:30–38) carries the brief's sentence, with the constant named. `tempoEvents`' opening copy is untouched: Satie's first event already stands at 0:0, so only the value it opens with changed. The positions (`rawEvents`) and every other export are unchanged.

## Tests

| test | layer | committed reader | amended | mutants that redden it |
|---|---|---|---|---|
| `tempoFromXml.test.ts` Maple Leaf's shape: words 120 then mark 100 with 100, either order, and bar 51's three | unit | **red**: bar 2 plays 120, expected 100 | green | a |
| Satie's shape, the file's own two directions | unit | **red**: `bpm` 60, expected 76.0002 | green | a, e |
| the writers' noise: 79.9998 beside 80, 64.0002 beside half = 32, 100.49999999999999 beside dotted quarter = 67, each after a disagreeing sibling | unit | **red**: 90, expected 79.9998 | green | a, b, e, f |
| 95 is not 100 (120, then 95 with mark 100: keeps 120) | unit guard | green (it pins today's answer) | green | b |
| 100.1 is not 100 (120, then 100.1 with mark 100: keeps 120) | unit guard | green (pins today's answer) | green | b, d |
| the tolerance sits between the noise bound and the nearest different tempo | unit | **red**: the constant is undefined | green | d, e |
| *Hungarian Dance* 5's shape: exact (guard); reordered (the first mark decides); no sound agreeing with the first mark | unit | **red** at the reordered case: 50, expected 40 (the exact shape passed first) | green | a, c |
| no mark: two sounds keep the first (X41's Clair de Lune 70:3) | unit guard | green | green | none of the six (the rule never reaches it) |
| a lone sound against a disagreeing mark (BWV 565, `g-minor-bach.alt`) | unit guard | green | green | none of the six (no sibling); a mark-over-sound mutant would redden it, not run |
| `tempoSoundAgainstMark.test.ts` two sounds at one position: Maple Leaf's shape is no finding | unit | **red**: `[[120, 100]]`, expected `[]` | green | a |
| `tempoSoundAgainstMark.test.ts` the corpus's pinned findings, 12 on 2 rows | unit, data | **red**: three new, `satie @0:0 sound 60 against mark 76`, `maple-leaf @1:0.25 sound 120 against mark 100`, `@51:0` the same | green | a, e |
| `lessonClaimsAboutApp.test.ts` ragtime.7, `'100,100,100'` | unit | **red** with the new string on the committed reader, and **red** with the old `'100,120,120'` on the amended reader | green | a |

The four guards that keep today's answer (95, 100.1, no mark, a lone sound) cannot fail on the committed reader, because they pin its answer. Their discriminating red is the mutants'. The *Hungarian Dance* exact shape is the same kind of guard, and its reordered sibling is the red. Before the fix, `grep -rl "maple-leaf-rag\|satie-gymnopedie" app/tests/` found the three files the brief names, and it finds the same three on the final tree.

## The corpus census (`corpus-diff.txt`, in full)

```
X42 corpus census through the app's reader (toMusicXml + tempoEvents), SERIALIZATION_TOLERANCE = 0.01
rows read: before 2013, after 2013; same ids: True; MuseTrainer and kern rows: 226
positions whose event changed: 3, on 2 rows (of 2013):
  song.classical.satie-gymnopedie-1 (musetrainer) @0:0: before 60 from sound (mark 76); after 76.0002 from sound (mark 76)
  song.ragtime.joplin-maple-leaf-rag (musetrainer) @1:0.25: before 120 from sound (mark 100); after 100 from sound (mark 100)
  song.ragtime.joplin-maple-leaf-rag (musetrainer) @51:0: before 120 from sound (mark 100); after 100 from sound (mark 100)
rows whose played sequence changed (every event's bpm, in order):
  song.classical.satie-gymnopedie-1: before 60,61.9998; after 76.0002,61.9998
  song.ragtime.joplin-maple-leaf-rag: before 100,120,120; after 100,100,100
rows whose opening (the event at 0:0) changed, with the catalogue's tempoBpm:
  song.classical.satie-gymnopedie-1: opening before 60, after 76.0002; catalogue tempoBpm 60.0; catalogue equals opening before True, after False
X40's findings (R = 1.1) on the MuseTrainer and kern rows: before 15 on 4 rows; after 12 on 2 rows
  song.beautiful.g-minor-bach.alt: unchanged, 5 kept
  song.classical.bach-toccata-fugue-bwv565: unchanged, 7 kept
  song.classical.satie-gymnopedie-1: gone ['@0:0 sound 60 against mark 76']; new []; kept 0
  song.ragtime.joplin-maple-leaf-rag: gone ['@1:0.25 sound 120 against mark 100', '@51:0 sound 120 against mark 100']; new []; kept 0
the same findings on every other built row (not pinned anywhere; for the diff only): before 0, after 0, identical True
```

The brief notes that a copy of the reader outside the app predicted the same result. That is corroboration only; this census ran the app's own module.

## The tolerance's evidence (`noise-built.txt`, `noise-pdmx-pool-summary.txt`, `pool-stakes.txt`)

- **Built corpus, every distinct nonzero delta under 5:** 1.4 × 10⁻¹⁴ (2, PDMX), 0.0002 (33, MuseTrainer), 3.0 (6, *La Campanella*). All 33 at 0.0002 fit MuseScore's form, a six-significant-digit quarters-a-second figure × 60 (33 of 33). A grep of every non-integer `<sound tempo>` value in the built corpus found the same shape and nothing else: 45 distinct MuseTrainer values, each either a half (`98.5`) or 0.0002 from an integer (`79.9998`, `70.0002` …). There are 7 PDMX values: halves, and the two float artifacts.
- **The PDMX pool** (the main checkout's `build/pdmx*`, read only; 38,362 files, not the shipped corpus): 60,190 pairs, 46,063 equal, nothing under 0.1. At 0.1 there are 303 pairs, and hundreds at every tenth to 0.9, each a whole number printed beside a sound carrying one decimal (MuseScore 3.6.2 files among them). The rulings count these as different statements, since agreement is XML-number noise, not musical closeness, so the tolerance stays under them. They also show what a wider tolerance would do. Among the pool's 2,021 positions with several sounds and a mark, a tolerance of 1 would differ from 0.01 at 11. At each of those it would take an earlier near sound over an exact one, for example 105 over 106 beside a printed 106 (`pool-stakes.txt`). X40's 1.1 would differ at 36. The amended rule itself would move 142 of the pool's 2,021 positions, most of them a words-only first sound giving way to the printed mark's own sound (a learner's import could meet these; no built score does).
- **The brief's attribution.** The brief names Bella Ciao as the source of 68.1 against 68 and 74.1 against 74. The pool's four such pairs are in four other pieces: *Con mortuis in lingua mortua*, *Inverno nos Ingleses*, *La Valse Triste* and *Les collines d'Anacapri*, all MuseScore 3.6.2 files. The eight pool files titled Bella Ciao write no 68.1 and no 74.1 (`bella-hunt.txt`): four write no tempo, and the others write 200; 120, 145 and 82.5; 95 to 140; 48, 135 and 155; or 80 and 110. The 0.1 floor stands whatever piece carries it; only the attribution was wrong.

## Mutants (`mutants.txt`; the amended file restored byte for byte after each, `restored: True`)

| mutant | what it changes | result |
|---|---|---|
| a | the pre-amendment rule: always the first sound | 9 red. Maple Leaf, Satie, the writers' noise, *Hungarian Dance* (50 for 40), the synthetic finding, the corpus pins, ragtime.7. Also the two CRLF claims below, red on the committed reader too. |
| b | X40's ratio: agrees when within 1.1 | 3 red. 95 for 120, 100.1 for 120, and 70 for 64.0002 (70 is within 1.1 of Lacrimosa's 64). The *Hungarian Dance* guards stay green (see Judgement); the corpus pins stay green. |
| c | `marks[:1]` dropped: a sound agreeing with any mark | 1 red, *Hungarian Dance*'s reordered case (50 for 40) |
| d | the tolerance an order of magnitude too wide (0.1) | 2 red: 100.1 for 120 (100.1 − 100 is 0.0999… in floats, under 0.1), and the tolerance's gap test |
| e | the tolerance under the corpus's noise (0.0001) | 4 red: Satie (60), the writers' noise (90 for 79.9998), the gap test, and the corpus pins (Satie's finding returns) |
| f | agreement judged against the printed per-minute, not quarters | 1 red: half = 32 no longer agrees with 64.0002 (70 plays) |

## Counts and exit codes (`exit-codes.txt`)

- `npx tsc -b --noEmit`: 0. `npm run lint`: 0.
- The four files the brief names (`tempoFromXml`, `tempoSoundAgainstMark`, `scoreModelTempo`, `lessonClaimsAboutApp`): 333 tests, 331 passed, 2 failed, exit 1. Before the change the same four had 324 tests, 322 passed and the same 2 failed. `tempoFromXml.test.ts` went from 14 to 23 tests. The 2 are `blues.3` and `4.7` in `lessonClaimsAboutApp`: they search source text for `"\n"`, and this Windows checkout writes CRLF. `crlf-check.txt` shows each needle found with CRLF and not with LF. Not this lane's; CI checks out LF.
- The full unit suite (`npx vitest run`, the check map's `unit`): 7,477 tests, 7,471 passed, 4 failed, 1 skipped, 1 todo, exit 1. The 4: the two CRLF claims, `midiParity` (no `build/midi-parity` reference in a fresh worktree) and `taughtByAncestry` (no `build/rung-claims.json`). Those two, rerun with the artifacts copied read-only from the main checkout: 110 passed, 4 skipped, exit 0 (`unit-env-rerun.txt`).
- Content: `test_measured_demands.py` (runs the detectors through the app's extraction, so through the amended reader) 8 OK, exit 0. `test_measured_truth.py` 62 OK, exit 0, after copying `build/score-checks.json` (the first run's one error was that file's absence). `validate.py` exit 0. It regenerated six stale views under `docs/prompts/views/` as a side effect; they were written back to their committed bytes.
- Build: `generate-icons`, `tsc -b`, `vite build --outDir app/build/x42/dist` exit 0 (the check map's `build-app`, into a private folder). The committed reader was built the same way into `dist-before` for the probe and the screenshot comparison.
- E2E, the check map's union of 29 specs on port 4642 (`e2e-summary.txt`): 238 passed, 1 skipped, 21 failed, exit 1. Of the 21, 15 are screenshot cells with no `-win32.png` reference in a fresh worktree ("A snapshot doesn't exist … writing actual"). The other 6 (5 microscope, 1 excerpts) had no `app/public/dev` data, a content-build output. The committed build then matched all 15 references the amended build had written (15 passed): the reader change moves no pixel in those cells. The four specs, rerun on the amended build with the dev data copied in: 65 passed, exit 0.
- States (the check map's `states`: `npm run states`' config copied to port 4643, not the shared 4183, which that config reuses): exit 1 on the amended build (`states-summary.txt`). Two cells break: `theme--light` (contrast of `#score-waiting` and `#score-help-more` reported at 4.3:1) and `rotation--bars1-real-phone` (§9.35, music reported at 39 % of the stage). The committed reader's build broke the same two cells with the same readings. Not this lane's; recorded as an observation.
- Census runs: exit 0 twice. Probe runs: 2 passed twice.

## Content (itemised)

No content byte moves. What a learner hears changes at three positions; each is a reading of a file the edition prints.

1. `scores/imported/song.ragtime.joplin-maple-leaf-rag.mxl`, bar 1 a sixteenth in ("Tempo Di Marcia", @1:0.25). Plays **120 → 100**. Reason: the printed quarter = 100 there has its own `<sound tempo="100">`, which agrees and now wins over the words-only 120 (`tempoFromXml.ts`:259–261; `corpus-diff.txt`).
2. The same file, bar 51 ("TRIO", @51:0). Plays **120 → 100**, for the same reason; there the mark and its 100 stand twice.
3. `scores/imported/song.classical.satie-gymnopedie-1.mxl`, the opening (@0:0): the count-in and the first quarter. Plays **60 → 76.0002**. Reason: the printed quarter = ca. 76's direction sounds 60, and the next direction at the same place sounds 76.0002, which agrees with it. From @0:1 the piece plays 61.9998 as before. *Unverified as music.*

## Done

- The contract comment (`tempoFromXml.ts`:30–38) and `resolve` (:228–266), with the exported constant, its derivation in its comment.
- `tempoFromXml.test.ts`: nine cases in one new block.
  - Maple Leaf's shape, both orders.
  - Satie's.
  - The corpus's three noise shapes.
  - The 95 and 100.1 guards.
  - The tolerance's gap.
  - *Hungarian Dance*'s three.
  - No mark.
  - A lone sound.
  - The header names the rule.
- `tempoSoundAgainstMark.test.ts`: the header now says what plays. The three PINNED entries are removed, with 12 on 2 stated in the comment, and the Maple and Satie `why` strings deleted. The synthetic case is now `[]`, "the reader plays 100". R and its justification are untouched.
- `lessonClaimsAboutApp.test.ts` ragtime.7: `'100,100,100'`, the comment rewritten, and the claim's description (it said the app's tempo map does not give the two one tempo).
- `docs/05-score-follow-engine.md` §1 mirrors the contract. `docs/08-test-map.md`: the tempo-map row (:56), and the unit list's `tempoFromXml.test.ts` and `tempoSoundAgainstMark.test.ts` entries (:669, :671).
- The census, the noise scans, six mutants, the probe, and the check map's printed union, except the content build (Not done).

## Not done

- **`content-build` (`python tools/content/build.py --offline`) not run.** The worktree holds none of the fetched clones (`content/scores/imported/` has only `SOURCES.md`), so a build here would not be the corpus. The harness says to copy instead. What the map guards for this file is that a file the reader cannot read is one the build cannot measure, and that is covered in two ways. The census read all 2,013 built files through the amended `tempoEvents` without error. `test_measured_demands.py` ran the detectors through the amended extraction. No measured byte can move: `demands.py`'s `DEFINITION_FILES` does not list `tempoFromXml.ts`, and no detector under `app/src/demands/` reads a tempo (grep).
- A mark-over-sound mutant for the lone-sound guard: not run (the brief names mutants a, b and a tie-break mutant; c is that one).

## Deviations, with reasons

1. **Premise 12 is wrong at the result: X31's opening now agrees with the app for Satie.** `difficulty.opening_quarter_bpm` on Satie's built file returns 76.0002 (`x31-opening.txt`). The app opened at 60 before X42 and opens at 76.0002 now, so X31a's single exception ("2,011 of 2,012 … Satie's dropped `<sound tempo>` remains") closes. Maple Leaf is 100 on both sides, before and after. The count of 2,012 of 2,012 is inferred from the census (only Satie's opening moved), not rerun through X31's full comparison. music21's same-direction drop remains a mechanism; no bundled opening now shows it.
2. **The brief's far-boundary source.** The 0.1 floor exists only in the unbuilt PDMX pool, and in four pieces other than Bella Ciao (see above). The built corpus's nearest non-noise difference is 3.0. The derivation uses both, each named.
3. **The 95 and 100.1 guards could not be red on the unamended file**, because they pin its answer. They ran green there and are reddened by mutants b and d.
4. **Tests beyond the brief's list, each pinning decided behaviour.** *Hungarian Dance*'s reordered case and its no-agreeing-sound case tell `marks[:1]` from "any mark", which the corpus shape cannot. Lacrimosa's half = 32 and PDMX's dotted quarter = 67 pin "after beat-unit normalisation". Mutants e and f.
5. **Two more lines moved with the facts they state.** ragtime.7's description string, inside the owned lines. `docs/08`:669 and :671, the unit list's entries for the two test files: :671 said "15 findings on 4 MuseTrainer rows", and the brief's pointer (:56) missed it.
6. **The check map's union is wider than the brief listed.** `app/src/**` adds 25 e2e specs, the full unit suite, `build-app` and `states`. Everything in it ran except the content build.

## Follow-ups (recorded, not built)

- **X34 (attach to the existing row):** Satie's catalogue `tempoBpm` is 60 and now differs from the reader's opening, 76.0002. The source is `tools/content/import_musetrainer.py`:130–132, `measure_facts`, which takes the first `<sound tempo>` in the raw text by regex. Maple Leaf's stays equal (100 = 100). No importer byte changed.
- **X31a / X38:** the Satie gap's outcome closed (Deviation 1). The rows' "2,011 of 2,012" wants updating at the next splice.
- **Observations, not rows:** `validate.py` rewrites `docs/prompts/views/` as a side effect, and at `36be5a50` six views were stale by 13 lines. Two `lessonClaimsAboutApp` claims fail in any CRLF checkout. `validate.py`'s side effect and the CRLF claims are process-level. In this checkout the state gallery breaks two cells on both builds, the committed reader's and the amended one's (`theme--light` contrast; `rotation--bars1-real-phone` §9.35); whether CI's runner reproduces them was not checked. The pool's 0.1–0.9 pattern (a printed whole number beside a decimal sound) touches imports only, and under the rulings those do not agree.

## Questions for the reviewer

1. **ragtime.7.** The lesson likens Sugar Cane to Maple Leaf at no pace, because the catalogue and the app's tempo map disagreed on Maple Leaf. Both now give the two one tempo, 100, at every position they state. Should the sentence now make a pace comparison? This lane rewrote only the test's comment; the lesson is untouched.

## Files

- `app/src/score/tempoFromXml.ts`
- `app/tests/unit/tempoFromXml.test.ts`
- `app/tests/unit/tempoSoundAgainstMark.test.ts`
- `app/tests/unit/lessonClaimsAboutApp.test.ts`
- `docs/05-score-follow-engine.md`
- `docs/08-test-map.md`
- `docs/prompts/runs/X42/`, machine paths as `<worktree>` and `<home>`, every file under 40 KB:
  - `ENTRY.md`, this entry.
  - Evidence: `corpus-diff.txt`, `noise-built.txt`, `noise-pdmx-pool-summary.txt` (the 1.2 MB full scan was not kept), `pool-stakes.txt`, `bella-hunt.txt`, `x31-opening.txt`, `probe.txt`.
  - Runs: `mutants.txt`, `red-committed.txt`, `red-ragtime7-old-string-amended-reader.txt`, `green.txt`, `baseline-committed.txt`, `unit-all-summary.txt`, `unit-env-rerun.txt`, `crlf-check.txt`, `content-tests.txt`, `e2e-summary.txt`, `states-summary.txt`, `exit-codes.txt`. The full unit, e2e and states logs were not kept.
  - Scripts:
    - `scripts-census.table.ts` and `scripts-vitest.census.config.mts`, the census through the app's reader.
    - `scripts-noise_scan.py`, `scripts-diff.py`, `scripts-pool_summary.py`, `scripts-pool_stakes.py`, `scripts-bella_hunt.py`, `scripts-titles.py`, `scripts-x31_opening.py`, `scripts-crlf_check.py`, `scripts-mutants.py`, `scripts-summaries.py`, `scripts-keep.py`.
    - `scripts-tempo-probe.spec.ts`.
    - `scripts-playwright.x42.config.ts` (port 4642), `scripts-playwright.x42.states.config.ts` (port 4643), `scripts-playwright.x42.probe.config.ts`.

## Post-action gate

- **Read back.** The census diff, the probe's numbers and each mutant's red line were read back from their files.
- **Intent.** Maple Leaf plays its printed 100, and Satie's marked opening takes its agreeing sound. The problem is solved at the mechanism, not by a per-piece fix.
- **Rulings.** None is overridden. Mark over sound and last sound stay rejected, Satie's body is untouched, X41 is untouched, and R = 1.1 stays X40's.
- **Side effects.** Two, outside the reader, both recorded: Satie's catalogue figure now disagrees with its opening (X34), and X31's figure now agrees with it (X31a).
- **New work.** Attached to X34 and X31a, or left as observations.
- **Verification.** VERIFIED: the census, the unit red and green lines, the mutants, the probe's model numbers, the screenshot parity. NOT YET VERIFIED: any sound, and the X31a 2,012-of-2,012 count through X31's own comparison. HYPOTHESIS: none carried.

**Orchestrator's note at the landing (2026-09-30).** X42's worktree committed by name (36b9ac3d) and merged (7474f926). The chain on the merged main checkout: the map's test and its minimum for the merged files (`runs/X42/map-min.txt`), typecheck, lint, the whole unit suite, the app build, the spec names checked, then the specs the map's minimum names on the default port (map-tests 0; map-min 0; tsc 0; lint 0; vitest-all 1; build-app 0; specs-exist 0; e2e-targeted 0 — the unit suite's two recorded line-ending assertions in `lessonClaimsAboutApp` (Entry 101's diagnosis) fail here and pass on the runner; `runs/X42/orchestrator-exit.txt`). The reviewer's first approval with one required change (`responses/questions-fc9f1a8b.md` §X42: APPROVE WITH ONE REQUIRED CHANGE — *the reader-rule shape is right: at one position, a competing sound that actually agrees with the first co-located numeric mark may beat a conflicting sibling sound; global mark-over-sound and last-sound rules remain rejected*; Maple Leaf's two positions and Satie's marked opening *the right real discriminators*, Brahms HD5 *the right multi-mark ordering guard*; the required change — do not use `R = 1.1` as the semantic definition of *agrees*, since it is X40's evidence-scan threshold, permitting values *almost 10% apart to count as 'agreeing'*, *not the reader contract we ruled*; define agreement at MusicXML numeric-noise scale instead, with a synthetic guard that would fail under the old `R = 1.1` reuse and the corpus census re-run to require that only Maple Leaf's two positions and Satie's opening move), corrected on the tolerance's own shape (`responses/questions-fc9f1a8b-correction.md` §X42: the required change stands, `R = 1.1` *was X40's anomaly/reporting threshold, not the semantic definition of two tempo statements agreeing*; one refinement — do not turn the reviewer's own illustrative `0.001` *into another unexplained product constant*, the contract instead *serialization-equivalent after beat-unit normalization*, the numeric tolerance derived from the corpus's own writer/parser noise and pinned in tests: Satie's `76.0002` agreeing with 76, `79.9998` against 80 remaining representation-equivalent, and a genuinely different nearby value such as 95 against 100 not agreeing merely by X40's ratio; the builder to report the chosen machine tolerance and the maximum observed serialization delta that justifies it, *orders of magnitude below a musically meaningful tempo difference*; the real behaviour change to remain Maple Leaf's two positions and Satie's opening, Brahms HD5, X34 and X41's boundaries standing; *remains APPROVE WITH ONE REQUIRED CHANGE*), confirmed by the second read (`second-reads/e71ef3ad.md` item 4: AGREE, with a note — the parser's exactness for a whole-number per-minute traced through `quartersPerMinute`'s own normalisation; a copied corpus scan of 2,439 sound/mark positions at 2,322 exact, finding the same three noise shapes and nothing below 0.1 besides the writers' figures; the 0.0002 traced to MuseScore's five-decimal beats-per-second encoding, bounding the error at 0.0003, *a 500× gap below the smallest real difference*; the 95-vs-100 guard falling on the right side, with the note that the guard alone *does not pin the boundary* and a 79.9998-against-80 case should sit beside Satie's to pin it from both sides; the reviewer's own copied census agreeing with the builder's at both 0.001 and R = 1.1, *the builder's census through the app's own reader is the one that counts*).. Landed: at one position, the sound serialization-equivalent to the first mark (`SERIALIZATION_TOLERANCE` = 0.01 quarter-notes a minute, the corpus' largest noise 0.0002) wins over a disagreeing sibling; the census through the app's own reader moved exactly Maple Leaf's two positions (120 → 100) and Satie's opening (60 → 76.0002) of 2,013 built scores; Satie's opening beat at 76 into a body near 62 is *unverified as music*; the chain's unit reds are the known CRLF pair; the map's specs green.

## Doc rows

- `docs/08-test-map.md` :56, the tempo-map row, and :669 and :671, the unit list: done in this change, as quoted in the diff.
- `docs/05-score-follow-engine.md` §1 step 5: done in this change.
- `docs/prompts/backlog-2026-09-25.md`, row X42: the decision text says "within R = 1.1 of the position's first mark". It should read "serialization-equivalent to the position's first mark (`SERIALIZATION_TOLERANCE` = 0.01, derived from the corpus: largest noise 0.0002, nearest non-noise difference 0.1)". Status: built (X42, Entry 185); three positions moved of 2,013 built scores; X40's findings 15 on 4 → 12 on 2.
- Same file, row X34: attach "X42 (Entry 185): Satie's catalogue `tempoBpm` 60 (`import_musetrainer.py`:130–132) now differs from the reader's opening 76.0002; Maple Leaf's stays equal".
- Same file, rows X31 and X38 (the X31a build line): "the corpus agrees on 2,011 of 2,012 scores (Satie's dropped `<sound tempo>` remains)" becomes "… 2,012 of 2,012 since X42 (Entry 185): the app now opens Satie at 76.0002, which `opening_quarter_bpm` also returns (count inferred from X42's census)".
- Same file, row X41: unchanged. Clair de Lune's 70:3 has no mark, and the rule does not reach it (pinned).

## Content

What a learner meets differently: *Maple Leaf Rag* plays at 100 throughout, where it jumped to 120 a sixteenth into bar 1 and again at the trio. That corrects it to the file's printed quarter = 100, corroborated by the kern edition; the first edition prints no number. Satie's first *Gymnopédie* counts in and plays its first beat at 76, where it counted in at 60, then continues near 62 as before, *unverified as music*.
