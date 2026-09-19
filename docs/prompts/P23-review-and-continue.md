# P23 — Review what was done on 2026-09-18, then continue it

For a reviewing session with no memory of the work. **Read this file first, then
`docs/00-invariants.md`, then the four documents named in §1.** Nothing below asks you to
trust the previous session's judgement; every claim it makes is recorded with what it was
measured from.

The owner's standing instruction for this work: *"Be comprehensive, exhaustive, and
explorative. We want a well rounded and diverse group of lessons."*

---

## 0. State of the tree

Branch `claude/piano-teaching-app-bo19td`, from `2dd83cd`. **Nothing is committed.** 54
paths are modified or untracked. The build is green: `validate.py` OK at 2,053 catalog
items and 96 lessons, `npx vitest run` 162 files / 2,169 tests, `npx playwright test
lesson-tools.spec.ts lab.spec.ts lesson-flow.spec.ts` 15 passed.

Green is not the claim being made. The claim is that the *mechanical* checks pass; the
things that need an ear are listed in §2 and have not been checked by anyone.

---

## 1. Read these four, in this order

| | What it is | Why first |
|---|---|---|
| `docs/audit-2026-09-18.md` | An honest audit of the work, written by the session that did it | It lists three HIGH findings against its own output and says what is unverified. Start with the criticism. |
| `docs/pending-review.md` | Fifteen entries, one per chunk of work | Includes the faults introduced and caught, not only the ones fixed. Entry 3 is the worst one. |
| `docs/prompts/P22-genre-expansion.md` | The plan the work followed | Part 2 is a critique of each step *before* it was taken; the table near the end sorts every rule by whether the build enforces it or a person has to remember it. |
| `docs/genre-plans/*.md` | Twelve documents, 69 rungs | Candidate repertoire per track per stage, every piece labelled `IN CATALOG` / `IN ARCHIVE` / `NOT FOUND` against the 254,077-row archive. |

---

## 2. Review — what only a person can decide

These are in order of how much damage they do if wrong.

**2.1 The nine lessons, read as a musician.** `rock.4`, `rock.5`, `rock.6`, `rock.7`,
`jam.5`, `jam.6`, `latin.3`, `hymns.2`, `holiday.3`. Their *factual* claims are checked by
`lessonClaimsAboutMusic.test.ts` — twenty claims, one was wrong and is fixed. **Whether
they teach is unchecked and no test can check it.** The rock ones are the most likely to
be wrong: they teach textures on public-domain vehicles, so the repertoire is Greensleeves
and John Denver, which is defensible in the prose and looks absurd at a glance.

**2.2 The three HIGH findings in the audit**, which the session found in its own work and
did not fix:
- `rock.4` owns none of its material — its four exercises are ones the same session put on
  core rungs `2.1`, `2.3` and `3.3`. A learner who did the core path meets them twice.
- `rock.5`'s four options are one generated family with the parameter changed.
- `hymns.2` is entirely re-presented material.

**2.3 The re-level table**, `docs/pending-review.md` Entry 4, marked NEEDS A MUSICAL EAR.
Five generated families moved level, some by two stages — `clave` 4.2 → 2.8,
`power-chord` 4.1 → 2.8. Every number is an argument from the core path's own rhythm
ladder and **none of it was heard**. The reasoning is written into
`tools/content/generate_exercises.py` beside each constant.

**2.4 Five generated families nobody has played.** `riff`, `swing-pair`, `modal-vamp`,
`pentatonic`, `tresillo` — 19 items. Five faults were found in them by rendering and
looking, including a vamp whose left hand climbed above middle C. **The previews are
crops**, which is exactly how a piece that modulates twice got placed on a rung about a
figure that never changes. Open the whole score, not `build/previews/`.

**2.5 Forty-one quarried songs waiting for keep/drop.** `build/pdmx-p22b/review/index.html`
— converted, gated, rendered, one decision each. Sixteen jazz (*Avalon*, *After You've
Gone*, *Darktown Strutters' Ball*, *Tiger Rag*, *12th Street Rag*, *Sweet Georgia Brown*,
*Muskrat Ramble*, *The Crave*), twenty-one folk, three latin, one rock. Levels 1.0–7.9.
`review.py` exists precisely because *"only an ear decides what is worth practising"*.

**2.6 Four decisions taken without the owner**, recorded in P22 §"the four open questions":
holiday and hymns split into two new rungs rather than nine; `tools` built as real controls
before the rungs; `ragtime.9` to be built; the three date rulings to ship labelled.

---

## 3. Implement — in this order

**3.1 Fix the three HIGH findings** (§2.2). No new music needed; all three are edits to
files that exist. The audit's §"If you keep it" lists two more.

**3.2 Restore `content/sources/pdmx.json`'s formatting.** It shows 8,186 changed lines to
alter three rows, because a `JSON.stringify` rewrite reformatted the whole table.
*Verified semantically: 533 rows before and after, none lost, exactly three changed as
intended.* It is diff noise, not data loss, but that file is currently unreviewable.

**3.3 Build the four rungs that need nothing new.** Each has three or more pieces already
in the catalog, so no quarry is involved:

| rung | what it teaches | in catalog |
|---|---|---|
| `jazz.4` | swung eighths, comping on plain triads | 5 |
| `rock.3` | narrow the overview to reduction, hand the rest to `rock.4`–`.7` | 4 |
| `holiday.2` | carols you can play this year | 5 |
| `holiday.4` | three cheap devices that sound expensive | 4 |

**3.4 Build the modes five or more rungs are asking for.** Both are in the genre plans
against specific rungs:
- **Trading fours** — wanted by `blues.5`, `blues.7`, `jazz.4`, `jam.7`, `improv.4`. Both
  halves exist: the `call-response` drill kind and `audio/backingLoop.ts`. The app plays
  two bars over the bed, the learner answers two.
- **Simon seeded from a genre's own scale** — wanted by `blues.3`, `latin.3` (the clave),
  `jazz.6` (a ii–V–I), `hymns.5` (a walk-up), `improv.5`. Simon is C major or chromatic
  today; seeding it is a parameter on a drill that exists. It is also the only way any
  genre rung would honour `02` Part A item 7, *ear before theory before name*.

**3.5 Then the quarry, once, for the seventeen rungs that need it.** The genre plans name
the pieces and `content/sources/pdmx-wants.json` carries three already verified against the
archive with their content ids. `build/pdmx-genres/candidates.json` already holds the full
2026-09-16 shortlist — **265 classical candidates in it have never been extracted** — so no
new `index.py` or `shortlist.py` run is needed. Latin and hymns have the most waiting (23
and 19) and almost nothing missing.

---

## 4. The rules, and which of them the build enforces

`P22` §"Which of these rules the build enforces" has the table. Nine rules are carried by
the repository and cannot be shipped past. **Four are carried only by whoever is working,
and each was broken at least once on 2026-09-18:**

1. **Never choose a piece of music by its title, id or level.** Four of eight placements
   were wrong this way in one sitting.
2. **Never state an absence from one search.** Three false absences, two of which caused
   work to be built on them. `grep` returning nothing means `grep` returned nothing.
3. **Look at the whole artefact, not a crop.** The render preview is a crop.
4. **Never select on `genres` or `tags`.** They come from an uploader; the Library's genre
   filters held no songs at all until this session.

If a correction cannot be made mechanical, say so in `docs/pending-review.md` rather than
promising to remember it.

---

## 5. What "done" looks like

`npx tsc -b`, `npm run lint`, `python3 tools/content/build.py --offline`, `validate.py`,
`ladder_report.py` when rung contents change, `npx vitest run`, the affected Playwright
specs one at a time on port 4173, and `render_check.py` with every new family **looked
at**. Report as `00-invariants` §5 asks: the judgement first, then done / not done or
blocked / follow-ups / questions / files touched. Add one entry per chunk to
`docs/pending-review.md`, including the faults you introduce and catch.
