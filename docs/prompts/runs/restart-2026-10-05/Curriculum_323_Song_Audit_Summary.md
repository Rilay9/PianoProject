# PianoProject — Full Current Curriculum Song Audit

## Scope and denominator

Audit authority: `claude/readable-scores@c1556d70`.

The current readable-score manifest contains:

- **425 / 425 curriculum song placements audited**
- **323 / 323 unique song IDs audited**
- 0 unaccounted manifest rows

The older repository audit reported 439 placements / 326 unique IDs at an earlier curriculum state. The difference is a real snapshot change: the current `MANIFEST.md` ends after the 425th placement row. This report therefore uses **323** as the current completion denominator.

## Method

This is a full **placement/teaching-use audit**, not a claim that ChatGPT independently reread all 323 MusicXML files note-by-note from scratch.

Evidence was layered:

1. Claude/Fable's existing direct readable-score corpus, extracted byte-for-byte from shipped `.mxl`;
2. Fable's detailed score reads where available;
3. independent re-reading of the actual lesson/task contract for all 71 rungs;
4. direct ChatGPT checks of disputed/high-value scores and several random samples;
5. one verdict for every current placement, with all placements aggregated into one row per unique song.

The key correction to Fable's earlier logic is that a score must literally contain a technique only when it is being used as a **demonstration of that technique**. If the lesson tells the learner to add/perform the technique, the score is judged as a **substrate** instead.

## Result

Unique-song verdicts:

- **KEEP:** 257
- **KEEP WITH ROLE CHANGE:** 51
- **KEEP ASSET, MOVE A PLACEMENT:** 9
- **KEEP AFTER FIX:** 4
- **REPAIR REQUIRED:** 2

Placement-level verdicts:

- **KEEP:** 357
- **KEEP_RECLASSIFY:** 53
- **MOVE:** 9
- **FIX_THEN_KEEP:** 4
- **REPLACE_OR_MOVE:** 1
- **REPLACE_FILE:** 1

## Repair-required songs

- **Happy Birthday to You** (`song.folk.happy-birthday`): Imported arrangement is much harder/inverted and contains a known A# spelling where B-flat is intended.
- **12 Bar Blues** (`song.classical.12-bar-blues.pdmx`): Direct read has 11 measures despite title '12 Bar Blues'; cannot serve as literal twelve-bar-form primary.

## Keep after a concrete fix

- **Hot Cross Buns** (`song.folk.hot-cross-buns`): No specific contradiction found between readable-score evidence and the lesson role. | Current early edition reportedly introduces eighth notes before the rung teaches them; retain tune but simplify/fix rhythm for primary use. | Appropriate familiar-material substrate for practice-method instruction.
- **Frère Jacques** (`song.folk.frere-jacques`): Position shift is explicitly taught, but the score reportedly introduces eighth notes before the lesson teaches them; fix/simplify rhythm.
- **Hot Cross Buns (left hand)** (`song.folk.hot-cross-buns.lh`): Left-hand transfer is pedagogically right, but the current edition carries the same premature eighth-note issue; fix rhythm.
- **Happy Birthday to You** (`song.folk.happy-birthday.simple`): Best literal simple block-chord model; visible G7/dominant label disagrees with sounding G-B-D triad and should be cleaned up or clearly explained. | No specific contradiction found between readable-score evidence and the lesson role. | Appropriate substrate for learner-applied technique taught elsewhere on the rung.

## Assets that should move out of at least one current placement

- **The Water Is Wide** (`song.folk.the-water-is-wide.pdmx`): 1.5 [MOVE/LATER_TRANSFER]
  - Direct read carries G-major, eighths, dotted rhythm and ties beyond the rung; useful music, wrong first steps/skips placement.
- **Danny Boy (Londonderry Air)** (`song.folk.danny-boy-c-major.pdmx`): 2.2 [MOVE/LATER_TRANSFER]
  - Real eighth-note density but very wide range and richer dotted rhythm; too broad for first eighths.
- **Was wollen wir trinken** (`song.folk.was-wollen-wir-trinken.pdmx`): 2.3 [MOVE/LATER_TRANSFER]
  - A-minor harmony, tuplets and later rhythms; not first C/F/G block-chord material.
- **Dark Eyes** (`song.folk.dark-eyes.pdmx`): 2.3 [MOVE/LATER_TRANSFER]
  - D-minor/chromatic/seventh harmony with ties/tuplets; far beyond first block chords.
- **Auld Lang Syne** (`song.folk.auld-lang-syne.pdmx`): 2.3 [MOVE/LATER_TRANSFER]
  - E-flat major lead sheet with later harmony and dotted rhythm; useful later, not first C/F/G.
- **Greensleeves** (`song.folk.greensleeves`): 2.4 [MOVE/LATER_TRANSFER]; 3.3 [KEEP/PRIMARY_OR_TRANSFER]; 4.3 [KEEP/PRIMARY_OR_TRANSFER]; chords-pop.5 [KEEP/PRIMARY_OR_TRANSFER]
  - Full imported arrangement has broad two-hand texture, chromaticism, pedal, multiple voices and later demands. | No specific contradiction found between readable-score evidence and the lesson role.
- **Ga je mee op zoek naar het Koningskind** (`song.folk.ga-je-mee-op-zoek-naar-het-koningskind.pdmx`): 2.4 [MOVE/LATER_TRANSFER]
  - Key change, dense chord symbols, many ties/eighths and later harmony make it unsuitable as beginner primary.
- **Careless Love** (`song.pop.careless-love-blues.pdmx`): 2.4 [MOVE/BLUES_TRANSFER]; blues.3 [KEEP/APPLICATION_SUBSTRATE]; blues.4 [KEEP_RECLASSIFY/HISTORICAL_TRANSFER]
  - D-major lead-sheet blues with later chord/rhythm burden; more natural in blues track. | Appropriate substrate for learner-applied technique taught elsewhere on the rung. | Authentic/useful blues repertoire, but not the clean generated/authored twelve-bar-form definition.
- **Ode to Joy (easy variation)** (`song.classical.beethoven-ode-to-joy.easy`): 2.5 [MOVE/STAGE4_TRANSFER]; 4.1 [KEEP/PRIMARY_OR_TRANSFER]; 4.4 [KEEP/PRIMARY_OR_TRANSFER]
  - Two-hand G-major arrangement with full LH triads/ties/accidentals; materially later than the rung. | No specific contradiction found between readable-score evidence and the lesson role.

## Important role/reclassification themes

There are **51** songs that remain useful but should not be presented as equivalent primary evidence everywhere they appear. The largest recurring classes are:

- **Transfer rather than primary:** authentic music that is too broad for first acquisition but useful immediately afterward.
- **Learner-applied substrate:** lead sheets/charts/tunes where the learner supplies comping, shells, power chords, clave, walking bass, reharmonization, transposition, improvisation, etc.
- **Stretch/project:** authentic advanced repertoire intentionally used as a destination rather than a controlled teaching definition.
- **Excerpt:** a coherent passage is a better teaching unit than the whole work.
- **Alternate edition / duplicate work:** useful edition choice, but should not inflate repertoire breadth.

## High-priority curriculum actions

1. Fix/replace **`song.classical.12-bar-blues.pdmx`**: the shipped file has 11 measures despite its title.
2. Repair or move the **imported Happy Birthday** on 2.3; it is too advanced for the first-chord role and contains the known A# / B-flat notation problem.
3. Fix premature-eighth-note versions of **Hot Cross Buns** / **Hot Cross Buns LH** / **Frère Jacques** if those current reads remain unchanged.
4. Move later-demand-heavy early pieces out of primary placement: Water Is Wide, Danny Boy, Was wollen wir trinken, Dark Eyes, Auld Lang Syne, full imported Greensleeves, Ga je mee…, Careless Love on 2.4, and the imported Ode-to-Joy easy variation on 2.5.
5. Keep `jazz.4/5/6`, `latin`, `rock.4`, `blues.5`, `chords-pop.7/8/9`, etc. as learner-application workflows; do **not** reject their lead sheets/finished arrangements merely because the learner-applied technique is not pre-written.
6. Fix the **`chords-pop.9` finder contract**, not the lesson: the lesson intentionally uses finished arrangements as reverse-engineering models.
7. Do not count alternative editions (e.g. Petzold alternative, Pine Apple Rag Mutopia) as separate musical breadth without a distinct learner role.

## Files

- `Curriculum_323_Song_Audit.csv` — one row per current unique song, all placements aggregated.
- `Curriculum_425_Placement_Audit.csv` — one row per current curriculum placement; use this when implementing moves/fixes.
