### Entry 105 — E1a: the one teaching-use admission covers excerpts — `unapprovedMusic`, the private reading behind the exported `admittedForTeaching` and `eligibleFor`, returns an excerpt's stored bit as it returns a music-promising generated item's, so an excerpt reaches no automatic offer (the gate's four wants, the card's rows, the swap sheet's tiers and last resort) until `provenance.review.teaching === true` on its cut's current identity; a `yes` on an earlier cut of the same definition admits nothing, because the build fills the bit only from a decision on the cut file's current sha256; the Library and exploration stay open; E1's rule that an unplaced excerpt is in no whole-catalogue tier stays and stops being the only guard (2026-09-28)

**Judgement.** Nothing a learner sees changes today, and nothing was heard or decided. The five excerpts are on no rung, and before this change none reached an automatic offer: on the committed code, with the sweeps' oracle extended to excerpts, no tier of any rung's swap sheet offered one to a learner who copes with everything, and no card row offered one to a fresh learner at any rung, every track on, at 15, 30, 60 and 120 minutes. Both sweeps were green before and after (`red/red-app-committed-code.txt`, `runs/vitest-three-final.txt`). What changes is what the contract guarantees for an excerpt a rung lists:

- **Before, on the committed code, a rung listing an excerpt offered it at once.** I placed each built excerpt as the one song of the first rung that teaches what it was cut for. A fresh learner on the core path and that rung's track got the cut as the card's new row on four of the five placements (`runs/probe-placed-committed-code.txt`):
  - Wabash Blues 1–4 at 3.1: "This lesson asks for it — not counted yet".
  - Anh. 113 25–32 at 3.1: "This lesson asks for it — not counted yet".
  - I Got Rhythm 15–18 at `blues.5`: "Blues & boogie asks for it — not counted yet".
  - Hark! 25–28 at `latin.3`: "Latin asks for it — not counted yet".
  - Ode to Joy 9–12 at 3.6 asks for exercises only, so no row took it.
  - The swap sheet's lesson tier offered the cut for the rung's other options.
  - Nobody had approved any of them for teaching use: the reviewer's finding, reproduced.
- **After, the same placements.** No card row and no swap-sheet tier offers any of the five while undecided (`runs/probe-placed-after.txt` and the built-catalogue case). The rung's songs ask stays unmet, and the card fills the row from what the slot's rules already admit. At 3.1 that is a second exercise under the rung's exercises ask, "This lesson asks for it — not counted yet". That claim is true, because the exercises ask is unmet too. At `blues.5` it is the rung's left-hand patterns drill. With a `yes` constructed on each cut, the lesson tier offers each cut again, and the card's songs ask takes it.
- **The Library and exploration are untouched.** The Library's excerpt filter lists exactly the five built excerpts, each undecided. The opener opens each as a score. `eligibleFor(…, { for: 'exploration' })` passes at every bit. `LibraryScreen.ts` and `openItem.ts` ask neither the gate nor the admission. By the reviewer's constraint the detail sheet says nothing of the bit; no Library screen was changed.
- **As music: unverified**, and not in question here. No excerpt is judged, placed or decided by this seam.

Four things the reviewer should hear first:

- **One line of logic.** `if (provenance?.facts.promise?.value !== 'music' && !isExcerpt(item)) return undefined;`, then the stored bit: `true` admits; `false` stays `false`; anything else (`null`, or no provenance at all) is `null`. `admittedForTeaching` is unchanged, `unapprovedMusic(item) === undefined`, and its signature and meaning for every other kind are as D3b left them. D3c reads it by name, and no consumer changed.
  - **The name is kept.** Both kinds it now covers are music whose teaching suitability rests on a person's decision. Renaming would move the docs and records that cite it and help no reader.
  - **Missing provenance.** A malformed row with no `review.teaching` at all now reads as undecided (refused) for a music-promising generated item too, where the old expression would have returned `undefined` (admitted). The types forbid that row, and the build never writes one (`test_review_record` holds every built item's bits to the record).
- **The Q8 case is revised, as required.** Its old assumption was "the excerpt is eligible at `classical.3`". It now says "refused until approved, eligible once approved": the built cut refused for the equivalent and the key-signature demand with `teaching: null`, then eligible for both on the same row with `teaching: true` set (constructed; no excerpt has a decision).
- **E1's reader cases were revised to an excerpt with a `yes`, and the mutant shows why.** Once the admission refuses an undecided excerpt, E1's cases would pass for two reasons, and one reason would hide the other. With E1's whole-catalogue skip removed from `selectors.ts`:
  - HEAD's version of `excerptItems.test.ts` stays green: the mutant survives, masked.
  - The revised cases go red: 2 red.
- **Staleness is proved on both halves of D2's resolution.**
  - Build: `TestAStaleDecisionOnAnOlderCutAdmitsNothing` makes two real cuts of one definition from a parent whose file changed. Over the older cut, a `yes` on the older cut's sha256 is current (bit `true`, fact written). Over the rebuilt cut it is stale: bit `null`, no reviewed fact.
  - App: the E1a staleness case resolves a `yes` on an older sha256 through `review/record.ts` against the built cut's current sha256. The event is `stale`, the bit `null`, `admittedForTeaching` false and the verdict `teaching-use-not-approved`. The same `yes` on the current sha256 is `current` and admits the cut.
  - The build case is green on the committed tree by design (D2's mechanism exists). Its red line is the mutant that matches a file identity whatever its bytes: 1 red in `review.py`, 1 red in `record.ts`.

## The predicate: what each kind of item needs to be admitted to an automatic offer

`admittedForTeaching(item)`, and the teaching-use check in `eligibleFor` for the `skill`, `requirement`, `demand` and `equivalent` wants. Admission is necessary, never sufficient: the gate's two questions (can the learner cope, is the opportunity established) and each consumer's own rules still apply. `exploration` is exempt, and the Library never asks.

| Kind of item | Needs, to be admitted | Identity the bit is filled against | Since |
| --- | --- | --- | --- |
| A drill (a generated family whose promise for the recipe is `drill`, or an authored or runtime drill) | nothing: its promise is its contract; admitted whatever its bit | — | D3a (unchanged) |
| A music-promising generated item (promise `music`: the studies, grooves, the 12/8 blues) | `provenance.review.teaching === true`; `null` (undecided) or `false` (a `no` or `fix`) refused as `teaching-use-not-approved` with the bit kept | the generator triple, recipe and tempo | D3a (gate), D3b (card) |
| A notated song (PDMX, kern, MuseTrainer, authored) | nothing: its notes are its truth; admitted whatever its bit | — | D3a (unchanged) |
| A runtime reading row (a drill made when it opens, no file, no promise fact) | nothing | — | D3a (unchanged) |
| An excerpt (`type: 'excerpt'`) | `provenance.review.teaching === true`; `null`, `false` or no provenance refused as `teaching-use-not-approved` with the bit kept | the cut file's sha256; a decision on an earlier cut is stale | **E1a** |

Placement is a separate question: an unplaced excerpt is in no tier that searches the whole catalogue at any bit (E1, `selectors.ts`, kept), and on no card row, since the card's candidates are what reached rungs list.

## The mechanism, and the test that told it apart

**Cause.** `admittedForTeaching` and `eligibleFor` read one private function, and it asked only whether `facts.promise.value === 'music'`. A cut carries no promise fact (the build writes one only for generated items), so every excerpt was admitted whatever its bit. The only thing keeping the five off the glass was that no rung lists one, together with E1's whole-catalogue skip for unplaced excerpts.

**Alternative.** Some consumer admits excerpts by a path that does not read the predicate, so fixing the predicate would leave a door open.

**Test.** The reds on the committed code split by path: the gate's verdicts, the card (`session.usable`), the swap sheet's lesson tier and last resort (the gate), and the built placement. One change in the predicate turns every one green and touches no consumer. The direct-consumer mutant, which bypasses the predicate at `usable()` for excerpts, turns only the card's two cases red.

## The red lines

Seen on the committed code or on a mutant. Mutated files were restored byte for byte, checked by sha256 (`scripts/mutants.py`, `scripts/only_filter_on_head.py`).

- **`red/red-app-committed-code.txt`: the new and revised cases on the committed code.** 12 of 86 fail, exit 1.
  - `eligibility.test.ts`, Q8 revised: `…b25-32: expected { verdict: 'eligible', … } to deeply equal { verdict: 'ineligible', why: 'teaching-use-not-approved', teaching: null }`.
  - E1a's refusal case: `…b25-32 at null: expected true to be false` (`admittedForTeaching`).
  - Every built excerpt: `excerpt.blues.wabash-blues.b1-4: expected true to be false`.
  - The staleness case: the stale row, `teaching: null`, admitted, `expected true to be false`.
  - `excerptItems.test.ts`: `expected [ true, true, true ] to deeply equal [ false, false, true ]` (undecided, `no`, `yes`), and on the built catalogue `excerpt.blues.wabash-blues.b1-4: expected true to be false`.
  - `gateAtTheConsumers.test.ts`, D3b's one-reading case with the oracle naming excerpts: `5 disagree`, the five excerpts `(against the contract table)`.
  - The predicate at each bit: `expected true to be false`.
  - The card: `teaching null: expected [ 'ex.r', 'ex.pre', 'excerpt.x' ] to not include 'excerpt.x'`.
  - The lesson tier: `teaching null: expected [ [ 'excerpt.x', 'lesson' ] ] to deeply equal []`.
  - The last resort: `teaching null: expected [ [ 'excerpt.b', 'kind' ] ] to deeply equal []`.
  - The built placement: `16 card rows`, from `3.1 (15 min): new excerpt.blues.wabash-blues.b1-4` through `blues.5 (120 min): new excerpt.classical.i-got-rythm.pdmx.b15-18` (four placements at four lengths).
  - Green on both, by design, are the positive cases:
    - the built cut's facts;
    - exploration at every bit;
    - admitted at `true` and still `untaught` for a learner taught steps and skips;
    - an unplaced cut on no card row at any bit;
    - the built placement at `true`;
    - the revised reader cases;
    - the Library and the opener asking neither;
    - both whole-catalogue sweeps.
- **`red/red-app-committed-code-first.txt` and `-second.txt`: two earlier runs whose reds included my own test faults, fixed before the third.**
  - Exact equality on verdicts that carry `untrusted` (the cut's tempo is inferred).
  - A last-resort fixture whose demands the constructed rung had not taught, so the gate refused it as `untaught` at every bit.
  - A placement that prepended the cut to a rung's songs and put the learner on every track. The card never offered the cut even when it was admitted (the seeded pick, other strands), so the positive case could not pass. That run's swap sheets offered the cut 34 times on the committed code.
- **`red/mutant-predicate-excerpt-off.txt`: the excerpt out of the common predicate.** 12 red, every refusal case above.
- **`red/mutant-usable-bypass-excerpts.txt`: `usable()` bypassing the predicate for excerpts.** 2 red: the constructed card case and the built placement's undecided sweep. The swap-sheet cases stay green: they ask the gate.
- **`red/mutant-predicate-excerpt-false-admitted.txt`: a `no` or `fix` on an excerpt read as approval.** 6 red: the refusal case, the Library case's admission line, the predicate, the card, the lesson tier and the last resort.
- **`red/mutant-build-stale-honoured.txt`: `review.same_identity` matching any file identity.** 1 red: `test_a_yes_on_the_older_cut_leaves_the_rebuilt_cut_undecided`.
- **`red/mutant-record-stale-honoured.txt`: `record.sameIdentity`, the same.** 1 red: the app's staleness case.
- **`red/mutant-e1-whole-catalogue-skip-off.txt`: E1's `isExcerpt` skip removed from the whole-catalogue tiers.** 2 red on the revised reader cases. HEAD's `excerptItems.test.ts`, run beside them, is green: the masking the revision removes.
- **`red/mutant-e1-only-songs-off.txt` and `mutant-e1-only-songs-off-on-head.txt`: the `only` filter in `usable()` admitting excerpts.** 0 red on the revised file, and 0 on HEAD's file with HEAD's `eligibility.ts`. E1's retention case never held this filter: the excerpt already fills the new slot, so `usable`'s used-check keeps it out of retention. The blind spot predates E1a; it is Follow-up 2, not fixed here.

## Tests touched

| Test | Class | Old assumption | Now |
| --- | --- | --- | --- |
| `eligibility.test.ts` › *an excerpt reaches an automatic offer only with a current teaching-use yes on its cut (E1a)* (6) | add | — | The built Anh. 113 cut: an excerpt, undecided, with no promise fact, establishing the key signature, nothing untaught at `classical.3`. With `key-signature` declared for the skill and requirement wants (the build declares none on a cut), refused for skill, requirement, demand and equivalent at `null`, `no` and `fix`, with the bit kept. Eligible for exploration at every bit. At `true`, eligible for each want, and `untaught` for a learner taught steps and skips. Every built excerpt is refused and open to exploration. The staleness case goes through `review/record.ts`. |
| `eligibility.test.ts` › Q8 › *its excerpt is eligible there once approved for teaching use … and refused until then* (and the block's title and note) | revise | "its approved excerpt is eligible there": an excerpt, unapproved for teaching use, passed the gate at `classical.3` | Refused at `teaching: null` for the equivalent and the key-signature demand. Eligible for both once `teaching: true` is set on the built row (constructed). The parent is unchanged. "Approved" now names the boundary (E1) apart from teaching use. |
| `eligibility.test.ts` module note, imports, `withTeachingUse` helper | revise (text), add (helper) | — | names E1a; imports `admittedForTeaching`, `uncoped`, `isExcerpt`, `record.ts`'s `resolve`, `identityOf`, `bits` |
| `gateAtTheConsumers.test.ts` › *a rung-listed excerpt passes the same admission …* (5 constructed, 3 built) | add | — | The predicate at each bit and with no provenance. The card's songs ask on a constructed rung listing the cut alone and beside a song. An unplaced cut is on no card row at any bit. The lesson tier and the last resort. On the built catalogue: each excerpt placed as the one song of the first rung that teaches what it was cut for; undecided, no card row or swap-sheet tier offers it; with a `yes`, the lesson tier offers each and the card's songs ask takes them. |
| `gateAtTheConsumers.test.ts` › the sweeps' `unapproved` oracle (the D3a swap-sheet sweep, D3b's one-reading case, D3b's card sweep) and the two built blocks' titles | revise | the admission refuses exactly the music-promising generated items without a `yes` | and every excerpt without a `yes` (read by `type`, apart from the app's predicate) |
| `gateAtTheConsumers.test.ts` › D3b › *the admission is one exported predicate* | revise (title only) | "refused only for a music promise … notated items admitted" | "refused for a music promise without a yes (an excerpt, E1a, below) … notated songs admitted"; assertions unchanged |
| `excerptItems.test.ts` › the swap sheet (2) and the session (3) reader cases | revise | an undecided excerpt reaches each reader, so its absence shows the reader's rule | the admission refuses an undecided excerpt anyway, so the cases use one with a `yes` (`APPROVED`), and the reader's own rule is what they hold (the mutant above) |
| `excerptItems.test.ts` › *the Library and exploration, whatever the teaching-use bit (E1a)* (3) | add | — | The Library's filter lists, the opener opens and exploration passes an excerpt at `null`, `false` and `true`, and only `true` is admitted. On the built catalogue the filter lists exactly the excerpts, each undecided, open and unadmitted. `LibraryScreen.ts` and `openItem.ts` ask neither the gate nor the admission. |
| `excerptItems.test.ts` module note, imports | revise (text) | — | the E1a paragraph |
| `tools/content/tests/test_review_record.py` › `TestAStaleDecisionOnAnOlderCutAdmitsNothing` (1) | add | — | two cuts of one definition from a changed parent (the cutter, `write_mxl`); a `yes` on the older cut's sha256 current over it and stale over the rebuilt cut, which `build.attach_provenance` leaves `null` with no reviewed fact |
| every other test, the D3a, D3b, E0 and E1 cases among them | preserve | — | green (below), except the two recorded CRLF worktree reds |

## Checks (unpiped; the exit code is each file's last line)

**Setup:**
- `npm ci`: 0.
- The parity reference: 0. Its three real-MIDI inputs are absent and skipped, as the script allows.
- Copies from the main checkout (`runs/copy.txt`): `kern` and `musetrainer` without their version-control folders, `build/cache/convert`, and the demands, notation and positions caches. Robocopy's 1 means "files copied".

**Content:**
- `build.py --offline` on the committed tree: 0. Every step ok: 2090 items, 5 excerpts cut, demands measured on 2011, `592 checkable claims on 1021 options: 356 not established, 9 kept by no option; 784 works, 813 arrangements`, validation OK.
- `SOURCES.md` restored with `git checkout --` on that one file. `inventory.md` and `rung-claims.md` got HEAD's text back with CRLF (`scripts/restore_reports.py`, 0).
- No content code changed, so there was no second build.
- The staleness case alone (`runs/staleness-committed-code.txt`): 0, OK.
- The content suite (`unittest discover -s tools/content/tests -t tools/content`, `runs/content-suite.txt`), on the final tree: **0, 1,248 tests OK (skipped=4)**, E1's 1,247 and the staleness case.

**App:**
- `npx tsc -b`: 0, and 0 on the final tree.
- `npm run lint`: 0, and 0 on the final tree.
- The three E1a files: red run 1 (above); after, 0 with 86 passed (`runs/vitest-three-final.txt`).
- The named files with the E0, D3a, D3b and E1 consumer files (`runs/vitest-consumers.txt`): **0, 26 files, 344 passed, 1 skipped (untouched)**. The files: `eligibility`, `gateAtTheConsumers`, `excerptItems`, `excerptPage`, `demandsOfFiles`, `reviewRecord`, `alternativesShareASkill`, `curriculumSelectors`, `levelSource`, `fallbackOrder`, `slotsFromEvidence`, `session`, `importOverlay`, `firstThirtyDays`, `firstThirtyDaysOnTheLadder`, `recommendRespondsToEvidence`, `skillActivationBoundary`, `help`, `taughtByAncestry`, `assignmentIsNotEvidence`, `parallelStrands`, `recordTruth`, `repertoireRetention`, `sightReadingIsNotAPiece`, `sightReadingSlot`, `todayCardRanking`.
- Vitest in full (`runs/vitest-full.txt`, before the last two comment-only edits in `eligibility.ts` and `gateAtTheConsumers.test.ts`, after which tsc, lint and the three files ran again): 1, with **6568 passed, 2 failed, 5 skipped**. The two are `lessonClaimsAboutApp` › blues.3 and › 4.7, which match a literal LF in `ScoreScreen.ts` and `style.css`. Both files are CRLF in this checkout and untouched: the worktree reds D0, E0, D3a, D3b and E1 recorded.
- The mutants (`runs/mutants.txt`): the harness 0, each mutant red as listed.
- The placement probe (`scripts/zz-e1a-probe.test.ts`, copied into `app/tests/unit/` for one run and removed): committed code 0, final 0.

**Browser:** none run. The brief requires none, and no screen changed. Port 4183 was not used.

## Unverified, beside what passes

1. **Nothing heard, nothing decided, nothing placed.** Every admitted-at-`true` case runs on a constructed row. No excerpt has a teaching-use decision, and the route to one (the microscope's export and `review.py --merge`) is D2's, not exercised here.
2. **The built placement is a test fixture, not a curriculum proposal.** Each excerpt goes on the first rung teaching one of its targets, as that rung's one song: 3.1 for two, `blues.5`, `latin.3`, 3.6. Its learners are fresh, on the core path and that rung's track. A learner with history reaches other slots; the constructed cases cover those paths' logic.
3. **The product look is read from unit probes of the card, not from the screen.** No excerpt is on any rung, so the glass has nothing to show; no picture was taken.
4. **The combined tree with D3c has not been run.** D3c's `LessonScreen` picks read `admittedForTeaching` by name and so refuse an undecided excerpt with no change. The shared consumer and whole-catalogue sweeps are to run once on the combined tree (the reviewer's constraint).
5. **CI has not run this tree.**

## Not done

- **Nothing of the decided items.** Items 1–5 are done. Item 6 was left alone: no decision, no chooser, no D4, no density hypotheses, nothing for Q58.
- **No Library screen change.** The detail sheet stays silent, by the reviewer's constraint (`responses/7bdd8a0.md`). No "Not approved for teaching use" line was added.
- **`unapprovedMusic` is not renamed.** The name still fits both kinds, and the brief allowed either.
- **The notes in `session.ts` (`usable`), `selectors.ts` (the whole-catalogue skip) and `excerpt.ts` (the module note) are not updated.** They describe the route to the glass without naming the excerpt's admission. None is false, but each is now incomplete. None is in this seam's files, and `session.ts` and `selectors.ts` are named as not to touch (Follow-up 1).
- **The whole-catalogue swap-sheet part of the built placement has no separate red count on the final placement.** The case asserts the card first, which fails on the committed code. The sheet is held by the constructed lesson-tier case, by the predicate mutant, and by the second run's 34 offers under the earlier placement.

## Follow-ups

1. **P3: three module notes are now incomplete** (Not done, fourth item).
   - `session.ts`'s `usable` note says a music-promising generated item is offered by no slot until a `yes` is built; excerpts are now in the same case.
   - `selectors.ts` says "An excerpt reaches a learner through a rung once F lists it"; it now also needs a `yes` on the cut.
   - `excerpt.ts` says the same of "through a rung once a rung lists it".
   - One sentence each, for the owner of those files, or at the combined-tree integration.
2. **P3: E1's repertoire-retention case in `excerptItems.test.ts` is blind to the `only` filter** (`red/mutant-e1-only-songs-off-on-head.txt`: green with the filter admitting excerpts, on HEAD's code and test and on this tree's). The excerpt it retains is already the new row, so `usable`'s used-check hides the filter. A case where the rung's songs ask is met, or the excerpt is not the rung's song, would hold it. This predates E1a.
3. **Note for F.** A rung whose only song is an excerpt without a `yes` has its songs ask unmet, and the card fills the row from the next valid step. That is the same shape as `latin.3`'s and `latin.6`'s exercise asks under D3b. Placement is F's, on the stated gate, which already asks for the `yes`.

## Questions

None. The one product-facing choice, a Library state line, the reviewer settled: leave the sheet silent.

## Files

In the worktree `C:\Users\yalir\repos\Piano Stuff\PianoProject\.claude\worktrees\agent-a72714772c690261e`; nothing committed, nothing staged:

- `app/src/curriculum/eligibility.ts`:
  - `unapprovedMusic` reads an excerpt's bit (`isExcerpt` imported), a missing record reading as undecided;
  - its note, `admittedForTeaching`'s note, the verdict type's note, the check's comment;
  - the module note's D3a paragraph.
- `app/tests/unit/eligibility.test.ts`, `app/tests/unit/gateAtTheConsumers.test.ts`, `app/tests/unit/excerptItems.test.ts`, `tools/content/tests/test_review_record.py`: the cases above.
- `docs/02-curriculum.md`: Part E's excerpt paragraph; the gate's two questions are no excerpt branch; the admission since E1a.
- `docs/03-content-pipeline.md` §4c: the teaching-use bit is the cut's.
- `docs/04-ui-spec.md` §2: the card's admission bullet and the swap sheet's tiers paragraph, the excerpt's admission.
- `docs/08-test-map.md`: an E1a row and four file lines.

Outside the brief's list: none. `test_review_record.py` imports `grand` from `test_excerpts.py` inside its case, and changes nothing there.

Beside this entry (`…\scratchpad\E1a\`):
- `red/`: the three committed-code runs and the eight mutant captures.
- `runs/`: every run, with its exit code.
- `scripts/`: `mutants.py`, `only_filter_on_head.py`, `restore_reports.py`, `eol.py`, and the probe `zz-e1a-probe.test.ts`.
- `e1a.diff`.

**Orchestrator's note at the merge (2026-09-28).** Merged clean on top of D3c (main held D3c's merge and record commits since the dispatch; no file in common). The reviewer's constraint met: the two seams' shared consumer and whole-catalogue sweeps ran once on the combined tree — the D3c rung-page file, the consumer, gate, excerpt, ladder and session files 0 (148 passed, both sweeps among them), the record suite with the build-side staleness case 0 (17 tests, OK), tsc 0, lint 0, app build 0, the lesson-page specs 0 and the rung-page look 0. Nothing on the glass changes for a learner today, as the builder's placement probe showed; nothing heard.
