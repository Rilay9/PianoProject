### Entry 204 — U119a — the sideways bar keeps its meaning when it yields

Lane U119a, the fast-path required change on U119 (`docs/review/responses/fa4563d1.md`, "Required change — protect semantic minimums before the safety clip" and Question 2). Brief: `docs/prompts/tasks/U119a-the-sideways-bar-keeps-its-meaning-when-it-yields.md`; second read `docs/review/second-reads/0d2c3472.md` item 1. Base: `0d2c3472`. Closes U119.

## Judgement

**Unverified on a device** (no phone; this Chromium, with a face forced onto every element for the wider face: Verdana here, DejaVu Sans where Verdana is absent; the app's own face is this machine's system stack). **Unverified as copy**: no sentence's wording changes. **Pedagogical verdict: not applicable**: layout only; nothing taught, judged or recorded changes. Nothing was heard. Every width and string below is this machine's, measured on its faces; another face moves which cells need what.

What a learner meets sideways, in a Wait run they have paused, with the bar shown (pictures under `docs/prompts/pictures/u119a/`):

- **568 × 320, 115 % text, wider face, Hot Cross Buns** (the reviewer's first adversary). Before: *← Back · bar 1* and nothing after it; *bar 1 / 4* was cut to *bar 1*, and the paused line was not drawn at all. After: *← Back · bar 1 / 4 · Paused…*, then ▶, `Hear it`, the mode, the tempo and `⋯`. Hands is behind `⋯`, where it is a row of the sheet and works (a real tap on `L` there chooses it). `paused-568x320-wider-face-115-before.png`, `…-after.png`.
- **A three-digit bar** (Moonlight III, 201 bars, a real catalogued piece). At 568 × 320 with 115 % text, before: on the wider face the location read *bar* and nothing more; on the app's face *bar 1 / 201* ended within half a pixel of the cut and *bar 201 / 201* would have been cut. At 640 × 360, 115 %, wider face, *bar 1 / 201* fitted but *bar 201 / 201* would not have: later in the piece the number would have been cut. After, on all three: Hands behind `⋯`, the location whole, and the piece's widest location, *bar 201 / 201*, whole when written into the bar by hand. The paused line reads *Pau…* (568, wider), *Paused — …* (568, app's face), *Paused — ▶ …* (640, wider). `paused-640x360-wider-face-115-moonlight-before.png`, `…-after.png`.
- **The constrained paused line.** At 667 × 375 on the wider face, before: *Paused — ▶ to carry o*, cut flush through the *o*. After: *Paused — ▶ to carr…*. At 640 × 360 with 115 % on the wider face, before: *Paus* and part of the *e*, which reads as the word *Pause*; after: *Pa…*. On every one of the 64 paused cells probed, the paused line now ends with its own ellipsis; none is cut flush (list under *Truncated strings*).
- **The cut is at a character, not a word.** CSS `text-overflow: ellipsis` gives *P…*, *Pa…*, *Pau…*, *Paus…*, *Paused — ▶ to c…*, *… or St…*. At the narrowest status box measured (568 × 320, 115 %, the app's own face, the box narrower than one letter and the ellipsis) Chromium draws *P* and an ellipsis whose last dot is clipped: *P..* (`paused-568x320-115-after-narrowest-status.png`). Whether a character-boundary ellipsis meets "visibly read as truncated" is Question 1.
- **A refusal at 568 × 320 with 115 % text on the wider face.** Before (U119's tree), the first render while the refusal stood (the tempo sheet opened and closed, or a resize) sent Hands, and then `Hear it`, behind `⋯` while the sentence said *Sound did not start — tap Hear it again*. Of the 23 refusal cells probed that way, Hands went in 19 and `Hear it` with it in 14, including 667 × 375 on the app's own face for Moonlight III. After: the controls the bar keeps are decided by the left group's minimum alone, before and after such a render; `Hear it` stays.
- **Where nothing was wrong, nothing moved.** Over the 64 paused cells probed (568 × 320 to 844 × 390, both faces, both text sizes, both pieces), the piece's name kept the same width and text in every cell, no control moved where the same controls stayed, and a status line that was whole, or cut by its own `28vw` cap, reads the same. Hands left the bar in four cells (568 × 320 at 115 %: wider face for both pieces, the app's face for Moonlight III; 640 × 360 at 115 % on the wider face for Moonlight III). **`Hear it` left the bar in no cell measured**: 328 bar states from the probe, on a build byte-identical to the final one (64 paused cells at rest and paused, 40 refusal cells in five states), which include every cell the committed rows run.

What still fails, found here and not this lane's (Follow-up 1): at 568 × 320, U105d's refusal sentence is squeezed into a column a few pixels wide, and the bar it grows is taller than the window. On the app's own face with 115 % text (Hot Cross Buns), after ▶ is refused, ▶ is drawn above the top of the screen and the sentence starts far above it; on the wider face (Moonlight III) the sentence starts above the top. The same on U119's tree. The narrowest case is kept red in the run folder, not in the suite (Question 2).

## The mechanisms, the discriminating tests, before and after

**1. The left group's minimum (`ScoreScreen.ts`, `leftGroupIsCut`, joined to `fitBarControls`'s loop).**

- *Cause*, confirmed at the lines and by the probe: `fitBarControls` moved `OVERFLOW_ORDER` controls only while `barIsOverfull` was true, and sideways that never happens (the row cannot wrap; ▶ and `⋯` never shrink). A left group squeezed below Back plus `bar n / m` was clipped instead, and nothing left the bar for it.
- *Change*: one predicate, sideways only (the group is `display: none` upright, so it returns false there). It writes the piece's widest location, `bar m / m` (m the last printed bar, so as many digits as the location will ever have), into the bar's copy of `bar n / m`, reads whether its right edge is at or inside the group's right edge, and puts the text back in the same task. Back and `bar n / m` keep their widths; the name and the status line give theirs up first, so this one comparison covers both. Priced at `bar m / m`, not the current bar, so the controls stay put for the whole piece (the orchestrator's decision). In the loop: `if (!barIsOverfull() && !leftGroupIsCut()) return;`. The order is unchanged: Hands, then `Hear it`.
- *Discriminating test*: every sideways paused row, and the new refusal row, asserts that Hands is off the bar exactly when the minimum would fail with Hands and `Hear it` both on it, and `Hear it` off exactly when it would fail with Hands off and it on. Each control off the bar is put back for a moment, the minimum read, and the bar restored (`fitsWithHands`, `fitsWithHear` in `barLeftAgainstControls`). So the row proves the bar decided, on whatever face runs it, not that the cell happened to have room. Plus `widestWhole`: `bar m / m` whole when written by hand.
- *Before and after, measured the same way*: the probe's tables (`probe-base-paused-table.txt`, `probe-fix2-paused-table.txt`, `compare-base-fix2-paused.txt`), and the committed rows red on U119's build (`browser-red-base-failures.txt`).
- *Red line*, 568 × 320 at 115 % on the wider face, U119's build: "the bar number is cut (“bar 1 / 4”)", "the piece’s widest bar number would be cut (“bar 4 / 4”)", "Hands stayed on the bar although Back and the bar number do not fit beside it".

**2. The status line's own truncation (`style.css`, inside the landscape block U119 owns).**

- *Cause*: sideways the status mirror was `flex: none`, held at its own width (or its `28vw` cap), so the group's clip cut it flush at the group's edge, part-way through a letter. Its own `text-overflow: ellipsis` sat at the cap, past the clip.
- *Change*: `.screen--score .score-bar__left > .score-bar__status { flex: 0 1 auto; min-width: 0; }`, so its box ends where the group's room does and its own ellipsis draws the cut. And `body:not(:has([data-sound-refused])) .screen--score .score-bar__left > .score-bar__title { flex-shrink: 1000000; }`, so the name still yields all of its room before the status line gives any. Without the weight, two items shrink in proportion; with it, the status line's share while the name has room is far below a layout unit. The weight is off while a refusal stands, so U105d's rule (the sentence and the name sharing in proportion) applies exactly as before; that rule is untouched.
- *Discriminating tests*, in every paused row: `statusOwnCut` (the status line's box ends inside the group, and where its text overflows it cuts with `text-overflow: ellipsis`, `nowrap`), and `titleFirst` (while the status line is narrower than its own width, the name has no width left).
- *Red line*, 667 × 375 on the wider face, U119's build: "the status line is cut flush by the group, not by its own ellipsis (its box ends at 325.25, the group at 280.25)".
- *The name where nothing was wrong*: across the 64 probed cells the name's width and visible text are the same as on U119's tree (`compare-base-fix2-paused.txt`: "Title moved (width or visible text): 0"). The brief's 740 × 342 mutant is killed by `titleFirst`: "the status line gave room while the piece’s name still had 44.453125 px".

**3. The row test counts the controls' rows (`ScoreScreen.ts`, `barIsOverfull`; acceptance 5b, the second read's hazard).**

- *Cause*, measured, not only read: while U105d's refusal stands, its sentence wraps in the mirror and the group grows taller than the controls. Under `align-items: center` the group's top is not theirs, so the row count read two rows. Any render then (the tempo sheet, a resize) sent Hands and `Hear it` behind `⋯` (`probe-base2-refused-after-tempo-table.txt`, `…-after-resize-table.txt`).
- *Change*: the row count leaves out the left group (`k !== barLeft`). Upright the group is not drawn, so nothing changes there; sideways the controls cannot wrap.
- *Stop check*: the change moves nothing in any other cell. The 64 paused cells give identical tables with and without it (`compare-fix1-fix2-paused.txt`: every category 0).
- *Discriminating test*: the new refusal row at 568 × 320 (115 %, wider face) renders while the refusal stands and asserts the same mechanism conditionals before and after, and the same controls on the bar.
- *Red line*, U119's build: "after the render: Hear it is off the bar, and Back and the bar number fit beside it"; "the render while the refusal stood changed which controls are on the bar".

## Premises found wrong, and the path taken

- **Mutant 4's oracle** ("the title's own text is unchanged (still the full piece name, not `Hot C…`)" at 740 × 342 on the wider face). On U119's tree the name is not whole there. It has given its room to the status line's `28vw`, so it shows only an ellipsis (probe: `…`, about the width of one). So the row asserts the yielding order (`titleFirst`: while the status line gives room, the name has none). That kills the mutant at that cell, and in 20 others.
- **Mutant 2's example cell** (780 × 360 at 100 %). The over-triggering mutant does not fire there, because the name fits beside Back and the bar number anyway. It is killed at 12 rows instead (table below).
- **The second read's hazard**, read in code, is real and wider than a three-line sentence. It fires at any render while a refusal has made the group taller than the controls. On U119's tree that was 19 of the 23 refusal cells probed with a render, including 740 × 342 and 667 × 375 at 100 % text.
- **The premises at the lines** (brief premises 1–9) held as written at `0d2c3472`.

## Truncated strings the grid produced

Final build, a paused Wait run, the paused line *Paused — ▶ to carry on, or Start again in ⋯ to go back to the beginning.* All 64 probed cells end with an ellipsis; none is cut flush. Read from glyph positions (`scripts-probe.spec.ts`, `visible()`), checked against the bar pictures at seven cells; the one disagreement is the narrowest box, where the computed string is `…` and the picture shows *P* and a clipped ellipsis. Cells are width × height, text size, face (stack = the app's own), piece (hcb = Hot Cross Buns, moon = Moonlight III):

- `…` (drawn *P..*): 568x320 t115 stack hcb
- `P…`: 568x320 t100 wider moon
- `Pa…`: 640x360 t115 wider hcb; 667x375 t115 wider moon
- `Pau…`: 568x320 t115 wider moon
- `Paus…`: 568x320 t100 wider hcb
- `Paused…`: 568x320 t115 wider hcb; 667x375 t115 wider hcb
- `Paused …`: 640x360 t115 stack moon; 700x350 t115 wider moon
- `Paused —…`: 568x320 t100 stack moon
- `Paused — …`: 568x320 t115 stack moon; 640x360 t115 stack hcb; 667x375 t115 stack moon; 700x350 t115 wider hcb; 720x360 t115 wider moon
- `Paused — ▶…`: 640x360 t100 wider moon
- `Paused — ▶ …`: 568x320 t100 stack hcb; 640x360 t115 wider moon; 740x342 t115 wider moon
- `Paused — ▶ t…`: 720x360 t115 wider hcb
- `Paused — ▶ to …`: 640x360 t100 wider hcb; 667x375 t115 stack hcb
- `Paused — ▶ to c…`: 667x375 t100 wider moon; 700x350 t115 stack moon; 740x342 t115 wider hcb
- `Paused — ▶ to ca…`: 780x360 t115 wider moon
- `Paused — ▶ to carr…`: 667x375 t100 wider hcb; 720x360 t115 stack moon
- `Paused — ▶ to carry…`: 700x350 t115 stack hcb
- `Paused — ▶ to carry …`: 700x350 t100 wider moon; 780x360 t115 wider hcb
- `Paused — ▶ to carry o…`: 640x360 t100 stack moon; 740x342 t115 stack moon
- `Paused — ▶ to carry on…`: 720x360 t115 stack hcb
- `Paused — ▶ to carry on,…`: 720x360 t100 wider moon
- `Paused — ▶ to carry on, …`: 700x350 t100 wider hcb
- `Paused — ▶ to carry on, o…`: 640x360 t100 stack hcb; 844x390 t115 wider moon
- `Paused — ▶ to carry on, or…`: 667x375 t100 stack moon; 740x342 t100 wider moon; 740x342 t115 stack hcb
- `Paused — ▶ to carry on, or …`: 720x360 t100 wider hcb
- `Paused — ▶ to carry on, or St…`: 740x342 t100 wider hcb; 780x360 t115 stack moon; 844x390 t115 wider hcb
- `Paused — ▶ to carry on, or Sta…`: 667x375 t100 stack hcb
- `Paused — ▶ to carry on, or Star…`: 780x360 t100 wider hcb; 780x360 t100 wider moon; 780x360 t115 stack hcb
- `Paused — ▶ to carry on, or Start…`: 700x350 t100 stack hcb; 700x350 t100 stack moon
- `Paused — ▶ to carry on, or Start …`: 720x360 t100 stack hcb; 720x360 t100 stack moon
- `Paused — ▶ to carry on, or Start a…`: 740x342 t100 stack hcb/moon; 844x390 t100 wider hcb/moon; 844x390 t115 stack hcb/moon (already cut by the `28vw` cap on U119's tree, unchanged)
- `Paused — ▶ to carry on, or Start aga…`: 780x360 t100 stack hcb/moon (cap, unchanged)
- `Paused — ▶ to carry on, or Start again i…`: 844x390 t100 stack hcb/moon (cap, unchanged)

Before, on U119's tree, 42 of those cells were cut flush, 3 drew no paused line at all, and 19 were cut by the `28vw` cap with its ellipsis (`compare-base-fix2-paused.txt` lists the 45 that changed, before and after).

## Done

- Base confirmed `0d2c3472`; the harness per `operating-procedure.md` §14: port 5333 from `app/build/u119a/playwright.u119a-5333.config.ts`, storage state rewritten to 5333 by absolute path; content copied read-only from the main checkout's `app/public/content` (this worktree holds only the committed audio there).
- **Mechanism 1 built**: `leftGroupIsCut` in `fitBarControls`'s loop, priced at `bar m / m`.
- **Mechanism 2 built**: the status mirror shrinks with its own ellipsis, and the name keeps yielding first outside a refusal.
- **Mechanism 3 built** (the second read's hazard, measured first): the row test counts the controls only.
- **Acceptance 1** (568 × 320, wider face, 115 %, *bar 1 / 4*): a committed row. Back and *bar 1 / 4* whole, *bar 4 / 4* whole, Hands off the bar because the minimum fails with it there (asserted, not inferred), Hands found and working in `⋯`'s sheet, nothing over a control, five points per control, one row.
- **Acceptance 2** (three digits): three committed rows on Moonlight III. 568 × 320 at 115 % on both faces, 640 × 360 at 115 % on the wider face. The current *bar 1 / 201* whole, *bar 201 / 201* whole when written by hand, and the bar count asserted three digits.
- **Acceptance 3** (the constrained paused line): every paused row, 667 × 375 on the wider face among them, asserts the line is cut by its own box with its ellipsis and only once the name has nothing left.
- **Acceptance 4**: the existing real-tap pass (`pressControl`: reveal, then an unforced `click()`) runs in all seven new rows: ▶, ⏸, `Hear it`, the mode, `R`/`L`/`Both` where on the bar, the tempo label, `⋯`, Back. Where Hands is in `⋯`, `L` is tapped there. One row asserted in every row.
- **Acceptance 5**: U105d's two 740 × 342 refusal rows (`:1836`) and U119's 667 × 375 refusal row (`:2342`) are unmodified in what they assert and green. The 667 row calls `barLeftAgainstControls`, which now returns more fields; it asserts the same two. The claim to verify, at 568 × 320, does matter to the refusal sentence: see Follow-up 1 and Question 2.
- **Acceptance 5b**: a committed refusal row at 568 × 320 (115 %, wider face, Hot Cross Buns, the face and text size from the first paint). While the refusal stands, Hands is behind `⋯` because the left group's minimum needs the room; `Hear it`, ▶, the mode, the tempo and `⋯` stay on the bar. The same after the tempo sheet is opened and closed and after a resize. No control is under the sentence.
- **Acceptance 6**: the whole `score.screen.spec.ts`, 76 passed; `score.spec.ts`'s *one row, seven controls at most*, 5 passed; the 29 sideways rows three times each, 87 passed.
- **Mutants**: all six killed, each on named rows (table below).
- **The probe**: 64 paused cells and 40 refusal cells on U119's build and on this one, compared cell by cell (`compare-*.txt`).
- `npx tsc -b` and `npx eslint tests/e2e/score.screen.spec.ts src/ui/screens/ScoreScreen.ts --max-warnings=0`, both exit 0.
- **The final build's 58 assets are byte-identical to the build every browser run and probe used** (`assets-fix2.txt`, `assets-final.txt`). Two edits came after those runs, and both were comment wording in `style.css` and `ScoreScreen.ts`. The final tree then reran the whole file and the repeat.
- Cleanup per §14: `app/dist`, the config copy under `app/build/u119a/` with its `test-results`, and the copied content are deleted, as are the kept builds under the worktree's `build/`. `app/node_modules` stays.

## Not done

- **No device check.** None available.
- **The narrowest refusal case is not in the suite.** It is red at this tree and at U119's (`scripts-refusal-568.spec.ts`, `refusal-568-final-run.txt`, `refusal-568-base-run.txt`). Its fix is U105d's refusal rule, which this lane does not change, and a red row cannot land. Kept in the run folder as the case that shows it (Question 2).
- **A word-boundary ellipsis.** Not built: it needs script, and the brief left it to the reviewer (Question 1).
- **The other ordinary lines the mirror carries** (running, demonstrating, restarted, away) were not each put through the geometry. They take the same box and the same rule, so the ellipsis applies by construction; inferred from the CSS, not measured.
- **The cost of the new predicate was not measured.** Sideways, every render now writes one text into the bar, forces one layout and puts the text back; upright it returns at once.
- **The whole unit suite and the whole browser suite were not run**, only the targeted files (CI is the full run). In the ten unit files that read `ScoreScreen.ts` or `style.css` as text, 591 passed and 2 failed: *blues.3* and *4.7* in `lessonClaimsAboutApp.test.ts`, the same two U105b/c/d and U119 recorded. Each looks for LF-only text in a file this Windows checkout holds with CRLF: Node reads `\r\n` in all three edited files, which include both files those checks read. Neither checked text was touched.
- **880 × 412** not probed (844 × 390 was the widest); its one-row case in `score.spec.ts` is green.

## Follow-ups (recorded, not fixed)

1. **U105d's refusal at 568 × 320 makes the bar taller than the window** (a learner truth: a control the learner is told to tap is off the screen). Narrowest case, the app's own face with 115 % text, Hot Cross Buns, at rest, ▶ refused: the sentence gets a column about one letter wide and the bar grows past the top of the 320 px window, so ▶ and the start of the sentence are above the screen. With the wider face (Moonlight III) the sentence starts above the top. Present on U119's tree too; on this tree, Hands leaving improves the Moonlight case (▶ back in the window) but not the sentence. The cause, read in the CSS: under the refusal, the name and the sentence share in proportion what Back, `bar n / m` and the controls leave, and with `min-width: 0` and `overflow-wrap: anywhere` the sentence can be given almost nothing. Belongs with U105d's refusal-row growth, which its ruling accepted at 667 × 375; 568 × 320 was not measured then. Evidence: `probe-fix2-refused-*-table.txt` (bar heights), `refusal-568-*-run.txt`.
2. **Observation, not a row: `fitBarControls` runs on render and resize only.** A face that changes after load leaves the fit stale until the next render. The app loads no web font, so on a phone the face is there from the first paint. The suite's rows inject the wider face after load and rely on the run's start to refit. The probe injects it from the first paint.
3. **Observation, not a row (carried from U119):** `ScoreScreen.ts` still says "below 400 px" in two comments where `NARROW_BAR_PX` is 440. The file is owned here, but the comments are not this lane's subject.

## Questions

1. **For the reviewer (the second read's ambiguity, as the brief asks).** The ordinary status now ends with `text-overflow: ellipsis`, and that cuts at a character: *Pau…*, *Paus…*, *Paused — ▶ to c…*, *… or St…* (full list above). At the narrowest box measured, Chromium draws *P* with the ellipsis's last dot clipped (*P..*). Does a character-boundary ellipsis meet "visibly read as truncated … not a partial word"? If a word boundary is required, the mechanism is script, which this lane did not build.
2. **For the reviewer.** The narrowest case at 568 × 320 is red against U105d's refusal rule: the bar grows taller than the window and ▶ goes off the top. Should it enter `score.screen.spec.ts` now as an expected failure (`test.fail()`, a pattern this suite does not use yet), or go with Follow-up 1 to a lane that owns the refusal rule? Either way it is a face-dependent cell, so an expected failure could flip on a runner whose face is narrower.

## Files

- `app/src/ui/screens/ScoreScreen.ts`: `leftGroupIsCut` (new) and its comment; `fitBarControls` calls it; `barIsOverfull` counts the controls' rows, with its comment.
- `app/src/style.css`, inside `@media (orientation: landscape) and (max-height: 500px)` only:
  - the status mirror's `flex: 0 1 auto; min-width: 0`;
  - the name's refusal-scoped `flex-shrink`;
  - the group clip's comment updated (Question 1 of U119 answered).
- `app/tests/e2e/score.screen.spec.ts`:
  - `barLeftAgainstControls` returns `widestWhole`, `handsOnBar`/`hearOnBar`, `fitsWithHands`/`fitsWithHear`, `statusOwnCut`, `titleFirst`;
  - `expectLeftGroupKeepsItsMeaning` (new);
  - the matrix is a list, `SIDEWAYS_PAUSED`: U119's 16 rows with their names unchanged, four 568 × 320 rows and three Moonlight III rows; the body was re-indented, not rewritten, and gained the `⋯`-sheet check for Hands;
  - the 568 × 320 refusal row (new).
- `docs/prompts/runs/U119a/`: this entry; logs, failure digests, probe tables and comparisons, selected probe JSONs, mutant logs, asset and source hashes, and the scripts (`scripts-*`). Machine paths are `<worktree>`/`<home>`; no kept file is over 300 KB.
- `docs/prompts/pictures/u119a/`: nine bar strips, before (U119's build) and after (this build).

## Tests

| Test | Class | Old assumption |
| --- | --- | --- |
| `barLeftAgainstControls` and `expectLeftGroupKeepsItsMeaning` | replace (the helper extended) | `bar n / m` whole for the bar under the cursor was enough; nothing said how a cut status line ends or why a control left the bar |
| U119's 16 sideways paused rows (640–780, both faces, 100/115 %) | replace (same rows and names, assertions added) | a status line cut flush by the group's clip was acceptable; the pricing at the widest bar and the overflow decision were not asserted |
| sideways 568 × 320, both faces, 100/115 %, paused (4) | add | 568 × 320 was not a cell; U119 measured `bar 1 / 4` cut there at 115 % on the wider face |
| sideways three-digit bar (Moonlight III): 568 × 320 at 115 % on both faces, 640 × 360 at 115 % on the wider face (3) | add | three digits were measured only with a count written by hand |
| a refusal sideways (568 × 320) on a wider face at 115 %: the sentence’s height sends no control behind ⋯ | add | a refusal's growth was assumed never to move controls; on U119's tree it did at the next render |
| U105d's refusal rows (740 × 342, paused and at rest); U119's refusal row (667 × 375) | preserve, unchanged in what they assert | — |
| the rest of `score.screen.spec.ts`; `score.spec.ts` *one row, seven controls at most* | preserve | — |

"The 29 sideways rows" below are the tests `-g "sideways"` selects in `score.screen.spec.ts`: the 23 paused rows, the four refusal rows (740 × 342 twice, 667 × 375, 568 × 320), the `⋯` sheet's sideways fit and the summary's sideways refusal.

**Red on U119's build** (`browser-red-base.txt`, digest `browser-red-base-failures.txt`): of the 29 sideways rows, 19 failed and 10 passed. In 18 rows the status line was cut flush (15 of U119's and the 568 rows, and the three Moonlight rows). At 568 × 320 at 115 % on the wider face and in the three Moonlight rows, the bar number was cut or would be, and Hands stayed. In the refusal row, `Hear it` went behind `⋯` at the render.

**Mutants** (`scripts-mutant.py`, `scripts-run-mutant.sh`; each built with `vite build`, run over the 29 sideways rows, and the source restored and checked by hash: `m*-apply.txt`):

| Mutant | Result | Killed by |
| --- | --- | --- |
| m1: the minimum check removed (`fitBarControls` back to `barIsOverfull` alone) | killed: 5 failed, 24 passed | 568 × 320 at 115 % on the wider face; the three Moonlight rows; the 568 refusal row |
| m2: the minimum counts the name's own width as required (over-triggering) | killed: 12 failed, 17 passed | "Hands left the bar although Back and the bar number fit beside it" at 568 × 320 (100 %, both faces; 115 %, the app's face), 640 × 360 (115 %; the wider face at 100 and 115 %), 667 × 375 (wider, 115 %); "Hear it left the bar…" in the Moonlight rows, the 568 wider 115 % row and the 568 refusal row. Not at 780 × 360 at 100 %, the brief's example: there the name fits beside Back and the bar number, so this mutant does not fire |
| m3: the status line's own truncation removed (`flex: none` again) | killed: 18 failed, 11 passed | every row whose paused line is cut by the group, 667 × 375 on the wider face among them |
| m4: the status line shares the shrink with the name (the weight removed) | killed: 21 failed, 8 passed | `titleFirst`, at 740 × 342 on the wider face among them ("the piece’s name still had 44.453125 px") |
| m5: the row test counts the grown left group again | killed: 1 failed, 28 passed | the 568 refusal row only: "after the render: Hear it is off the bar…" |
| m6: the location priced at the bar under the cursor, not `bar m / m` | killed: 1 failed, 28 passed | 640 × 360 at 115 % on the wider face, Moonlight III: "the piece’s widest bar number would be cut (“bar 201 / 201”)" |

## Exit codes

| Step | Exit | Counts |
| --- | --- | --- |
| `npm ci` | 0 | |
| `npm run build:app`, U119's tree (base) | 0 | |
| probe smoke, base | 0 | 1 passed |
| `npm run build:app`, mechanisms 1 and 2 (fix1) | 0 | includes `tsc -b` |
| probe paused, fix1 | 0 | 64 passed |
| probe refusal, fix1 | 0 | 40 passed |
| probe paused, base | 0 | 64 passed |
| probe refusal, base | 1 | 37 passed, 3 failed: the probe's setup tap on the name, which has no width on U119's tree at three 568 cells. Rerun with the tap on the bar number's left edge, 3 passed. An earlier rerun tapped the bar number's middle, which lay under ▶ past the group's clip, and one of its three failed; that log was overwritten |
| probe refusal with a render, base | 1 | 23 passed, 1 failed: at 568 × 320 at 115 % on the app's face (Moonlight III) the tempo label was off the window after the refusal (Follow-up 1) |
| `npm run build:app`, all three mechanisms (fix2) | 0 | |
| probe paused, fix2 | 0 | 64 passed |
| probe refusal with a render, fix2 | 0 | 40 passed |
| `npx tsc -b` | 0 | |
| `npx eslint` on the spec and `ScoreScreen.ts`, `--max-warnings=0` | 0 | |
| whole `score.screen.spec.ts`, fix2 | 0 | 76 passed |
| the 29 sideways rows on U119's build (red) | 1 | 19 failed, 10 passed |
| m1–m6, `vite build` | 0 each | |
| m1–m6, the 29 sideways rows | 1 each | 5, 12, 18, 21, 1, 1 failed |
| `npm run build:app`, final tree | 0 | 58 assets byte-identical to fix2 |
| whole `score.screen.spec.ts`, final | 0 | 76 passed |
| `score.spec.ts -g "one row, seven controls"`, final | 0 | 5 passed |
| the 29 sideways rows, `--repeat-each=3`, final | 0 | 87 passed |
| `vitest`, the ten unit files that read `ScoreScreen.ts` or `style.css` | 1 | 591 passed, 2 failed (the CRLF pair above) |
| the narrowest refusal case (not committed), final and base | 1 each | 2 failed each |

## Content

Nothing under `content/` or `scores/` changes. The §12 itemisation list is empty: no lesson text, table, sentence wording or score bytes change. The learner-facing change is layout: sideways, Hands (in principle then `Hear it`) goes behind `⋯` before Back or `bar n / m` would be cut, and a cut ordinary status line ends with an ellipsis.

## Doc rows (proposed, not applied; the brief owns none of these files)

- **`docs/08-test-map.md`, the `score.screen.spec.ts` row.** Append: "U119a: the sideways rows add 568 × 320 (both faces, 100 % and 115 % text) and Moonlight III's three-digit bar (568 × 320 at 115 % on both faces, 640 × 360 at 115 % on the wider face). Every row asserts Back and the piece's widest `bar m / m` whole. Hands is off the bar exactly when that minimum fails with it there, and `Hear it` only after Hands, read by putting each control back for a moment. The status line is cut by its own box with its ellipsis, never flush by the group, and only once the name has nothing left. Where Hands is behind `⋯`, it is tapped there. A refusal at 568 × 320 (115 %, wider face) renders while it stands, and the controls stay as the minimum decides. Red on U119's build. Mutants: the check removed, the name counted as required, the status line's truncation removed, its shrink shared with the name, the grown group counted as a row, the current bar priced instead of the widest."
- **`docs/08-score-render-states.md` §7.1.** After "It has broken twice.", add: "Sideways the bar's left group (Back, the name, `bar n / m`, the status line) has a minimum: Back and the piece's widest `bar m / m` whole. Where that would not fit beside the controls, Hands and then `Hear it` go behind `⋯`. The name yields first, then the status line, which ends with its own ellipsis. The group's clip is the last fence (U119, U119a)."
