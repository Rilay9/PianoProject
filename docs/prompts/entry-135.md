### Entry 135 — U90 — a name on Skills is never cut: a concept's title, and an exercise's under it, wraps to the lines it needs beside Drill it and Find more, on every font; CI's red reproduced here by forcing a face wider than Segoe UI, red first, green after (2026-09-29)

A fix-forward of the one definite red in CI's full run 36559774455 on 248c6138 (`plan.spec.ts:260`, F2b's case, "the beginner name is cut", on both attempts), under F2b's accepted contract (788427c). Built on base 50b88b41 under the brief `docs/prompts/tasks/U90-skills-title-never-cut.md`. Every capture is in `docs/prompts/runs/U90/`. Each run's `.txt` starts with its command and ends with `exit=<code>`. The derived files do not: the probe summaries, the failing-name lists and `diff.txt`. The pictures are in `docs/prompts/pictures/u90/`, named `<committed|fixed>-<condition>-<what>-<size>.png`. Nothing was heard; nothing here is music.

## Judgement

I looked at the Skills list filtered to Stage 2 at 342 × 740, with "Leaps: a fourth or fifth" in the middle of the screen, before and after, on the app's font stack and under a forced wide face (Verdana). I also looked at the row with the longest name that carries both buttons ("Primary chords with the dominant seventh"), and at the same two screenfuls at 115 % text and sideways at 740 × 342.

- **The beginner's leap at 342 × 740.**
  - **On the stack, before** (`committed-stack-stage2-342x740.png`): "Leaps: a fourth or fifth" reads whole beside *Find more*, with nothing to spare: its text fills its box exactly. The row below reads "Shifting pos…" beside *Drill it* and *Find more*.
  - **Under the wide face, before** (`committed-wide-stage2-342x740.png`): "Leaps: a fourth o…", which is the runner's failure, reproduced here. "Shifting …" says nothing at all. Both drill rows above read "Twelve-bar blues shuffle in…", so the key that tells them apart is gone.
  - **On the stack, after** (`fixed-stack-stage2-342x740.png`): the leap row is unchanged, still one line. "Shifting position" takes two lines beside *Drill it* and *Find more*, with its meta line under it.
  - **Under the wide face, after** (`fixed-wide-stage2-342x740.png`): "Leaps: a fourth or / fifth" is on two lines. Its meta line sits under the name and *Find more* is centred at the right, so it reads as one entry. The drill rows read "Twelve-bar blues shuffle in / C" and "… / A": whole, with a short second line.
- **The longest name beside both buttons.**
  - Before, it read "Primary cho…" (`committed-stack-longest-342x740.png`).
  - After, it reads whole over four short lines in the column the buttons leave (`fixed-stack-longest-342x740.png`; the same under the wide face, `fixed-wide-longest-342x740.png`). It is legible and it is one entry, but it is a narrow column. At 115 % text, where the actions already drop under the words (before and after alike), the same name takes two full-width lines and reads better (`fixed-stack-115-longest-342x740.png`). That trade is the Skills screen's structure, which is not U90's (Follow-up 2).
- **Sideways at 740 × 342 nothing changes.** The before and after pictures are byte-identical (`*-stack-sideways-*-740x342.png`), and no title there takes a second line in either state (the probe, every row).
- **As a teacher would read it.** A skill's name cut to "Primary cho…", "Finger num…" or "Leaps: a fourth o…" names nothing, or the wrong thing. Two exercises that both read "Hands together in A — left ha…" cannot be told apart, when "changes" against "holds" is the whole difference. Whole names in a taller row are the better screen, and I have no reservation on the words. The narrow column is a look question, not a truth question.

**The mechanism, and the test that told it from the alternatives.**

- **Hypothesis (the orchestrator's):** the title is one line with an ellipsis (`.list-row__title`: `white-space: nowrap; text-overflow: ellipsis`), and the stack's `system-ui` resolves on the runner to a face wider than Segoe UI.
- **What the browser draws here** (CDP `CSS.getPlatformFontsForNode`, `probe-committed-*.json`): the title is drawn in Segoe UI and the buttons in Arial. The buttons do not take the body font (Follow-up 3).
- **Discriminating test:** force every element to Verdana, which this machine has, and read the leap title's widths at 342 × 740 on the committed CSS.
  - Under Verdana the title's text is wider than on the stack. The box it gets is also narrower, because *Find more* is wider in Verdana too.
  - The text is then wider than its box, and the title reads "Leaps: a fourth o…" with the ellipsis.
  - On the stack the text is exactly as wide as its box.
  - The same happens on the stack at 115 % text (`probe-committed-stack-115.json`: "Leaps: a fourth o…").
- **Alternatives, and why they do not hold.**
  - **The viewport:** the case sets 342 × 740 itself, so it is the same on the runner.
  - **The row's siblings:** the leap row carries *Find more* only, because no exercise carries `leap`. What Skills lists is identical between this worktree's offline build and the main checkout's full build (`compare-content.txt`). The full build has 227 more songs and one excerpt, no exercise or drill, and the same concepts and lesson concept lists.
  - **The Stage select:** it is the same data and the same code.
- **Result:** the hypothesis holds here. A name that exactly fills its box on Segoe UI is cut by a wider face, as Verdana shows.
- **The runner's own face is unverified.** The CI log does not name it. Until CI reads the record commit, that the wrap turns the runner green is unverified too.
- **The change acts on the mechanism.** The title no longer has one line to overflow, so no face can cut it; there is no per-font threshold. The words keep their `flex: 1 1 5rem` basis, so the actions stay where they were. Every title's box, on concept and drill rows alike, is the same width before and after in all four conditions (`probe-*-*.json`, compared row by row), and the row grows by the lines the name needs.

## Done

1. **The Skills row's title wraps (item 1).**
   - **Technical.** `style.css` gains `.skill-concept .list-row__title { white-space: normal; text-overflow: clip; overflow-wrap: break-word; }` beside `.list-row__title`, with its reason.
   - **The selector.** `.skill-concept` exists only on Skills (`SkillsScreen.ts` builds it; nothing else in `app/src` does). It reaches each concept row and the drill rows under it, and no other screen's rows.
   - **Why the drill rows too.** The brief says other rows keep their rule unless the same fault is observed there, and it is observed on the stack here, before any wide face:
     - both coordination exercises in A read "Hands together in A — left ha…" (`exercise.coordination.a.change` and `.a.hold`);
     - "Ostinato over a pedal bass in …" drops the key for A and for D;
     - "Sight-reading generator, level …" drops the level.
   - **`overflow-wrap: break-word`** is for a single word longer than the room, which would otherwise still be clipped. No such word was observed in any of the four conditions. The line is there so the rule holds on any font, and no red exercises it (inferred insurance).
   - **What I looked at elsewhere.** Every concept row on Skills over every stage, and every drill row the list draws under them (the first three per concept; the rest sit behind each concept's *Show all N* and were not opened), in four conditions: 342 × 740 on the stack, under the wide face and at 115 % text, and 740 × 342 on the stack. The files are `probe-committed-summary.txt` and `probe-fixed-summary.txt`, which give what each cut name read.
     - After the change no name is cut in any of the four.
     - The geometry check finds no row that stops reading as one entry: the meta line directly under the title and inside the row, the actions inside the row's box.
     - The actions sit beside the words on the same rows as before, in every condition.
   - **No other screen's rows were changed or measured** (item 5).
   - **Pedagogical.** Names are no longer cut, so nothing on Skills reads as a different skill or a different exercise. No curriculum word changed.
2. **The case proves it on a wide face too (item 2).**
   - **The two passes.** `plan.spec.ts`'s F2b describe runs its one case twice: "— on the app's font stack", and "— on a wider face", after `page.addStyleTag` with `body, body * { font-family: Verdana, 'DejaVu Sans', sans-serif !important; }`.
   - **Why DejaVu Sans.** It is named after Verdana because the Linux runner probably lacks Verdana (unverified), so the pass falls back to a wide face there rather than to whatever `sans-serif` is.
   - **The face is wider than the stack's first match here, measured before the fix.** Segoe UI is what the stack's `system-ui` gives here (CDP). On the committed CSS, the leap title's `scrollWidth` under Verdana is greater than on the stack, and greater than its own `clientWidth`. On the stack, `scrollWidth` equals `clientWidth`.
   - **Red first:** see the red lines.
   - **The new assertion.** The case now ends by reading every title the list draws over every stage, concept and drill rows alike, with the list's Show all pressed to the end: `names on Skills cut to an ellipsis` must be empty. A concept's own *Show all N* is not pressed, so the drill rows behind it are not read; the same rule reaches them. That is the rule itself rather than two names standing for it (`00` §2, assert what you mean).
   - **The other names the wide face cuts on the committed CSS.**
     - **At Stage 2** (the screen the case opens), besides the leap: "Block chords", "Chord symbols", "Dotted quarter notes", "Eighth notes", "The four-chord loop", "Playing hands together", "A held left hand", "The primary chords", "Shifting position", "Subdivision", "Passing the thumb under" and "Lining the hands up". Among the drill rows: the slash-bass, dotted-rhythm, dynamics, eighths, swing-pair, modal-vamp, coordination, twelve-bar shuffle and minor-pentatonic exercises.
     - **At Stage 7:** "Wide leaps" too, the name F2b chose because "Leaps: an octave or more" was cut.
     - **Over every stage:** more names are cut under the wide face than on the stack, and many are cut on the stack as well. Every one, with what it read, is in `probe-committed-summary.txt`; the list is long, so it is kept there rather than here.
3. **The look at 342 × 740 (item 3).** As in the judgement, with the pictures named there. The wrapped row reads as one entry in every picture: the meta line under the name, and *Drill it* and *Find more* at the right, centred on the taller text, not on a line of their own.
   - The meta line itself is clipped beside the buttons, before and after alike: "Stage 2 · core · 1" for "15 to practise" on the stack, and "Stage 2 · cc" under the wide face. It keeps its place, but its words are cut (Follow-up 1).
4. **The two flakes (item 4) are recorded as U91 by the orchestrator, not here.**
   - **`sweeps.spec.ts:54`** sweeps lesson pages, and `.skill-concept` is not on them, so it was not rerun.
   - **`wide.spec.ts:428`, phone-landscape.** Its Skills scene at 740 × 342 is unchanged here: the pictures are byte-identical and no title wraps. So item 4's condition does not hold there.
   - **`wide.spec.ts`, phone-portrait.** The wrap does change the Skills screen that this case measures at 342 × 740. So I ran both phone sizes of "every screen is centred and capped" (`e2e-wide-phones-fixed.txt`, 2 passed).
5. **Consumers.** These are the other specs that open Skills: `competence`, `finder`, `first-day`, `help-strip`, `landscape` (which has the Skills sideways case) and `offline`. All ran on the fixed build (`e2e-skills-readers-fixed.txt`, 43 passed).
   - Two unit files read `style.css`. `scoreMidRunSettings` passes. `lessonClaimsAboutApp`'s failures are the same with the committed CSS and with the fix (below).

## Not done

- **The whole browser suite**, which the map names for any spec change (`map-min.txt`: `e2e npx playwright test --workers=4`), was not run. CI is the full run, and the suite's default config sits on port 4173, which this lane must not use. The targeted specs above were run instead.
- **Reading the runner's face.** Only CI can show it. The record commit's CI run is the observation.

## Follow-ups

1. **P2, the Skills meta line is clipped without an ellipsis beside the buttons, and a clipped count reads as a different number.**
   - At 342 on the stack here, "Shifting position" reads "Stage 2 · core · 1" where sideways it reads "15 to practise". "Primary chords with the dominant seventh" reads "Stage 3 · core · 2" for 25.
   - Under the wide face it reads "Stage 2 · cc".
   - The cause is `.list-row__meta` (`flex-wrap: nowrap; overflow: hidden`) on the Skills row.
   - It is the same class of fault as U90's, on the detail line, and outside the brief, which covers the title only. It needs a UI row for Skills.
2. **P3, long names beside both buttons take three or four short lines, and such a row stands past R2's 96 px.**
   - The case is "Primary chords with the dominant seventh" in four lines at 342 on the stack; under the wide face more rows are past 96 px.
   - At 115 % text, with the actions under the words, the same name reads in two full-width lines (pictures above).
   - Whether a Skills row drops its actions under a name that needs more than two lines is a decision about the Skills screen's structure (not U90's, item 5). The trade is the Library's upright exception: the words get the width, the buttons get a line.
3. **P3, adjacent, `.button` does not inherit the body font.** Here *Drill it* and *Find more* are drawn in Arial beside titles in Segoe UI (CDP, `leapButtonDrawnIn` in `probe-*-stack.json`). Recorded, not fixed.

## Questions

None. One choice was mine and is stated above: the drill rows under a concept take the rule too, under the brief's "unless the same fault is observed there". If the reviewer wants the concept row alone, the selector is `.skill-concept > .list-row[data-concept] .list-row__title`, and the spec's last assertion narrows to `.list-row[data-concept]`.

## Files

- **Changed:**
  - `app/src/style.css`: the `.skill-concept .list-row__title` rule and its comment, after `.list-row__title`.
  - `app/tests/e2e/plan.spec.ts`: the F2b describe's note, `readWhole`'s doc line, `FACES`, the case run once per face, and the every-name assertion.
- **Pictures:** `docs/prompts/pictures/u90/`, 16 PNGs: committed and fixed × stack, wide, stack at 115 % and stack sideways × the Stage 2 screen and the longest-name screen.
- **Captures and scripts:** `docs/prompts/runs/U90/`, holding this entry, the logs in the table, the probe readings (`probe-*.json`, `probe-*-summary.txt`) and `diff.txt`. The scripts are:
  - `scripts-u90-probe.spec.ts`: the probe, run from `app/tests/e2e/` and moved here;
  - `scripts-playwright.u90-4383.config.ts`: the port override, run from `app/` and moved here;
  - `scripts-run-e2e.sh`: checks that every named spec exists and that port 4383 is free, then runs with two workers;
  - `scripts-summarise-probe.py`;
  - `scripts-compare-content.py`;
  - `scripts-vitest-compare.sh`.
- **Not to commit** (line endings only, no content change):
  - `docs/prompts/inventory.md` and `docs/prompts/rung-claims.md`. The offline build rewrote them from its partial catalogue. I wrote their committed content back from `git show HEAD:<path>`, and `git diff` on them is empty; `git status` may still list them.
- **Environment:**
  - `npm ci` ran in `app/` (`npm-ci.txt`, exit 0), so no junction was needed.
  - `parity_reference.py` ran first, exit 0; three MAESTRO files are absent and skipped by design.
  - `build.py --offline` wrote `app/public/content` with exit 1. The MuseTrainer and kern libraries are not fetched offline, which gives 121 validation errors about pieces not in the catalogue.
  - That build was kept rather than copying the main checkout's content, because Skills' input is identical (`compare-content.txt`).

## The red lines

`red-f2b-committed-css.txt`: the F2b describe on the committed CSS with the new spec (exit 1, both cases red; the line numbers are the red run's, one lower than the final spec's after a comment line was added):

- **On a wider face:** `Error: the beginner name is cut … Expected: true Received: false` at `plan.spec.ts:282` (`expect(await readWhole(beginner.locator('.list-row__title')), 'the beginner name is cut').toBe(true)`). This is CI's own failure, word for word, reproduced here under Verdana.
- **On the app's font stack:** every F2b assertion before the new one passed, both leap names read whole here on Segoe UI. It then failed at `plan.spec.ts:321`, `Error: names on Skills cut to an ellipsis`. The received list starts "Finger numbers", "Posture and hand-shape checklist", "Guided tour of the practice modes"… This is the fault on this machine's own face.
- **After the change**, both cases pass (`e2e-plan-fixed.txt`, `e2e-plan-final.txt`).

## Tests

| Step | Exit | Note |
| --- | --- | --- |
| `ci-36559774455-log-failed.txt` (`gh run view 36559774455 --log-failed`) | 0 | `plan.spec.ts:260`, "the beginner name is cut", both attempts |
| `parity-reference.txt` | 0 | three MAESTRO files skipped by design |
| `content-build-offline.txt` | 1 | offline libraries absent; `app/public/content` written |
| `compare-content.txt` | 0 | Skills' input identical to the main checkout's full build |
| `npm-ci.txt` | 0 | — |
| `build-app-committed.txt`, `build-app-committed-2.txt` | 0, 0 | committed CSS (the second with the fix set aside for the longest-name pictures) |
| `probe-committed.txt` | 0 | the probe (not a test): readings and before pictures |
| `red-f2b-committed-css.txt` | 1 | the red, as above |
| `build-app-fixed.txt` | 0 | with the wrap rule |
| `probe-fixed.txt` | 0 | readings and after pictures |
| `e2e-plan-fixed.txt` (`plan.spec.ts` whole, port 4383, 2 workers) | 0 | 25 passed |
| `e2e-plan-final.txt` (the same, after comment-only edits to the spec) | 0 | 25 passed |
| `e2e-skills-readers-fixed.txt` (`competence`, `finder`, `first-day`, `help-strip`, `landscape`, `offline`) | 0 | 43 passed |
| `e2e-wide-phones-fixed.txt` (`wide.spec.ts`, phone-landscape and phone-portrait) | 0 | 2 passed |
| `tsc.txt` (`npx tsc -b`, final tree; covers `tests/e2e`) | 0 | — |
| `lint.txt` (`npm run lint`, final tree) | 0 | — |
| `vitest-all.txt` (the whole unit suite) | 1 | 63 failures in 9 files, not the wrap's (next row) |
| `vitest-compare.txt` (those 9 files with the committed CSS and with the fix, both CRLF as checked out) | 1, 1 | identical failing names, and identical to the whole run's |
| `map-min.txt` (`checks_for_paths.py app/src/style.css app/tests/e2e/plan.spec.ts`) | 0 | names `tsc`, `lint`, `unit` (whole), `build-app`, `e2e` (whole suite) |

- **The 63 unit failures.**
  - The files are `lessonClaimsAboutMusic`, `lessonClaimsAboutApp`, `curriculumIntegrity`, `everyOptionOpens`, `firstThirtyDaysOnTheLadder`, `legacyStorage`, `lessonClaims`, `materialOnTheRecord` and `planNoUnobtainableRungs`.
  - Their names are about pieces the offline catalogue lacks (the Entertainer, Maple Leaf, the Canon in D, the nocturnes). That the missing 227 songs are the cause is inferred and unchecked.
  - Among them are the two line-ending assertions in `lessonClaimsAboutApp` (Entry 101): `blues.3`, and `4.7`, which reads `style.css` for `'.score-stage--blind {\n  visibility: hidden;\n}'`.
  - A first comparison wrote the committed CSS with LF and read `4.7` as a difference. Written CRLF, as the checkout writes it, the lists are identical.
- **What the map names and was not run:** the whole browser suite (Not done).
- **Unverified:**
  - the runner's face;
  - CI green on the record commit;
  - what the wide pass draws on the runner (Verdana, DejaVu Sans or another `sans-serif`);
  - a real phone's rendering (Roboto, San Francisco).

**Orchestrator's note at the landing (2026-09-29).** U90's worktree committed by name (994586f9) and merged (994586f9). The chain on the merged main checkout: the map's test and its minimum for the merged files (`runs/U90/map-min.txt`), typecheck, lint, the whole unit suite, the app build, then the whole browser suite on the default port at four workers, because the map's minimum names the whole suite for `style.css` (shared machinery; the spec-existence step read an empty list and said so) (map-tests 0; map-min 0; tsc 0; lint 0; vitest-all 1; build-app 0; specs-exist 1; vitest-rerun 0; e2e-targeted 1; duet-alone 0; e2e-rerun 0 — the unit suite's two recorded line-ending assertions in `lessonClaimsAboutApp` (Entry 101's diagnosis) fail here and pass on the runner; five more failures in three of X3d's revised test files (`scoreModelWrittenValues`, `scoreSmoke`, `slots`) because the orchestrator merged X3d into the main checkout while this chain's unit step was reading the tree — an orchestration fault, not the code's; the three files rerun alone on the fully merged tree, green (`vitest-rerun`), and the steps after the unit step ran on the merged tree with X3d in it — the targeted specs' failures passed alone (`e2e-rerun`); the note names them; `runs/U90/orchestrator-exit.txt`). Two builders ran their own browser suites on other ports at the same time, so any failure here was rerun alone before it counted. The runner's own font is the proof: CI's full run on this record commit is read for `plan.spec.ts:260` and recorded here when it completes. The whole suite's one red, `modes-duet.spec.ts`'s *the button opens one of the rung's own pieces*, passed alone (five of five): the case reads the lesson page's offered rows before the songs are drawn under load, then the duet's pick, a rung song, is not in its list — a spec race (U95, recorded; CI failed the same case on 1856866a). The merge was a fast-forward, so the implementation commit is the merged tree. The builder's choice to wrap the exercise rows under a concept as well as the concept rows is kept: the same cut was observed on them. The Skills row's structure beside long names (U93), the clipped detail count (U92) and the buttons' font (U94) are recorded, not fixed. Nothing heard.

## Doc rows

- **`docs/04` §3a, after the "§0:" line**, a new paragraph:
  "**A name is never cut (U90, 2026-09-29).** A skill's name, and an exercise's title under it, wraps to the lines it needs beside *Drill it* and *Find more* and never ends in an ellipsis. The row grows with the name, and the actions keep their place, because the words keep their 5rem basis.
  One line with an ellipsis cut 'Leaps: a fourth or fifth' on CI's runner, under a face wider than Segoe UI (Verdana), and at 115 % text. On Segoe UI itself it cut 'Finger numbers' to 'Finger num…', and both coordination exercises in A to 'Hands together in A — left ha…'.
  This is Skills' exception to R2's one title line. A long name beside both buttons takes three or four short lines, and such a row can stand past 96 px."
- **`docs/04` §0 R2, after the Shelf's piece rows** ("… `page 14 · for Right h`."):
  "And **Skills** (U90, 2026-09-29): a skill's name and an exercise's title wrap rather than being cut, whatever the font (§3a)."
- **`docs/08`, the `plan.spec.ts` row**, appended:
  "; since U90 the F2b case on Skills at 342 × 740 runs twice, on the app's font stack and with every element forced to a wider face (Verdana, or DejaVu Sans), and ends by reading every name Skills draws over every stage whole, concept and exercise rows alike".
