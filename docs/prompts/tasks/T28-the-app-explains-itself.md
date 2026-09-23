# T28 — Every screen, mode and drill says what it is, what to do now, and what else is here

**Read `docs/prompts/working-rules.md`, `docs/00-invariants.md` (§1: a control that looks
pressable and is not is a bug; nothing acts unasked), the checklist in `CLAUDE.md`,
`docs/04-ui-spec.md` §0 R1–R6, §3, §5 and §5c, `docs/pending-review.md` Entries 30
(`LAB_HELP`: the pattern that worked), 38, 42, 45 (clarity findings) and 49 (the grid's
"unclear" cells and the cue findings), and `app/src/ui/screens/GuideScreen.ts` first.**

## Why

The owner (2026-09-22): "there's not enough context or explanation given in the modes and
exercises. There's gotta be a better way to tell the user what's going on, what they're
supposed to do, what they can do, and what's available." The lessons explain; the screens
mostly do not. Four questions, and every screen must answer them on the screen itself:

1. **What is this?** One line: the mode or drill in the learner's words.
2. **What do I do now?** One line that changes with state: *Listen*, *Your turn*, *Play
   from bar 5*, *Tap a key to name it*, *Pass: 90 % at 80 % of tempo*.
3. **What can I do here?** The controls that matter on this screen, one line each, and
   what each says back.
4. **What else is there?** Where this fits: the rung it came from, the other modes this
   piece offers, the drill's siblings, the Library.

## Build

- **One source of explanation.** `app/src/ui/help.ts` (or extend the lab's table): a table
  keyed by screen, mode, drill kind and control, each entry the four answers above, in
  the lesson voice, no jargon a Stage 0 learner has not met. `docs/04` §5 and §5c carry
  the same lines (a test compares them, as `docsConsistency.test.ts` does elsewhere).
- **A help strip on every practising screen** (Score in every mode, every drill, the lab,
  the chord chart, free play): question 1 and 2 always visible without scrolling on a
  342 px phone (R1), question 3 behind one tap (`?` or the existing `⋯` sheet), question
  4 at the bottom or in the sheet. State-driven: the "do now" line follows the run
  (countdown, listening, your turn, paused, finished) from the same signals the cues use
  (Entries 28, 42, 49), never a second clock.
- **First sight of a drill kind**: a three-line card the first time each kind is opened
  (what you will hear or see, what to do, what counts), remembered per kind, reopenable
  from the strip. Same for each Score mode the first time it is chosen.
- **The Guide screen** lists every mode and drill kind with the same table's lines, so
  "what's available" has one page, and the Skills and lesson pages link to it.
- **Tests**: a unit test that every `DrillKind`, every Score mode, every lab setting and
  every routable tool has an entry with all four answers; a spec per practising screen
  that the strip's two lines are inside the first screenful at 342 px and change with the
  run; proved red by removing an entry.

## And every string the learner reads, reviewed for its wording

The owner (2026-09-22): "a lot of the wording in the context is weird too and unhelpful."
So, before writing new lines, read the old ones:

- **Extract every user-facing string** in `app/src` (labels, buttons, status lines, sheet
  rows, summary lines, empty states, error text, the tips in `content/tips/`, the Guide) with
  a script into a table in your scratch folder: file:line, the string, where it is seen.
  Say the count.
- **Judge each** against four tests: does a first-week learner know every word in it; does
  it say what to do or what happened rather than what the code did; does it use the one
  name `docs/04` §5 gives the thing (Entry 45's two-names list); is it a sentence a teacher
  would say aloud. A string that fails any test gets a rewrite beside it in the table.
- **Rewrite them** in one voice, the lessons' voice: short, concrete, second person where
  it tells the learner something to do, never a glyph alone for a control that matters,
  never an id, a stage number or a percentage without the word it belongs to. Where a spec
  or unit test pins the old string, update the test in the same step and say which.
- **Record the table** (before, after, why) in the entry, grouped by screen, so the owner
  can read the wording as a whole rather than meet it one screen at a time.

## The lessons' wording too (owner, 2026-09-22: "All the lessons too")

The same four tests over every paragraph of all 109 lessons, in the same table (lesson,
line, before, after, why). Constraints that make this safe: the facts in the lessons are
under claim rows (`lessonClaimsAboutMusic.test.ts`, `lessonClaimsAboutApp.test.ts`), so a
rewrite keeps every fact and the tests prove it; `readingTime` recounted; the three-minute
cap holds; the *Tools for this rung* paragraph keeps naming exactly the rung's tools
(Entry 41). Voice: a teacher at the piano beside you, plain words, one idea per sentence,
no term the stage has not taught. Entry 45's four out-of-voice lessons are the floor, not
the ceiling: read every lesson, and say per lesson whether it was left, tightened or
rewritten.

## How a lesson and a mode start (owner, 2026-09-22: "it should be intuitive")

Read Entries 18 (the abrupt start), 24 item 9, 29, 42 and 49 (the start cells), then:

- **Opening a lesson.** On a 342 px phone, the first screenful must answer: where am I
  (track, stage, the rung's one-line purpose), what do I do first (one primary action,
  visibly primary, not a list of equal buttons), and what happens when I press it. If the
  lesson page today opens on prose, options and tools of equal weight, redesign the first
  screenful around one *Start* that opens the rung's recommended item in its recommended
  mode, with the rest below. Spec at 342 px, red first.
- **Starting a mode.** From the moment the piece opens to the moment the first note is
  judged, the learner must be told what is happening in words on the screen: *Listen to the
  count-in*, *Play the first note when you are ready — the clock starts on it* (T8's
  latch), *Your turn*, *Listen*. One state line, the same signals the engine uses, never a
  second clock. The first expected note visibly marked before anything is judged. Same for
  drills: the first card explains itself before it asks. Spec per mode, red first.
- **Coming back.** A run left half-way and reopened must say where it was left and offer
  to continue or restart, not silently restart from bar 1 (Entry 49's recorded item on
  abandoned runs is the sibling; fix it here if it is small).

## One reported fault (owner, 2026-09-22)

A score added from the score folder appeared in the Library only after a delay long enough
that the owner thought it needed a rung. Reproduce: add from the folder, open the Library,
time the row's appearance; read `LibraryScreen.ts` around its import watcher (the comment
near line 752 says `allImports()` re-reads every imported file). Fix so the new row shows at
once or the screen says it is arriving; a spec that the row is on screen within the
first paint after the add, red first.

## Rules

- Files: `app/src/**`, `app/tests/**`, `docs/04-ui-spec.md`, `docs/08-test-map.md`, one
  appended entry in `docs/pending-review.md` (Entry 54), `content/tips/*.md` for the tips'
  wording, and `content/lessons/*.md` for the lessons' wording (facts unchanged, rows green). Do not touch the rest of `content/` or `tools/` (another agent is there).
- `npm run build:app` before any spec; one spec at a time on 4173 (check it is free);
  `npx tsc -b`, `npm run lint`, `npx vitest run`. Never name an AI model. Commit nothing.
  An absence needs two searches; a plural is several claims; nothing is heard.
- Every screen in the list gets its strip or a not-done line with the reason. Keep a
  handoff file current in your scratch folder. Never stop silently.

## Final message

Screens given the strip; the table's size (entries per kind); the first-sight cards; the
Guide page; tests and red lines; counts; what is unverified.

## Addendum, 2026-09-23 02:50: the lessons half is done (Entry 55); four items folded in from the triage

The lessons' and tips' wording section above is complete and is not part of this task any
more. Added from the verdict triage in `docs/prompts/plan-2026-09-21.md`:

- **The orphan screen** (Entry 52 item 1): `mountLazyScreen` in `app/src/ui/AppShell.ts`
  calls the screen factory inside the dynamic import's `.then` and only then checks whether
  its holder is still connected, so a screen the route has already left is still built and
  can subscribe to the shared MIDI source. Move the check before the factory call; a unit
  test seen red.
- **Mounted once**: Entry 52 measured the double mount on the Score screen only; one
  assertion each that the chord chart, a drill and the lab mount once when opened from
  Plan and from Library.
- **The placement's seven fail branches** (Entry 52, unverified): a parameterised spec, one
  case per branch, asserting the unit each names, the way `first-day.spec.ts` asserts.
- **Lesson prose in the score screen's side panel** (Entry 55, unverified):
  `ScoreScreen.ts`'s `fillSidePanel` renders a lesson body in a narrower column than the
  lesson page; a spec at 342 px that an edited lesson renders there without a clipped or
  overflowing line.

Work in this order so a cap leaves a coherent tree, with a handoff line after each part:
the delayed Library row; the string extraction and the wording table; the explanation
table, the strip, the first-sight cards and the Guide; the lesson and mode start
experience and the coming-back case; the four items above. No other agent is in `app/`
now; the content build's output under `app/public/content` is regenerated by the build.
