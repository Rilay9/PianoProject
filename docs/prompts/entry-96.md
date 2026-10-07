### Entry 96 — E0b: a demand is taught at every rung whose lesson teaches it, one per path — `taughtAt` is a list, derived from the lessons' concepts under E0a's ancestry and held to them by the validator; the walking bass is `blues.5`'s, `jazz.6`'s and `jam.6`'s, so a learner through `jazz.6` meets it at `jazz.8` again, and `theory.9` and the sibling tracks still do not (2026-09-27)

**Judgement.** Read from the predicate's answers on the shipped curriculum, row 7's generator options at `jazz.8` and `theory.9`, the promise suite's forty phrases per rung through the detectors, a swap-sheet probe of the nine rungs whose reading moves (committed vocabulary against E0b's, the same predicate), the three learners' thirty mornings, and the regenerated report. Nothing played, heard or looked at on a screen.

- **The walking bass at `jazz.8` for a learner through `jazz.6`.** Before: not taught — `taughtAt` named `blues.5` alone and `jazz.8`'s path (`jazz.7`, `jazz.6`, `jazz.5`, `chords-pop.5` …) never reaches it; row 7 opened from `jazz.8` was held to a broken-chord left hand, "a walking bass in 0 of 40 phrases", and row 7 was refused on every `jazz.8` swap sheet. After: taught at `jazz.6`, `jazz.7`, `jazz.8`, `jazz.9` by the rung's own path (no learner history needed); row 7 at `jazz.8` writes its walking bass in 40 of 40 phrases (the promise check, every seed), and every `jazz.8` option's swap sheet offers row 7 again (`probe-compared.txt`).
- **At `theory.9`.** Before and after: not taught; row 7's options there are held to a broken-chord left hand in both; `PROMISED_OFF_THE_PATH` keeps `theory.9` and the promise test still asserts it untaught and absent. `classical.6` and `chords-pop.6` are untaught before and after (a learner who reached `jazz.6` carries it anywhere, E0a's reached reading).
- **As a teacher reads it.** `jazz.6`'s lesson teaches the walking line and assigns it; `jam.6`'s is titled "Walking bass, when there is no bass player" and defines success as twelve bars of it. Both are now credited. `latin` names walking-bass among its concepts and its lesson never teaches one (its bass is the tumbao): left off, and the build warns. Unverified as music: nothing was heard, and the E22 caution stands (the detector does not read most generated walking-bass exercises as walks, so `jazz.6` and `jam.6` teach a demand none of their options establishes: `inventory.md`, 0 of 13 and 0 of 5).

**Every demand whose teaching rungs changed, and why** (the derivation, `claims.teaching_rungs`: rungs whose concepts name the demand, none of which stands on another's path; each read against its lesson):

| Demand | Before | After | Why |
| --- | --- | --- | --- |
| `texture.walking-bass` | `blues.5` | `blues.5`, `jazz.6`, `jam.6` | a second and third track teach it: `jazz.6` (the four-note line with a semitone approach, hands separately then under shells) and `jam.6` (the whole lesson). The derivation also gives `latin`; its lesson does not teach one — the brief's deviation clause, per demand: not listed, warned |
| `rhythm.syncopation` | `4.5` | `4.5`, `latin.3` | a second track: `latin.3`'s path leaves the core at 2.5, and its lesson teaches the clave, a syncopated two-bar rhythm clapped and then played over a pulse ("one hand syncopated against one hand that is not"). Its own four clave exercises and its tresillo were recorded as carrying syncopation untaught at the rung that teaches the clave |
| `key.signature` | `3.1` | `3.1`, `theory.3` | a second track: `theory.3`'s path leaves the core at 2.5; its lesson teaches key signatures to three sharps and flats and asks for one named without pausing |
| `texture.hands-together` | `2.1` | `2.1`, `holiday` | a second track: `holiday` is a Stage 2 rung whose path leaves the core at 1.5; its lesson teaches a carol hands together over held C, F and G chords |

Unchanged, with the derivation agreeing: the other fifteen. Three are hand readings the derivation cannot give (no listed rung's concepts name them), kept as they were with a note naming the rung and warned on every build until F reads the lesson: `interval.step` at 1.1, `interval.leap` at 1.5, `pitch.chromatic` at 3.1. No first-in-file rung turned out not to be first on its path. `rhythm.sixteenths` is `[]`.

## The mechanism

The vocabulary could say one rung per demand, chosen as "the first rung whose concepts name it" — first in the file, the order E0a stopped reading as the path. So where two tracks teach a demand, the second was invisible, and after E0a (which reads the path) the jazz track's own teaching counted for nothing.

- **The shape** (`demands.schema.json`): `taughtAt` is an array of rung ids, unique, `[]` requiring `taughtAtNote`. A string or `null` is refused.
- **The rule** (`validate.taught_at_findings`, called by `vocabulary_errors`; warnings printed by `main`): every listed rung exists; no listed rung is on another listed rung's path (`claims.rung_ancestry`: one teaching rung per path); each listed rung's concepts name the demand (`claims.concepts_naming`: `CONCEPT_DEMANDS`, and a skill whose opportunity is that demand alone; a skill coping with several demands names none) — else an error, unless `taughtAtNote` names the rung, which is a hand reading and a warning; and a warning for every rung the derivation gives with no listed rung on its path.
- **Every reader** reads the list, and a demand is taught when any listed rung is in the rung's ancestry or the learner's reached set: `session.taughtAtRung`; the strand's edges (the repertoire claim); the reader's no-rung fallback and its "newest thing added" order (the listed rung on the rung's path); `eligibility.targetDemandsFor` (the demand tier); `claims.rung_claims_of`, `untaught_on`, the generated rows' `taughtAt` column and the inventory's coverage; the TypeScript type (`readonly string[]`). No reader names a demand; no generator is touched.
- **The test-side copies of the flat reading** (`generatorContract`, `composedContract`, `firstThirtyDays`, `readerMovesTheDemand`, `lessonClaimsAboutApp`) read `taughtAtRung` now: with `latin.3` listed, the file's order would credit 4.1–4.4 (stored after `latin.3`) with syncopation. `scoreSummaryTruth`'s constructed two-rung line keeps its own order reading, over the list.

**Discriminating tests.** `jazz.6` against `blues.5`'s ancestry (not in it) tells "taught on its own path" from "taught through the blues"; `blues.5` with `blues.6` listed tells one-per-path from any list; `classical.6`, `chords-pop.6` and `theory.9` tell "any listed rung on the path" from "any listed rung anywhere"; `latin`'s warning tells a derivation the validator enforces from one it only records.

## The red lines

- **`red-test-taught-at.txt`** — `test_taught_at.py` on the committed vocabulary and validator: 14 of 15 red (11 failures, 3 errors), e.g. `'blues.5' != ['blues.5', 'jazz.6', 'jam.6']`; `texture.walking-bass taught at the string 'blues.5': the schema must require a list; got []`; `texture.walking-bass at blues.5 and blues.6 …: one teaching rung per path; got ["… ['blues.5', 'blues.6'] is not of type 'string', 'null'"]`; `untaught_on` at `jazz.6` `['texture.walking-bass'] != []`; `module 'validate' has no attribute 'taught_at_findings'`. Green by design: `theory.9`, `classical.6`, `chords-pop.6`, `jazz.5`, `latin` untaught.
- **`red-taught-by-ancestry.txt`**, **`red-taught-by-ancestry-final.txt`** — `taughtByAncestry.test.ts` and `vocabulary.test.ts` on the committed predicate and data (the committed `session.ts`, `eligibility.ts`, `vocabulary.ts` and `demands.json` swapped in, then back; `scripts/swap_committed.py`): 11 of 21 and 19 of 19 red. `texture.walking-bass at jazz.6: jazz.6 teaches it, on jazz.6’s path: expected false to be true`; `row 7 opened from jazz.8: texture.walking-bass held out though jazz.6 taught it`; `texture.walking-bass is among what jazz.6 teaches: expected [] to deeply equal [ 'texture.walking-bass' ]`; `the repertoire claim for a learner placed at jazz.6, which teaches texture.walking-bass: expected undefined to match object { kind: 'ready', …(1) }`; the four E0a cases whose constructed vocabulary is now a list; 19 × `<demand>: taughtAt is a list: expected false to be true`. Green by design: `theory.9`, `classical.6`, `chords-pop.6` by adjacency.
- **`red-sight-reading-promises.txt`** — the revised promise test on the committed data: `drill.reading.sight-reading-7 (jazz.8, theory.9) at jazz.8: a walking bass in 0 of 40 phrases: expected +0 to be 40`; the other nine reds are the shape (`rung 1 is not in the curriculum`: a committed string read as a list).
- **`red-claims-committed.txt`** — `test_measured_truth.py`'s new case on the committed `claims.py`: `['texture.walking-bass'] != [] : texture.walking-bass on jazz.8: jazz.6 teaches it, on jazz.8's path`; `test_measured_demands.py`'s new record check: `TypeError: 'NoneType' object is not iterable` (the committed `null`).
- **`red-record-against-new-vocabulary.txt`** — the record check with E0b's vocabulary against the committed record: five combinations a teaching rung covers, `clave on latin.3: rhythm.syncopation, taught at latin.3 on its path`, `stride on jazz.7: texture.walking-bass, taught at jazz.6 on its path`, …

## What moves

- **Taught at the rung alone** (`taught-moves.txt`): 9 (rung, demand) readings, every one untaught → taught — the walking bass at `jazz.6`–`jazz.9`, `jam.6`, `jam.7`; syncopation at `latin.3`; key signatures at `theory.3`; hands together at `holiday`. A learner's reached rungs add to these as before (a learner who reached `latin.3` has syncopation at 4.1).
- **The swap sheets** (`probe-compared.txt`, no stored runs, judged at the rung): `jazz.8` — every option's sheet gains row 7; `jazz.7`, `jazz.9` — every sheet gains the rung's own stride exercise (its left hand is read as a walk, E22, and was refused while the walk was untaught); `latin.3` — the clave exercises are offered as each other's alternatives and *Cielito Lindo*'s sheet gets the rung's clave exercises instead of the last resort's songs by kind; `holiday` — the hands-together exercise and the hands-together *Jingle Bells*; `latin`, for a learner through `jazz.6`, the walking bass over ii–V–I. `jam.6`, `jam.7`, `theory.3`, `jazz.6`: unchanged (no option there measures the demand).
- **The report** (`report-compared.txt`): checkable claims 576 → 592 and not established 349 → 356 (the new `taughtAt` claims at `latin.3` and `holiday`: 7 of 8 and 2 of 8 options establish them); kept by no option 9 → 9; notated options with an untaught demand 253 → 252 (*Jingle Bells, hands together* on `holiday`; *Guantanamera* and *Só Danço Samba* on `latin.3` lose syncopation). Generated combinations 129 → 124, five leaving the record and none joining: `clave` ×4 and `tresillo` ×1 on `latin.3` (syncopation), `coordination` ×1 on `holiday` (hands together), `stride` ×1 each on `jazz.7` and `jazz.9` (the misread walk). The ancestry is identical. The "Taught at" column shows the list (`nowhere` for `[]`).
- **The three learners' mornings: none changed** — ninety mornings byte-identical before and after (`diaries-before/`, `diaries-after/`; before is byte-identical to E0a's final diaries): all three walk the core path, where no demand's list changed.

## Tests touched

| Test | Class | Old assumption | Now |
| --- | --- | --- | --- |
| `tools/content/tests/test_taught_at.py` | add | — | the shape (string, `null`, `[]` with a note), one rung per path, a missing rung, the concept check and the hand reading, `jazz.6` left off warned, the committed lists' four warnings, the derivation, `untaught_on` at the jazz and jam rungs, `theory.9`, the siblings |
| `test_measured_truth.py` › `test_a_demand_taught_on_two_paths_is_taught_on_both_and_on_neither_sibling` | add | — | a walking-bass option taught on `jazz.8`, untaught on `theory.9` and `classical.6`; the inventory's `jazz.6` teaches it |
| `test_measured_demands.py` › `test_no_recorded_combination_has_a_teaching_rung_on_its_path` | add | — | the record against the vocabulary's lists, without the bridge run |
| `fixtures/untaught_on_rung.json` | revise | one `taughtAt` rung per row; 129 combinations | the list; 124, rewritten by the report's functions (round-trip byte-identical before writing; the diff is every row's `taughtAt` line becoming a list plus five rows gone) |
| `app/tests/unit/taughtByAncestry.test.ts` | add + revise | `jazz.6` does not teach the walking bass (E0a's brief item 3); `taughtAt: 'A.5'` | seven E0b cases (two listed rungs on sibling tracks; (a); (b); (c); the demand tier on `jazz.6`; the repertoire claim for a learner placed at the shipped `jazz.6` and on the constructed B.6); `jazz.6` left the E0a case; the constructed vocabulary is a list |
| `sightReadingPromises.test.ts` | revise | the walking bass is `blues.5`'s alone, so `jazz.8` is off the path | `PROMISED_OFF_THE_PATH` keeps `theory.9`; the rung check reads each listed rung |
| `helpers/promises.ts` `untaughtChecks` | revise | one rung or `null` | the list; `[]` taught nowhere; the order fallback needs every listed rung later |
| `vocabulary.test.ts` | revise | one rung or `null` | a list of rungs the curriculum has, or `[]` with a note |
| `generatorContract`, `composedContract`, `firstThirtyDays`, `readerMovesTheDemand`, `lessonClaimsAboutApp` | revise | one `taughtAt` rung in the file's order (right on the core path while nothing on a track was listed) | `taughtAtRung`; `composedContract`'s taught order reads the listed rung on the core path; the promise checks get the rung's own predicate |
| `scoreSummaryTruth`, `recommendRespondsToEvidence`, `firstThirtyDays` (the claim), `alternativesShareASkill`, `fallbackOrder`, `slotsFromEvidence` | revise | one rung | the list (`some`, `toContain`, `includes`, `['E']`, `['R']`) |
| `eligibility.test.ts`, `gateAtTheConsumers.test.ts`, every other | preserve | — | green |

## Checks (unpiped; exit codes read; `runs/`)

| Run | Exit | What it said |
| --- | --- | --- |
| `npm ci` (app) | 0 | — |
| `python tools/midi-cleanup/tests/parity_reference.py` | 0 | — |
| `python tools/content/build.py --offline`, committed tree | 0 | 2,061 items; the reports' content identical to the committed ones (line endings apart) |
| the same, E0b (`build-e0b.txt`) | 0 | 2,061 items, demands measured on the same 1,982 (the fingerprint includes `demands.json`, so every file was measured again: the same counts); "592 checkable claims … 356 not established, 9 kept by no option"; D0's record then stale (129 held, 124 found) |
| `scripts/write_record.py`, then the build's `step_reports` alone | 0, 0 | 129 → 124 combinations, five leaving (`record-moves.txt`); the report "124 (D0's record holds 124; the same)" |
| the build again, final tree (`build-e0b-final.txt`) | 0 | the same counts; the committed markdown unchanged by it |
| `python tools/content/validate.py` | 0 | "content validation OK"; four `WARNING (taught at, E0b)` lines: 1.1's steps, 1.5's leap, 3.1's accidentals (hand readings), and `latin` (walking-bass named, no rung on its path listed) |
| `python -m unittest` `test_taught_at`, `test_measured_truth`, `test_measured_demands`, `test_evidence_gate`, `test_vocabulary_dimension` | 0 | 70 tests OK (the rung check through the bridge against the rewritten record among them) |
| `python -m unittest discover -s tools/content/tests -t tools/content` | 0 | 1,104 tests OK, 4 skipped |
| `npx tsc -b` | 0 | — |
| `npm run lint` | 0 | — |
| `npx vitest run` the named files (`taughtByAncestry`, `sightReadingPromises`, `vocabulary`, `eligibility`, `gateAtTheConsumers`, and the four small revisions) | 0 | 21 in `taughtByAncestry`; row 7 at `jazz.8` "a walking bass" in every phrase of the forty; `theory.9` still named off the path |
| `npx vitest run` (full, before the last `taughtByAncestry` case) | 1 | 265 files, 6,383 tests: 5 failed. `lessonClaimsAboutApp` › blues.3 and › 4.7, the CRLF-checkout reds E0 and E0a recorded (a literal LF matched against a CRLF file; not E0b's); three 5-second timeouts (`competenceSurvivesPruning` ×2, `legacyStorage` ×1) that pass alone (`vitest-rerun-three.txt`) and did not recur in the final run |
| `npx vitest run` (full, final tree) | 1 | 265 files, 6,384 tests: 2 failed (the same two CRLF reds), 6,377 passed, 5 skipped |
| the diaries (`C4C_DIARY`, `C6_DIARY`), committed code and E0b | 0, 0 | 25 passed each; the five files byte-identical, and identical to E0a's final diaries |
| the swap-sheet probe (`scripts/probe/zzProbeE0b.test.ts`, copied in, run, removed) | 0 | `probe-compared.txt` |

The content build's setup as E0a's: the main checkout's `kern` and `musetrainer` libraries (without version control), `build/cache/convert` and `build/demands-cache.json` copied in (`scripts/copy_imports.py`); `SOURCES.md` restored after each build (`scripts/restore_sources.py`); `git status` lists neither.

## Unverified, beside what passes

1. **Nothing heard, no screen looked at.** Row 7 at `jazz.8` writing a walk is read from the generator's options and the detector over forty phrases; the swap sheets are computed.
2. **Whether `latin.3`, `theory.3` and `holiday` teach their demands in the gate's sense** is my reading of three lessons (each names the demand in its concepts and teaches it by name); `theory.3` teaches naming a key from its signature, which is less than reading every F sharp in a tune. F reads them.
3. **The walking bass the lessons teach is not what the detector reads** on most generated walking-bass exercises (E22): `jazz.6` and `jam.6` teach a demand none of their options establishes, and the stride exercise's misread walk now reads as taught at `jazz.7` and `jazz.9`.
4. **`latin`'s walking-bass concept** is a concept named in passing by my reading: warned, not listed; its option `exercise.walking-bass.c.ii-v-i` stays untaught there (the record keeps it).

## Not done

- Nothing the brief decided. Its item 6 (theory.9's sentence and row, L109's readers, the ancestry, the generators) is untouched, as it says.

## Follow-ups

- **P2, curriculum (F):** `latin` names walking-bass and does not teach it; `theory.9` promises a walking bass its path never teaches (unchanged, finding 3); 1.1's steps, 1.5's leap and 3.1's accidentals are taught by lessons whose concepts do not say so — each warned on every build.
- **P2, detectors (E22):** the walking bass is taught on three paths and established by none of `jazz.6`'s or `jam.6`'s options.
- **P3, record wording:** `tools/content/family_contracts.json`'s Hanon admission says "taughtAt null"; it is `[]` now. Not in E0b's files.
- **P3:** the file-order readers L109 names are unchanged.

## Questions

None.

## Files

In the worktree (`C:\Users\yalir\repos\Piano Stuff\PianoProject\.claude\worktrees\agent-a3a3a98c4faa11c9f`), nothing committed, nothing added to the index:

- **New:** `tools/content/tests/test_taught_at.py`.
- **Changed:** `content/curriculum/vocabulary/demands.json` (spliced as text), `demands.schema.json`; `tools/content/validate.py`, `claims.py`; `tools/content/tests/test_measured_truth.py`, `test_measured_demands.py`, `fixtures/untaught_on_rung.json`; `app/src/demands/vocabulary.ts`, `app/src/curriculum/session.ts`, `eligibility.ts`; `app/tests/unit/taughtByAncestry.test.ts`, `sightReadingPromises.test.ts`, `helpers/promises.ts`, `vocabulary.test.ts`, `generatorContract.test.ts`, `composedContract.test.ts`, `firstThirtyDays.test.ts`, `readerMovesTheDemand.test.ts`, `lessonClaimsAboutApp.test.ts`, `scoreSummaryTruth.test.ts`, `recommendRespondsToEvidence.test.ts`, `alternativesShareASkill.test.ts`, `fallbackOrder.test.ts`, `slotsFromEvidence.test.ts`; `docs/02-curriculum.md` (E2's sentence, one clause; the vocabulary section's shape, three phrases), `docs/08-test-map.md` (the E0b row, file lines); `docs/prompts/rung-claims.md` and `docs/prompts/inventory.md` (regenerated).
- **Outside the brief's list, and why:** `alternativesShareASkill`, `fallbackOrder`, `slotsFromEvidence`, `recommendRespondsToEvidence` (read or construct `taughtAt`; the type change reaches them); `docs/prompts/inventory.md` (the build writes it with the report, and `test_measured_truth` holds it to the catalogue: `holiday`, `latin.3`, `theory.3`, `jazz.6`, `jam.6` now teach their demands).

Beside this entry (`…\scratchpad\E0b\`): the red lines (`red-*.txt`), `runs/`, `diaries-before/`, `diaries-after/`, `taught-moves.txt`, `probe-compared.txt`, `report-compared.txt`, `record-moves.txt`, `head/` (the committed vocabulary and the committed build's reports), `scripts/` (the splice, the record writer, the probes and comparisons, the copy and restore scripts).
