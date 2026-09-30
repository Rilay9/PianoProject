### Entry 177 — G101 — the Library title takes a third line at phone width where two cut its identity

**Base.** `827289d0` (`git log -1 --format=%h` in the worktree, as briefed). A fast-path product correction of G85a's adversary under the reviewer's ruling (`docs/review/responses/questions-eebafb5e.md` §G101), widened during the build by the coordinator's addition: measure the longest titles and every group of titles that differ only in their endings, then choose the smallest rule that keeps every such ending whole. **The landed rule is not three lines:** in portrait, a Library title wraps to every line it needs, and a word longer than the room breaks, the Skills pattern (U90). This deviates from the ruling's first point, with the measurement below. The reviewer rules on it at the landing. The heading is kept as briefed.

## Judgement

What a learner sees, at 342 × 740 (observed: pictures in `docs/prompts/pictures/g101/`, and measurements of every Library row, 2,092 of them, in each condition). "This face" means the app's own font stack as it draws here: CDP names Segoe UI. "The wide face" is `plan.spec.ts`'s Verdana stand-in for the runner (U90). It reproduces CI's red here: at 100 % with the committed two-line clamp, it cuts *(hands together)* as CI did. It is a stand-in, and the runner's own face is not measured.

- **100 %, this face.** Before and after look the same for the four *Twinkle* rows: each is two lines, *Twinkle, Twinkle, Little / Star (hands together)*, and each row is 92 px (`before-` and `after-twinkle-100-stack-342x740.png`). Across the whole list, 295 titles were cut before and none are cut after. 287 rows grow by one line and 7 by more; *Oh When the Saints Go Marching In (hands alternating)* is one of the rows that grows.
- **115 %, this face.** Before: *Twinkle, Twinkle, / Little Star (hands…* and *… / Little Star (in F…*. The words that tell the rows apart are gone, and a learner cannot tell *hands together* from any other version. Across the list, 722 titles were cut. After: *… (hands / together)* and *… (in F / major)* are whole, and those two rows grow from 104 to 128 px. The other two rows are unchanged, and no title is cut (`before-`/`after-twinkle-115-stack`).
  - The K. 545 pair under three lines, as first ruled, still reads *Piano Sonata No. / 16 in C, K. 545, I. / Allegro (alternati…* (`three-k545-115-stack`). After, it reads *Allegro (alternative / edition)* (`after-k545-115-stack`).
- **The wide face.** Before, at 100 %, *Twinkle … (hands…* is cut, as on CI. Three lines would fix 100 %, but at 115 % *(hands together)* needs a fourth line and is still cut (`three-twinkle-115-wide`). After, it is whole in four lines, in a 152 px row (`after-twinkle-115-wide`). *Study in C major in 2/4 — the hands changing together, held bass* is whole in six lines (`after-study-2-4-115-wide`).
- **The cost.** A row grows only where its title needs the room. The tallest row the list draws is the 122-character PDMX title *This Country of Mine (Extended Mix …) ((featuring …)*. It needs eight lines at 115 % here (a 248 px row, a third of the screen) and ten on the wide face (295 px). The next tallest is five lines (176 px) here. The row still carries *Details* and ⋯ at full size, centred against the words (`after-longest-115-stack`).
- **Not looked at.** Sideways (the rule is portrait only, and a sideways title is still one line with an ellipsis). The dark theme. Other widths. Imported rows: none exist in a fresh store, and the rule reaches them too, at the full row width. The owner's phone's face (Android; not measured here). The runner's face (inferred wider; the new printed line names it on the next red). Nothing here is music, so nothing was heard.

## The mechanism and the discriminating test

**Mechanism (observed here).** Upright, a catalogue row keeps its words beside *Details* and ⋯. The title column is the 310 px row less the actions: 164 px at 100 % beside 108 px of actions, and 157 px at 115 %, because the buttons' text and padding grow with the root font and the actions grow to 115 px. A title's words grow with the text size and with the face, and the clamp capped what showed at two lines. *Twinkle, Twinkle, Little Star (hands together)* is 354 px set on one line at 115 % here. In a 157 px column that is three lines, and the clamp hid the third.

**Alternatives for CI's red at 100 %:** a wider face on the runner (wider words, the same column); a scrollbar narrowing the row; or wider actions (a narrower column). Here the wide face alone reproduces the red, with the row still 310 px as on this face, so nothing outside the row narrowed it. Its actions are 113 px, because *Details* is wider in that face too, and the words are wider. That supports the face cause on this machine; it does not prove the runner's cause. **The discriminating test on the runner** is the printed box. Every title check in the G85a cases now prints the client and scroll sizes, the line count, the words' width set on one line in the title's font, the row's, title column's and actions' widths, the viewport and the page's layout width, the root text size, and the face the browser drew (CDP `CSS.getPlatformFontsForNode`, as U90's probe read it). A font cause shows as the same column with wider words; a scrollbar or wider actions show as the same words in a narrower column.

**Why no clamp, not three (the deviation, measured).** 1,288 of the 2,092 titles differ from another title only in their endings (268 groups, `siblings-groups.json`, rule in `scripts-siblings.py`: a shared word prefix of at least two words and at least half the shorter title). The most lines any of them needs:

| | 100 % | 115 % |
| --- | --- | --- |
| this face | 4 (1 title) | 4 (39 titles) |
| the wide face | 4 (30) | 6 (1), 5 (24) |

So three lines, as first ruled, still cut sibling endings on this face at 115 %: *Oh When the Saints Go Marching In (hands alternating)*, *Piano Sonata No. 16 in C, K. 545, I. Allegro (alternative edition)*, *Study in C major in 2/4 — the hands changing together, held bass*, and 36 more (`summary-three.txt`). A clamp at this face's maximum, four, would still cut 25 of them on the wide face at 115 %.

Any count is a count for one face at one text size. The runner's face is inferred wider, and the owner's phone's face and any size above 115 % are unmeasured. With no clamp, the row is still bounded, by the catalogue's own titles: eight lines at most here at 115 %, and ten on the wide face. Imports get the whole row width. The Skills list made the same choice for the same fault on the same runner (U90).

The break for over-long words comes with that pattern. It removes the one title cut sideways on this face, *Go_Tell_It_On_the_Mountain* (198 px of words in a 164 px column at 100 %). On the wide face at 115 % it removes four: that title, *Morgenstimmung*, *Passacaglia - Handel/Halvorsen (Piano Solo)* and *The Chrysanthemum*. Each now wraps inside a word rather than being cut.

**The change.**
- `app/src/style.css`, in the portrait media query:
  - The shared `#folder-list .list-row__title, #library-list .list-row__title` rule is split. `#folder-list .list-row__title` keeps the two-line clamp as it was.
  - `#library-list .list-row__title` becomes `white-space: normal; text-overflow: clip; overflow-wrap: break-word`, with its reason written above it. The block comment's sentence on two lines now says the folder has two and the library every line it needs.
  - Other consumers of the rule: in portrait, `#library-list .list-row__title` matches only the list's rows. Details, *Open as…* and the project sheet draw their rows in sheets outside `#library-list`, and the empty state and *Show more* are not list rows. The folder's rows keep the old rule to the byte. Today, Progress and Skills have their own rules, untouched, and U63's Today rules are unchanged.
- `app/tests/e2e/library.spec.ts`, the G85 describe (342 × 740):
  - The G85a case's title measure moved to one helper, `titleBox`. The case keeps every assertion, and its three `clipped` checks and two width checks now print the box.
  - A sibling case runs at 115 % text, with the root font scaled as `doors.spec.ts` scales it, asserted applied. Before any project, it checks *Twinkle … (hands together)* (searched as the case above searches) and then three titles by their own words: *… (in F major)*, *Oh When the Saints Go Marching In (hands alternating)* and *Study in C major in 2/4 — the hands changing together, held bass*. Each must be the catalogue's title, uncut, as a soft check, so every cut title is printed in one run.
  - The case asserts nothing relative, and no number measured here.

## Done

1. **The CSS at the smallest boundary** (above), the Folder at two lines. Technical: done. Pedagogical: not applicable. No music is claimed.
2. **The spec.** The 100 % case keeps its assertions and prints the box. The 115 % sibling runs the same title checks before any project on the adversary and three measured siblings. The rest of the case is as it was.
3. **Red first, green after** (below). The 115 % case is red on the committed CSS for all four titles and green on this tree. The 100 % case is green on both.
4. **Mutants** (below). The Library title clamped at two again is caught (four titles). Clamped at three, the first ruling, is caught (the Saints and the Study).
5. **The Folder spec** `folder.readable.spec.ts` is green, 4 of 4.
6. **Runs.** `npx tsc -b` and `npm run lint` exit 0 (with this lane's config and probe moved out of `app/`). The whole `library.spec.ts` and `folder.readable.spec.ts` ran with `--workers=2` on port 4617: 21 passed. The unit suite (below). `checks_for_paths.py` on the touched paths: the map asks for record-mirrors, the content test, tsc, lint, unit, build-app and the whole e2e suite. The whole e2e suite is not run here (Not done 1).
7. **The port.** `app/playwright.config.ts` fixes `baseURL` and `webServer` at 4173 and names the fixture storage state for that origin. The lane config (`scripts-playwright.g101-4617.config.ts`, X3e's pattern) spreads the base config and overrides these:
   - `baseURL` is `http://localhost:4617/PianoProject/`.
   - `webServer` is `npx vite preview --port 4617 --strictPort` with no reuse.
   - The storage state is the same two flags for port 4617's origin.
   - Two workers, and `outputDir` under `build/g101/`.

   `npm run build:app` ran before Playwright, never under it. Each build that was judged was kept under `build/g101/` (`dist-before`, `dist-after` = three lines, `dist-final`) and copied into `app/dist` before its run. The copies were deleted at the end (`cleanup.txt`).
8. **Looked at the row.** The Twinkle rows at 100 % and 115 %, before, under three lines and after, on this face and the wide face. The same for the K. 545 pair, the *Study in C major in 2/4* group and the longest title: 48 pictures. Every Library row was measured in each condition (`<phase>-facts-<size>-<face>.json`, summarised in `summary-<phase>.txt`).
9. **The doc rows** (below): `docs/08`'s line for `library.spec.ts`, and a line for `docs/04` §0's exception, as the coordinator asked.

## Not done

1. **The whole e2e suite** (the map's `e2e` for `app/src/style.css`). Not run here: the brief names the two specs, and CI is the broad run. Specs that draw the Library at other sizes or in pictures (`wide.spec.ts`'s 115 % gutters, `doors.spec.ts`, `sweeps.spec.ts`) were not run on this CSS. A grep of `app/tests/e2e` and `app/tests/tour` for `library-list` beside a height, box or line measure found only `folder.add.spec.ts`'s row count.
2. **The record-mirror generator** was run only as `--check` (fresh, exit 0). Its writing form rewrites tracked mirrors, which is the orchestrator's.
3. **Sideways, dark, other widths, imports** were not pictured (Judgement).
4. **K. 545 is not pinned in the case.** It was measured and pictured (4 lines at 115 % here, 5 on the wide face), but it is a fetched MuseTrainer edition. A content build without the fetch would fail the case on a missing id, not on its title. The Saints title needs the same lines, is written here, and is pinned instead.

## Deviations

1. **No clamp, not three lines** (the reason and the table are under the mechanism). This came from the coordinator's addition. It keeps the ruling's other points: the Folder stays at two, the actions are not narrowed, nothing is renamed, the assertion is not relative, and the 115 % case prints the box.
2. **`overflow-wrap: break-word`** comes with the Skills pattern. It changes one title on this face and four on the wide face at 115 % (above).
3. **Two lines printed beyond the listed measurements:** the words' one-line width and the face drawn. Together they name a font cause without inference.
4. **The words' width is measured by an off-flow probe.** The first version summed the title's own line boxes. Under a clamp that overstated the words: *K. 545 … (alternative edition)* read 489 px under two lines and 624 px under three for the same text. The probe reads 504 px under both.
5. **The mandated heading** says "takes a third line", but the landed rule gives every line needed. The heading is kept as briefed, and the first paragraph says so.

## Follow-ups (recorded, classified, not fixed)

1. **Sideways, a Library title is still one line with an ellipsis** (the base `.list-row__title`; the portrait rule does not reach it). Sibling endings sideways are not measured. *Observation*, attached to G101/G85a's truth (material identity on the Library row); measure before it earns a row.
2. **`Go_Tell_It_On_the_Mountain`** (`song.folk.go-tell-it-on-the-mountain.pdmx`) is a catalogue title with underscores for spaces. It now wraps inside the word rather than being cut, but it still reads as a file name. *Observation*, a catalogue fact (P3).
3. **The 122-character PDMX title** doubles a parenthesis (*((featuring Britain Japan Singapore and Brunei)*) and is the tallest row. *Observation*, a catalogue fact (P3).
4. **Nothing pins the folder's two-line clamp.** `folder.readable.spec.ts` measures whether a title needs more than two lines, which does not depend on the clamp. *Observation* (a test nicety).
5. **Two unit claims fail on a CRLF checkout** (`lessonClaimsAboutApp.test.ts` 4.7 and blues.3), because they search source text for `\n`. 4.7 passes on the LF form of this tree's CSS. blues.3 reads `ScoreScreen.ts`, which fails on HEAD's CSS too. CI checks out LF. *Observation*, a recurring local false red in every Windows worktree (maintainability, P3).

## Questions

1. **For the reviewer, at the landing: is no clamp (the Skills pattern) the Library rule, in place of three lines?** Measured: sibling endings need four lines here at 115 % and six on the wide face, and three still cuts 39 here at 115 %. Nothing is cut after. The tallest row is the 122-character title at eight lines (a third of the screen at 115 %). The alternative is a clamp at a measured count: four keeps this face whole and cuts 25 sibling endings on the wide face at 115 %.

## Red and green

- **Red, the committed CSS** (`red-before.txt`, `build/g101/dist-before`). The 100 % case passes. The 115 % case fails on four titles, each with its box, for example:
  > “Twinkle, Twinkle, Little Star (hands together)” is cut at 115 % text before any project: title client 157×48, scroll 157×72; 3 lines of 23.92px; words 354.1 px on one line; row 310.0, title column 157.3, actions 114.8; viewport 342×740 (layout width 342); text 18.4px (115%); drawn in Segoe UI

  The same for *(in F major)* (3 lines, 310.9 px), *the Saints (hands alternating)* (4 lines, 449.9 px) and *Study in C major in 2/4 …* (4 lines, 535.0 px).
- **Green, this tree** (`specs-final.txt`, `build/g101/dist-final`). Both G85a cases pass, and the whole two specs pass, 21 of 21.

## Mutants

- **m1, the Library title clamped at two again** on the final CSS (`mutant-two.diff`, `scripts-mutant-two.py`): **caught**. The 115 % case is red on all four titles with the same boxes as the committed CSS; the 100 % case passes (`mutant-two.txt`).
- **m2, clamped at three, the first ruling** (`mutant-three.diff` against the final CSS, built as `dist-after`): **caught**. The 115 % case is red on *the Saints* and *the Study* (client 157×72, scroll 157×96, 4 lines). Both *Twinkle* rows pass (`mutant-three.txt`).
- **Not caught here: a clamp at four.** On this face no sibling needs a fifth line, so a clamp at four is indistinguishable from none. The wide face separates them (the Study needs six), but it is not in the case (Questions 1).

## Exit codes (each capture ends with its exit)

- `npm ci`: 0 (`npm-ci.log`).
- `npm run build:app`: 0 for the committed CSS, three lines, the final CSS and m1 (logs under `build/g101/`, not kept).
- The red, `red-before.txt`: 1, expected.
- m1, `mutant-two.txt`: 1, expected. m2, `mutant-three.txt`: 1, expected.
- The two specs on this tree, `specs-final.txt`: 0.
- The probes, `pictures-before.txt`, `pictures-three.txt` and `pictures-after.txt`: 0 each.
- `npx tsc -b`, `tsc.txt`: 0. `npm run lint`, `lint.txt`: 0.
- `python tools/docs/checks_for_paths.py …`, `checks-for-paths.txt`: 0. `record_mirrors.py --check`: 0. The content test `test_record_mirrors`: 0 (36 tests).
- The unit suite (`npx vitest run`), on the three-line tree (`unit-full-three-line.txt`): 1, with 6 failed of 7,406. None is this change. The five failing files, run alone on HEAD's CSS (`unit-failed-files-head-css.txt`) and on the three-line CSS (`unit-failed-files-three-line-css.txt`), leave:
  - `midiParity`: no reference under `build/midi-parity`, which CI writes.
  - `taughtByAncestry`: no `build/rung-claims.json`, which the content build writes.
  - `lessonClaimsAboutApp` blues.3: CRLF, failing on HEAD's CSS too.
  - `lessonClaimsAboutApp` 4.7: CRLF only. It passes on the LF form of the CSS (`unit-lessonclaims-three-line-lf.txt`, `unit-lessonclaims-final-lf.txt`).

  `expectedNote` (a 5 s timeout under the full run's load) and `tempoSoundAgainstMark` pass alone.
- On the final CSS, the three unit files that read `style.css` (`unit-css-readers-final.txt`): 1, with only 4.7 and blues.3 failing (above).
- The full suite on the final tree (`unit-full-final.txt`): 1, with 23 failed in 16 files. The machine was loaded: workers took 6.1 s to start, against 2.3 s in the first run, and ten tests hit the 5 s timeout. The failures are the four tests above, in three files, plus 19 tests in 13 other files. Those 13 files pass alone on the same tree, 131 of 131 (`unit-final-failed-alone.txt`, exit 0), and none of them reads `style.css`.

## Unverified

- **The runner's face.** It is inferred wider from CI's red at 100 % and the wide face reproducing it here. Not measured. The next CI run prints it on any red, or passes.
- **The owner's phone.** Android draws `system-ui` in its own face, not measured here. The rule has no count, so it should cut no title in any face. That is inferred from the rule and observed in the four conditions measured. The row heights there are not measured.
- **Rows per screenful** after the change, and the learner's scanning of taller rows, are not measured.
- **Sizes above 115 %** are not measured. The rule has no count to exceed.

## Files

- `app/src/style.css`: the portrait title rule split (Folder two lines, Library unclamped with break-word), with its reason.
- `app/tests/e2e/library.spec.ts`: `titleBox` with the printed box; the G85a case printing it; the 115 % sibling case.
- `docs/prompts/runs/G101/`: this entry and the captures named above. Also:
  - the scripts `scripts-playwright.g101-4617.config.ts`, `scripts-zz-g101-pictures.spec.ts`, `scripts-siblings.py`, `scripts-summarise.py` and `scripts-mutant-two.py`. The probe reads `build/g101/siblings.json`, which `scripts-siblings.py` writes;
  - `siblings-groups.json`, the 268 groups by title;
  - `ci-eebafb5e-g85a.txt`, CI's red for this case at 100 %;
  - `content-copy.txt` and `cleanup.txt`;
  - `scripts-sanitise.py`, which replaced machine paths in the captures with `<worktree>`, `<main checkout>`, `<temp>` and `<home>` (G85a's sanitiser; a second run changes nothing).
- `docs/prompts/pictures/g101/`: `<before|three|after>-<twinkle|k545|study-2-4|longest>-<100|115>-<stack|wide>-342x740.png` (48) and `<phase>-facts-<size>-<face>.json` (12). The list pictures of the wide face at 115 % run under the tab bar at the bottom edge; that is the page's bar over the list, not the row.

## Doc rows

**`docs/08-test-map.md`, the file list, `library.spec.ts`** (after whatever Entry 160's pending row leaves there) gains:

> ; the G85a adversary at 115 % text too, before any project: *Twinkle … (hands together)* and three titles that differ from a sibling only in their endings (*… (in F major)*, *Oh When the Saints Go Marching In (hands alternating)*, *Study in C major in 2/4 — the hands changing together, held bass*) whole at 342 px, each cut one printed; every title check in the G85a cases prints the title's box: client and scroll sizes, lines, the words' one-line width, the row's, title column's and actions' widths, the viewport and layout width, the text size and the face drawn (G101)

**`docs/04-ui-spec.md` §0, the exception for the two lists of archive titles** (after the paragraph ending *…wrap rather than being cut, whatever the font (§3a).*), a new line:

> And the **Library's titles are never cut, upright** (G101, 2026-09-30; the first ruling said three lines, `responses/questions-eebafb5e.md`, and the reviewer rules on this at the landing). A catalogue row keeps its words beside *Details* and `⋯`, about half of a 342 px row, and a title there is the piece's identity. Many titles differ from a sibling only in their endings: *Twinkle, Twinkle, Little Star* with *(hands together)* or *(in F major)*, and *K. 545, I. Allegro* with *(alternative edition)*. Two lines cut those endings at 115 % text. Any fixed count is sized to one face at one text size: four lines at 115 % on the development machine's face, six on a wider one. So the title wraps to the lines it needs, and a word longer than the room breaks, as on Skills (U90). A row grows only where its title needs the room; the longest catalogue title takes eight lines at 115 % on that face. The score folder keeps two.
