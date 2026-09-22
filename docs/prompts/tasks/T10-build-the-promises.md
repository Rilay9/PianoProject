# T10 — Build what the lessons promised, and give the lessons their promises back

**Read `docs/prompts/working-rules.md` first, then `docs/00-invariants.md`, then the
checklist in `CLAUDE.md` ("Before reporting any piece of work"). A hook puts that checklist
in front of you before your turn can end; answer it honestly and say what it caught.**

## Why

The lesson audit (`docs/lesson-audit/README.md`, "Decide before fixing") found lessons
promising things the app half-has: code that exists and nothing calls, settings that exist
and nothing reads. The fix pass rewrote those lessons to describe the app as it is. The
owner's decision (2026-09-21, `docs/pending-review.md` standing context 6): **build the
features, correctly, and let the lessons teach them again.** Where one cannot be built
honestly, write why and leave the lesson as it is.

## The list

Each item: what the lesson promised, where the code is now, what "built" means. Read the
finding's `Fixed:` line in the batch file for the exact evidence; the file:line numbers
there may have shifted a little.

1. **Per-rung pass thresholds.** Every rung carries `mastery.minAccuracy` and
   `mastery.minTempoPct` and nothing reads them: `Scoring.ts` passes at one global 90 % /
   80 % (`passAccuracy`, `passTempoPct`). Note the units: the curriculum writes `0.8`, the
   scorer writes `80`. Built: a run judged for a rung uses that rung's numbers; a run with
   no rung uses the defaults. Consumers to read before changing anything: `lessonComplete`
   in `curriculum/selectors.ts`, `prerequisites.ts`, the Plan screen, the pass records in
   storage (do they store accuracy and tempo, or only `passed`? if only `passed`, say what
   a threshold change does to old records). Lessons 1.1, 1.3, 1.4, 2.1 and others quote
   per-rung speeds; batch-1 has them.
2. **Dynamics and voicing scoring, written and never called.** `shapingScore`
   (technique.5, "scored on the slope"), `voicingScore` (technique.6, "the app measures",
   "the top note at least 1.4 times the rest"), the held-length articulation scorer
   (technique.4), the half-pedal scoring (technique.7). Built: the score screen computes
   and shows each for a run of an item that asks for it (decide how an item asks: a catalog
   field, or the rung's `mastery.custom`; read what `mastery.custom` already carries and
   how the app reads it), and the rung's pass uses it only where the rung says so.
   `lessonShape.test.ts` pins technique.6's "1.4 times" wording: once the number is read by
   code, that pin becomes a real claim; make the test read the constant.
3. **Drill settings nobody reads.** Hands-together `leftHand` and position-shift `shifts`
   (2.1, 2.5: both drills play the same five-finger call-and-response); melodic dictation
   and *Answer the phrase* `bars` / `scale` (theory.4, improv.4: four random notes, not two
   bars); ii–V–I `voicing: shell` (jazz.5: asks for plain triads); the form tracker's
   `chartView` (jam). Read `fromCatalog.ts` for where each param is dropped and
   `factories.ts` for the drill. Built: each param does what its name and the lesson say.
4. **Melodic dictation prints its answer.** `callResponseDrill` labels each prompt with the
   note names and the drill screen shows the label before the learner plays. That breaks
   `docs/04-ui-spec.md` §5c whatever the lesson says. Built: nothing that identifies the
   notes is on screen until the attempt is judged; a *Hear it again* replays.
5. **Lab presets that lock what the lesson tells the learner to change** — 3.3, improv.4,
   chords-pop.5, improv.6, chords-pop.8, chords-pop.9, blues.8, improv.8 (`LAB_PRESETS`
   in `sightReading.ts`, `locks`). The preset design (`pending-review.md` Entry 5) is
   right: a preset fixes what makes it that style. So for each rung: either point its lab
   button at a preset whose locks leave free what the lesson teaches (adding a preset
   variant where none fits), or give the button a `preset` plus an unlocked control. Read
   the lesson's *original* sentence in the batch file to know what it wanted.
6. **Swing and accent judging.** ragtime.5, blues.4, jazz.5 and 4.5 say the app judges the
   shuffle or the swing; *Rhythm only* judges each strike against the written straight
   eighths within a fixed window. Built, if it can be built honestly: when the score carries
   a swing marking, the expected time of an off-beat eighth is moved by a ratio (state the
   ratio and its source) and the window applies around that; accent judging from MIDI
   velocity where the score marks an accent. Prove each with a synthetic performance in a
   unit test: a correctly swung run passes and a straight run of the same notes does not,
   and the reverse for a straight score. If it cannot be made honest, write why in the
   entry and leave the lessons as they are.
7. **Tool paragraphs for tools the rung does not have.** jazz.7 and theory.7 describe the
   lab, technique.7 describes Duet; their rungs' `tools` are play+duet, simon, none. Built:
   give the rung the tool the lesson teaches with (a `tools` entry in the stage file), then
   restore the paragraph.
8. **The chord-chart screen has no route that opens it** (`#/chart/<itemId>` exists in
   `router.ts`; nothing navigates there). Built: a way in from the rungs whose lessons
   describe it (jam, jazz.5) and from the score screen of an item with chord symbols.
9. **"Placement recorded. Today will build from here."** (`DrillScreen.ts`,
   `LessonScreen.ts`): the plan does not change after placement. Built: it does — the plan
   starts from the placed unit — or the sentence goes. Prefer building it; read how *Start
   here* and the plan's ordering work first.
10. **Stale names.** "Tempo mode" and "Wait mode" in `1.2.md:53` and `technique.8.md:26–28`
    are the old names for what the app now calls something else; find the current names in
    `docs/04-ui-spec.md` and use them. `2.2.md`'s 6/8 sentence now clashes with the "1 and
    2 and" count beside it; make the paragraph agree with itself.

**Not in this task:** T2 (trading fours) and T6 (the tempo ladder route). They come next,
in their own briefs, and share screens with this work.

## For every feature you build

- **A test proven red first**, then green. Name in the entry which line you removed to see
  it red.
- **Restore the lesson.** Find every finding in `docs/lesson-audit/batch-*.md` whose
  `Fixed:` line says the feature was the owner's decision or needed a build; put the
  teaching back (the original quoted sentence is in the finding), keeping any fact
  correction the fix also made. Recount `readingTime` (`ceil(words / 200)`). Write under
  the finding: `- Built (2026-09-21): <what the app now does>; the sentence now reads "…"`.
- **A claim row.** Add `app/tests/unit/lessonClaimsAboutApp.test.ts` (new): one row per
  restored sentence, asserting against the code or catalog what the sentence says (the
  preset's locks, the drill's params, the threshold the rung carries). Model it on
  `lessonClaimsAboutMusic.test.ts`.
- **The spec.** `docs/04-ui-spec.md` and `docs/05` say what the screens and engine do;
  change them in the same step, with the reason (`00-invariants` §4).
- **Consumers.** Before changing any field, grep every reader of it and say what each does
  (`working-rules` §2.15).

## Rules

- Files: `app/src/**`, `app/tests/unit/**`, `content/lessons/*.md` (only lessons named by a
  finding you are restoring), `content/curriculum/stage-*.json` (only `tools` entries;
  splice text, never re-serialise — `CLAUDE.md` says why), `content/catalog.static.json`
  if a drill param must change, `docs/04-ui-spec.md`, `docs/05-score-follow-engine.md`,
  `docs/lesson-audit/batch-*.md` (the `Built:` lines only), and one appended entry in
  `docs/pending-review.md` (Entry 24). Do not touch `tools/content/` or `build/`; other
  agents are there.
- Run `npx tsc -b`, `npm run lint` and `npx vitest run` from `app/`. **Do not run
  Playwright** and do not start a server on port 4173: the quarry is rendering on it. The
  coordinator runs the browser suites once at the end; list in the entry which specs
  should be run and what each should show.
- If a lesson edit needs the content build to be seen by a test, say so; do not run the
  build.
- Your scratch folder: `C:\Users\yalir\AppData\Local\Temp\claude\C--Users-yalir-repos-Piano-Stuff\26d8772b-b51d-4e51-bd51-20002e98bae1\scratchpad\T10\`.
- Never name an AI model anywhere you write. Commit nothing.
- Every one of the ten items is built or has an explicit not-built line with the reason.
  Never stop silently; if you run short, the entry names what was not reached.

## Final message to the coordinator

Per item: built / not built and why; the test that proves it and the line that made it red;
the lessons restored. Then: `tsc`, lint and unit counts; the Playwright specs to run; what
is unverified.
