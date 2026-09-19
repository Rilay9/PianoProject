# Lesson audit — the brief

**Audit, do not fix.** The owner's instruction (2026-09-19): find every claim in the lesson
prose that is false, stale or unchecked, write each one down, and move on. A later pass will
fix them from the list. **You write only your batch file.** You do not edit any lesson,
curriculum file, catalog, code or test.

## Why

The app has 98 lessons (`content/lessons/*.md`, ~43,000 words). On 2026-09-19 four
lessons were rewritten and re-reading them against the scores found **16 false
statements**; separately, the blue note of the blues scale was spelled two contradictory
ways across exercises and three lessons. Only 10 lessons have any musical fact checked by a
test (`app/tests/unit/lessonClaimsAboutMusic.test.ts`). The owner cannot trust what the
lessons say. This list is how that gets fixed.

## Read first

`docs/prompts/working-rules.md` in full. The rules that matter most here, quoted:

- **§1** — *"A proxy is adopted for convenience, and then its result is reported as the
  thing itself."* A title is not the music; a catalog summary is not the score; an id is not
  what the drill does. Name your proxy when you use one.
- **§2.1** — *"Never state an absence. State the search and its result."* Before writing
  "the rung does not offer X" or "no lab preset does Y", run a second search shaped
  differently.
- **§2.2** — *"A claim about several things is several claims."* A lesson sentence with
  *all*, *every*, *both*, *each*, or a plural is several claims: check each one.
- **§2.3** — *"Never infer a property of music from a title, an id, a level or a genre
  tag."* Read the notes.
- **§2.10** — *"Green is not done."* Say what you could not verify.
- **§2.17** — *"Your own prose about your own code is a claim."* A lesson describing what a
  button, drill or preset does is a claim about code: read the code.

## What counts as a claim, and how to check it

Read each lesson **in full**, top to bottom. Every sentence that could be true or false is a
claim. The kinds, and the instrument for each:

| kind of claim | check it against |
|---|---|
| a piece's key, time signature, length, staves, chord symbols, what a hand plays ("the left hand holds block triads", "a broken chord in every bar", "the melody starts on E") | `python tools/content/dump_score.py <item-id>` — prints the built score bar by bar per staff and voice, with chord symbols and printed bar numbers. Read the bars the claim is about. The catalog's `notation` field (in `app/public/content/catalog.json`) is a summary, useful for key/time/staves/bars; it cannot answer what a hand plays. A `mode: null` key means the file did not say major or minor — use `finalBass` and the notes. |
| which pieces or exercises the rung offers, "N options", a piece named as on this rung | the rung in `content/curriculum/stage-<n>.json` (`songOptions`, `exerciseOptions`). "N options" means N **songs**. |
| another rung, stage or track ("the next rung", "at Stage 6", "the chord track covers transposing") | the curriculum files: does that rung exist, at that stage, teaching that? |
| what a tool/button/mode/lab preset does ("the lab plays A minor, G and F", "Duet takes one hand away") | the rung's `tools` in the stage file; lab presets in `app/src/engine/sightReading.ts` (`LAB_PRESETS`: key, progression, left/right hand, locks); tool buttons in `app/src/ui/screens/LessonScreen.ts` (`toolButton`); drills in `app/src/engine/drills/`. |
| what a generated exercise contains ("the cadence exercise is I–IV–V7–I in C") | `dump_score.py <exercise-id>` and, if needed, its generator in `tools/content/generate_exercises.py`. Drills have no file: read their `drill.params` in the catalog and the drill's code. |
| music theory ("the relative minor of F is D minor", "a power chord has no third", "Dorian has a raised sixth") | your knowledge — but mark it **THEORY** so a musician can confirm it. |
| musical judgement ("the easiest way in", "a sound rock uses often", "sounds lazy rather than hurried") | not checkable — list it as **JUDGEMENT** only if it is a factual-sounding generalisation a musician might dispute; do not list plain teaching advice. |
| history, attribution, licensing ("Holst 1906", "the English words are in copyright") | mark **HISTORY**; check against the catalog's `composer`/`source` fields where they exist. |
| external links in front matter (`videos:`) | do not fetch them. Skip. |

A decided house rule to respect, not report: **the blues scale's blue note is spelled as a
raised fourth in every key** (F♯ in C), by the owner's decision of 2026-09-19
(`BLUES_SCALE_FORMS` in `generate_exercises.py`). A lesson calling it the "flattened fifth"
while writing F sharp is correct. A lesson spelling it G flat is a finding.

## Output

Write **`docs/lesson-audit/batch-<N>.md`**, one section per lesson, **in the order given**,
every lesson present even if it has no findings. Format exactly:

```markdown
## <lesson id> — `content/lessons/<file>.md`

Claims checked: <number>. Findings: <number>.

- [ ] **FALSE** `content/lessons/<file>.md:<line>` — "<the sentence or clause, quoted, ≤ 30 words>"
  - Is: <what is actually true, one or two lines>
  - Evidence: <what you read — the command and the bars, the field and its value, the file:line of the code>
- [ ] **STALE** … (refers to a rung, stage, tool, piece or number that has since changed)
- [ ] **WRONG-COUNT** … ("Six options" when the rung offers five songs; "twelve bars" when it is eight)
- [ ] **UNOFFERED** … (names a piece or exercise as this rung's that the rung does not offer, and does not point to the Library)
- [ ] **THEORY** … (a theory statement you believe is wrong, or right but worth a musician's eye — say which)
- [ ] **JUDGEMENT** … (a factual-sounding musical generalisation only a musician can confirm)
- [ ] **UNVERIFIED** … (a checkable claim you could not check, and why)

Not checked in this lesson: <anything you skipped, or "nothing">.
```

Line numbers are the line in the `.md` file where the quoted text starts. Quote exactly. One
finding per claim; if one sentence has two wrong facts, write two findings. Keep "Is" to the
truth, not a rewrite of the lesson — the fixer writes the prose.

At the very end of the file:

```markdown
---
Batch <N>: <lessons done> of <lessons given> lessons. <total findings> findings
(<n> FALSE, <n> STALE, <n> WRONG-COUNT, <n> UNOFFERED, <n> THEORY, <n> JUDGEMENT, <n> UNVERIFIED).
Lessons not finished: <ids, or "none">.
```

## Rules for this job

- **Every lesson in your batch, every sentence.** No sampling. If you run out of room or
  hit an error you cannot get past, write the lessons you did not finish in the last line —
  never stop silently, and never skip a lesson because an earlier one was slow.
- **One lesson at a time**, read in full before checking. A claim you checked in one lesson
  is not checked in another.
- **Do not fix anything.** Not the lessons, not the curriculum, not a test, not the tool.
  If `dump_score.py` is wrong about a file, say so in a finding (**UNVERIFIED**, with why)
  and read the MusicXML directly.
- **Do not run the content build, the test suites, or Playwright.** Nothing here needs them,
  and other work shares the machine.
- **Never name an AI model** anywhere in what you write (repository rule).
- Nothing here has been heard. Do not claim any piece sounds a certain way; claims about
  sound are JUDGEMENT.
