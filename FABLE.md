# FABLE.md: the objective and how work runs (rewritten 2026-10-09)

**Read this first, every session.** The owner's newest word wins. When it changes the plan, edit this file the same day and save the owner's words verbatim under `docs/inputs/`. Only the owner's actual words are attributed to the owner.

This branch (`claude/piano-rebuild`) starts minimal. The old project stays whole on `claude/piano-teaching-app-bo19td` (last commit `c8b33af6`); its contract of 2026-10-08 (the rules plan) is retired.

## 1. The objective

The owner, 2026-10-09 (verbatim):

> "My whole fucking plan was to not reinvent the entirety of piano pedagogy. Curriculums, syllabuses, and piano teaching materials are everywhere online. We don't need to identify every piece in the pdmx archive, I just wanted you to look up online which songs the internet recommended for which rungs the syllabus and Curriculums recommended, and then wed tie together the generated content and real piece excerpts together with the modes and genres for a good experience. You drifted waaaaaay out of scope"

The direction the owner relayed the same day is saved whole in `docs/inputs/2026-10-09.md`. In short: rebuild the educational design first, from established piano methods and graded syllabuses, with the old project as a source of candidates, not an authority; bring the app over last and adapt it to the new design.

## 2. The steps, in order

Each step is finished, checked by the owner's ChatGPT review, and given the owner's go before the next starts.

1. **Curriculum.** The overall progression, taken from established method books and graded syllabuses (for example Faber Piano Adventures, Alfred's, RCM, ABRSM, and a jazz or popular syllabus such as ABRSM Jazz or Trinity Rock & Pop; the exact sources are confirmed with the owner when the step starts). Compare their sequences: where they agree, where they differ, which differences matter for this app and its styles (classical, popular, jazz, improvisation and the rest). Adapt, do not reinvent. The old curriculum (`reference/old-curriculum.md`) is consulted as a candidate, not a starting constraint. The result is `curriculum.md`, the file that records what the curriculum is.
2. **Rungs.** The actual learning steps: prerequisites, activities and success criteria.
3. **Real music.** Pieces and excerpts placed from published sources (syllabus repertoire lists, method books, PSyllabus, teacher recommendations), including candidates from the old library. Adjust rungs if the music shows a problem.
4. **Exercises, generators and modes.** Decide what the accepted material requires, then reuse old machinery selectively or build what is missing.
5. **Lessons and videos.** Instruction built around the verified activities and music.
6. **Integrate the app.** Bring over the UI, MIDI, score rendering, playback, storage and other infrastructure the design needs, adapted to it rather than the reverse.

**Current step: 1, Curriculum: outline written (`curriculum.md`, 2026-10-09); waiting for the owner's ChatGPT review and the owner's go before step 2.** Working choices for this step:
- Sources: Faber Piano Adventures and Alfred's Basic Piano Library (the publishers' scope-and-sequence material) for the beginner levels; the RCM, ABRSM and Trinity piano syllabuses for the graded spine; publishers' level-correlation charts for aligning levels.
- Top level: ABRSM/Trinity Grade 8, RCM Level 10. Diplomas are out.
- Styles: a style line stays only where a published syllabus or progression for it is found, and goes only as high as that source has substance.
- Per source and level, extracted under fixed headings: reading range and clefs; keys; time signatures and rhythms; technique; hand coordination; dynamics, articulation and pedal; sight-reading; aural; style-specific skills. Each entry cites its source and level. Written theory away from the keyboard is out.
- Source extracts go in `docs/sources/`, one file per source; the comparison, the adapted progression and the old curriculum's keep/fix/fill/drop marks go in `curriculum.md`.
- Order: an RCM pilot (first levels) is checked by the orchestrator before the other sources are gathered.
- Done when every named source has a cited extract per level, the comparison is complete, and every old stage and track is marked; then the owner's ChatGPT review.

## 3. How work runs

- **Nothing moves to a new step without the owner's say-so**, and nothing outside the current step is started. Do not broaden the scope: no new frameworks, inventories, taxonomies, literature reviews or review bureaucracy (the owner, 2026-10-09: "don't get too ahead and start drastically broadening the scope again").
- **Established work first.** Curriculum and repertoire come from published pedagogy. Research is targeted: only where sources disagree, where something must be adapted to the app, or where a claim is unsupported.
- **The old project is a source of candidates, not an authority.** Read it from the old branch (`git show claude/piano-teaching-app-bo19td:<path>`). Useful paths: `content/curriculum/` (the old curriculum as app data), `content/scores/` (the old library), `app/` (the app), `tools/content/` (the content build and generators). A component is brought over individually, when an accepted educational element needs it, and is checked when it is brought over.
- **No runnable app is required before step 6.** Verify each stage with evidence fitting it: a curriculum claim names its source and level; a MusicXML excerpt can be checked for its intended content without the app. Investigate technical feasibility early only where it would change a teaching decision.
- **Our own code that judges music needs evidence** that its judgments are right on real scores, including examples built to fool it; a respected syllabus does not prove our code works.
- **Nothing is trusted unchecked;** every claim is labelled measured (by what) or a reading.
- **Agents:** never Fable agents. One agent per job, the cheapest capable. This machine has 15.7 GB of RAM: at most 3 worker processes per agent, and at most 2 heavy agents at once.
- **Tokens:** careful with tokens, never at the cost of quality.

## 4. Facts about the owner and the app

- The app is for the owner's own personal use.
- No one in this process hears music: anything that needs an ear stays unverified as music.
- Never teach anything wrong: no wrong note name, invented concept or false "this teaches X".
