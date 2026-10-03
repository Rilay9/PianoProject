### Entry 168 — G96 — from no project, *Keep it playable* only for a piece the record says is passed, and the store refuses it otherwise; after *Close*, focus back on the piece's row a store redraw put back, through `openSheet`'s `refocus` supplied by the Library and Progress; a PDF import's detail line stops saying *song*

**Judgement.** Nothing was heard, and G96 claims nothing about music. Focus was observed in Chromium through the DOM; *unverified with a screen reader*. What I looked at: the committed code's app (HEAD's five changed sources put back for one build into `build/g96/dist-head`, `build-app-committed.txt`) and this tree's, both served on port 4573 at 342 × 740, on this worktree's offline content build (2,092 catalogue items). Base a7c232c7.

What a learner now meets differently (pictures in `docs/prompts/pictures/g96/`, facts in `runs/G96/pictures-facts-{before,after}.json`; observed):
- **The sheet from the Library's Details on a song never played** (*Hot Cross Buns*; `before-` / `after-sheet-library-never-played-342x740.png`). Before: *Not a project yet*, *You have never opened it.*, *Save for later* · *Learn this* · *Prepare it for performance* · *Keep it playable*. After: the same words, the same first three offers, and no *Keep it playable*. No new sentence says why.
- **The sheet from Progress's *Make it a project* on a piece passed** (`after-sheet-progress-passed-342x740.png`): *Not a project yet*, *You last played it on 2026-09-29.*, the four offers with *Keep it playable*, as before (the before facts read the same).
- **Focus after *Close*.** Library (Details, the door, *Learn this*, the badge redrawn, *Close*): before on the page's body; after on the new row's *Details* in `#library-list` (`libraryFocusAfterClose`). Progress (*Make it a project*, *Keep it playable*, *Close*): before on the body; after on the piece's new project row in `#progress-projects` (`progressFocusAfterClose`). The pictures (`*-after-close-342x740.png`) show no ring on either build: a pointer's tap draws none under `:focus-visible`, so the change is what a keyboard or switch user meets next, observed in the DOM.
- **The PDF row** (`before-` / `after-pdf-row-342x740.png`): before *≈ L5.0 · song*, after *≈ L5.0*, the badge *PDF · pages, not notes* beside it unchanged.
- **I already know this, never opened** (*Mary Had a Little Lamb* seeded as `selfPass` writes it; `after-sheet-library-self-passed-342x740.png`): the row wears *✓ known*; the sheet says *You have never opened it.* above the four offers with *Keep it playable*. Coherent as the reviewer ruled: the app has no encounter, the learner said they know it, and the row's badge says so beside it.

**Which held (item 4).** The table. `actionsFor(state)` was keyed on the project state alone, the sheet drew from it (`drawActions`' first line), and `applyNow` checked the same table, so *Keep* from no project was offered and accepted for any piece. The refuting reading (the sheet already reads the evidence and mislabels it) did not hold: the committed sheet read `familiarity` for its met line only. The fix is in the store, and the sheet draws from it. Focus: the recorded control was detached at *Close* (`(u)` asserts `details.isConnected === false` before closing; `(x)` red on the committed build: *the body*).

**The evidence (item 9), the reviewer's default:** the item's progress row `passed` or `mastered`, a self-pass included, read by the item's own id through `progressStore.getProgress`; a pass under another id of the same material does not count (case (b)). It is Progress's own predicate for *Pieces you have passed*, so the door that lists a piece and the sheet it opens agree by construction.

**The table (item 6):** `OFFERS.none` keeps `'keep'`, and `actionsFor` drops it without a pass. Why: `OFFERS` stays what its comment says, every transition there is; the evidence narrows one entry and adds none, so the `TABLE` pin is unchanged and only `actionsFor`'s pin and the paths from nothing move.

## Deviations

1. **The focus fallback is the reviewer's resolver, not the brief's ancestor search.** The approval governs: `openSheet(title, { refocus })`, asked only when the control focused at opening has left the document, after `release()`, inside `close`; the default is today's. The Library supplies `rowFocusFor(item.id)` (its own `#library-list` child with that `data-item`, on `.library-details`, else the row; `null` once the list has left the page) and Progress supplies its own (`#progress-projects` children only: the project row, else the offer's *Make it a project*). `openSheet` searches nothing. So brief cases (p) and (q) changed shape: (p) is "`openSheet` searches nothing by itself, and a resolver whose list is gone answers nothing"; (q) is folded into (w), where the piece also sits on Progress's history rows with the same `data-item` and focus lands on the project row.
2. **`ProgressScreen.ts` touched** (the brief's item 14 listed it): the approval names Progress as a caller that supplies the resolver. The touch is `drawProjects`' `open` and a `rowFocusFor` beside it, 14 lines.
3. **The Library's *Details* button carries a class, `library-details`** (`rowFor`, outside the brief's owned lines), so the resolver finds it without a text search. No rule in `style.css` names it.
4. **The sheet draws its met line and its offers in one draw**, once both reads have answered (`Promise.all` of `readOffer` and `metLine`): the offers are never drawn before the evidence is read (case (i)), and a test that waits for the met line finds the offers drawn (`projectOnTheFinishSheet.test.ts` runs unchanged). The state line's first draw is as before.
5. **The config copy lives at `app/build/g96/`** (gitignored), not the worktree's `build/g96/`: a copy outside `app/` failed with `Cannot find package '@playwright/test'`. `use.storageState` is an absolute path to `app/build/g96/storageState-4573.json`, the fixture re-keyed to 4573. Lint ran with that folder moved out of `app/` (`scripts-lint.sh`).
6. **`progressProjects.test.ts`'s *the offer is the learner's* gained one wait** for the *Keep it playable* button before its tap (the brief said :130–153 preserved). Class revise; old assumption: the offers are on the sheet at its first synchronous draw.
7. **Mutants 1 and 3 in the browser:** not rebuilt per mutant; the committed build carries both faults and `(x)` was red on it (soft offer assertion, then the body).

## Done

- **Item 5, done.** `projectStore.readOffer` + `actionsFor(state, passed)`; the sheet draws nothing until the reading answers, then three offers without a pass and four with one. The Score window: the sheet listens (`onProgressChange`) while the piece has no project and reads the offers again; the listener stops when the sheet leaves the page (a `MutationObserver` on the body's children, as `ScoreScreen.openStashedSheet` does). Evidence: (i), (j), (k), (l); (s), (t); (x), (z); the pictures.
- **Item 6, done.** `applyNow` checks `actionsFor` over its own `readOffer`; no caller flag exists. Header: the one read added; the two stale sentences corrected (retention → no automatic chooser, `usable()`, G1e; `PROJECT_STAGES` → `session.ts` imports this constant, G88). The `OFFERS` comment, `projectSheet.ts`'s header and the Library door's comment state the new rule. Evidence: (a)–(h).
- **Item 7, done** under the approval's shape (deviation 1). Evidence: (m), (n), (o), (p), (r); (u), (w); (x), (z); the facts.
- **Item 8, done.** Verified first in the browser: the committed build's PDF row read *≈ L5.0 · song* (`red-e2e-committed.txt`, `pdfRow` before). After: *≈ L5.0*. MusicXML and MIDI imports keep their source words (`libraryImportWords.test.ts`, unchanged, green in the full suite); a pre-provenance import and a bundled song keep *song* ((v)). Evidence: (v), (y), the pictures.
- **Item 9, done:** the default, stated above.
- **Item 10, recorded, not fixed** (as expected). *Twinkle, Twinkle, Little Star (hands together)* wearing *Learning*: its title on two lines, whole (not clipped), and the row taller than R2's 96 on both builds (`twoLineTitle` in both facts files; `*-row-twinkle-ht-learning-342x740.png`). No change inside `LibraryScreen.ts` alone keeps every badge and every word; the clamp is in `style.css` (U63's).

**Verdicts.** Technical: the offer set from no project and the store's check are one rule over one reading; focus returns to the redrawn row on both screens by the opener's resolver; every other offer is as it was. Pedagogical: narrow, since nothing taught or judged changes; the offer no longer claims maintenance of a piece never played. Whether a learner who knows a piece from outside the app misses *Keep it playable* is a product judgement; the two-tap path (*Learn this*, then *Keep it playable*) is unchanged and pinned ((g), the table test).

## Not done

- Nothing of items 5–10 is left undone. Item 11's (q) is not a widget case (deviation 1): it lives in (w).

## Follow-ups

1. **Item 7's scoped window** (probed, not fixed; `windowSameTask`, `windowTwoTaps`). A *Close* dispatched in the same task as the action focuses the old *Details*, and the redraw then replaces it: focus ends on the body, on both builds. The driver's two clicks one after the other were slower than the redraw: on this tree focus ended on the new row's *Details*. A person's second tap is slower still, so a learner does not reach the window.
2. **Item 14's sentence, confirmed:** a PDF's Details says *The app guessed this level from the music itself — change it if it feels wrong.* of *≈ L5.0*, the default an import with no level gets (`importStore.ts`), not a guess (`pdfDetails` in both facts; `after-pdf-details-342x740.png`). A false sentence on screen: P0 by §8, small reach (PDF imports only). Not G96's.
3. **Adjacent, same picture:** the PDF's Details also lists *Type: song* (`showDetail`'s facts). Same class as item 8, outside its one line. Not G96's.
4. **`getProgress` caches what it reads** (the store's evidence read goes through it): a fresh *new* row for a piece never played is kept in memory, which only `allProgress` without a database would return. And its read-then-cache order could put an older row back over `recordRun`'s in-flight one if a read started in the moment between a run's end and `recordRun`'s own memory write; the finish sheet's door cannot be tapped that early. Both are properties of `progressStore.getProgress` (`DrillScreen` reads it the same way), not changed here.

## Not G96's (item 14), untouched

G97 and when a sheet closes (no owner added to `openSheet`; `close` changes only where focus goes); G92's other parts and its two-badge line (item 10 recorded beside it); G88's Plan and *Next up*; G94's swap sheet and its `TodayScreen.ts` and `db.ts` comments; G95; *Keep it playable* from any state but no project (pinned unchanged by (g) and the table test); the Score screen's door beyond item 5's window; `ScoreScreen.ts`, `help.ts`, `sessionRun.ts`, `style.css`, `ScoreScreen.css`, `progressStore.ts`, `encounterStore.ts`, `db.ts`, every other screen, `tools/**`, `content/**`. `docs/prompts/checks.json`: not touched (no new spec file).

## Questions

1. Deviation 1–3 (the resolver, `ProgressScreen.ts`, the *Details* class): read back as the approval meant?
2. Follow-ups 2 and 3: one row for a PDF's Details (the guessed-level sentence and *Type: song*)?
3. Follow-up 4: keep the store's read through `getProgress`, or should the progress store offer a read that caches nothing?

## Per fix

- **Offer.** Mechanism: the table keyed on state alone, read by the sheet and the store. Discriminating test: (a) on the committed code, `keep` from no project with no progress row. Red: `promise resolved "{ …(6) }" instead of rejecting` (`red-unit-committed.txt`). Before/after the same way: (i) `expected [ 'save', 'learn', 'polish', 'keep' ] to deeply equal [ 'save', 'learn', 'polish' ]`, then green; browser (x) `+ "Keep it playable"`, then green.
- **Focus.** Mechanism: `close` focused the recorded control, detached by the redraw. Discriminating test: (n) replaced row. Red: `expected <body>…(1)</body> to be <button></button>`; (u) `expected <body> not to be <body>`; (w) `expected <body> to be <div class="list-row" …>`; browser (x) `Received: "the body"`, (z) `Received: "the body"`.
- **PDF line.** Mechanism: `importSourceWords` returns `''` for a PDF and the line fell back to `item.type`. Red: (v) `expected 'L3.0 · song' to be 'L3.0'`; (y) `Received string: "≈ L5.0 · song"`.

## Tests

| test | class | old assumption |
| --- | --- | --- |
| `projectLifecycle` *the offers are the table, from no project Keep it playable only for a piece passed…* | replace | every action in `OFFERS.none` offered for any piece (`actionsFor(undefined)` = `TABLE.none`) |
| `projectLifecycle` *from <state>, on a piece with no pass…* (9) | replace | `keep` from `none` accepted for any piece; paths from nothing through `keep` |
| `projectLifecycle` *learned pieces, contact, familiarity… read the same* (the walk) | replace | `keep`'s path from nothing is `['keep']` on a piece with no pass; the minuet (passed) now ends with *Keep it playable* |
| `projectLifecycle` (a)–(h) | add | — |
| `projectSheet` (i) *…offers three ways in — no Keep it playable, ever drawn…* | replace | four ways in for any piece |
| `projectSheet` (j), (k), (l) | add | — |
| `sheetIsolation` (m), (n), (o), (p), (r) | add | — |
| `libraryProjects` (d)/(s) | replace | `OFFERS.none` on any song |
| `libraryProjects` (t), (u), (v) | add | — |
| `progressProjects` *the offer is the learner's* | revise | offers drawn at the first synchronous draw |
| `progressProjects` (w) | add | — |
| `library.spec` (x); the PDF test extended (y) | add | — |
| `projects.spec` (z) | add | — |

Everything else in these files is preserved.

## Mutants (`mutants.txt`, `scripts-mutants.py`; each source restored, sha256 equal)

1. *Keep it playable* offered again from no project (`actionsFor` returns the row whole): caught by (i) *offers three ways in*, (s) *(d) no project on a song…*, (a).
2. The store's check reading a pass for `keep` while the sheet still hides it: caught by (a) and (b); (i) stays green on it, so the sheet is not what catches it.
3. The refocus fallback removed from `close`: caught by (n), (u), (w).

## Exit codes

See the report's tests list; logs: `red-unit-committed.txt` (15 red, exit 1), `green-unit-named.txt` (103 passed, exit 0), `unit-all.txt` (4 failed: the two `lessonClaimsAboutApp` line-ending claims, and `expectedNote` and `firstContactOnTheScore`, which pass alone, `unit-alone-expectedNote-firstContact.txt`: load), `tsc.txt` 0, `lint.txt` 0, `build-app.txt` 0, `build-app-committed.txt` 0, `red-e2e-committed.txt` (3 red, exit 1), `green-e2e-new.txt` (3 passed, exit 0), `e2e-map.txt` (the map's 15 spec files, each checked to exist, 152 passed, exit 0; at two workers on port 4573 through the config copy, not the map's four on 4173), `mutants.txt`, `pictures-before.txt` / `pictures-after.txt` (6 passed each), `checks-for-paths.txt`. After the doc rows were applied: `docs-tests.txt` (`docsConsistency`, `help` green; `lessonClaimsAboutApp`'s two line-ending claims red, as before; built content copied read-only from the main checkout for that run, then deleted), `checks-for-paths-with-docs.txt` (17 paths matched, no new check), `npm-ci-docs.txt`.

## Unverified

What a screen reader announces where focus lands. Nothing heard. The state gallery and the R1–R6 walks were not run (judgement in the brief: the fallback acts only where the old control is gone, guard (m)).

**Orchestrator's note at the landing (2026-09-29).** G96's worktree committed by name (48bfc167) and merged (e279c31f). The chain on the merged main checkout: the map's test and its minimum for the merged files (`runs/G96/map-min.txt`), typecheck, lint, the whole unit suite, the app build, the spec names checked, then the specs the map's minimum names on the default port (map-tests 0; map-min 0; tsc 0; lint 0; vitest-all 1; build-app 0; specs-exist 1; e2e-targeted 1; e2e-rerun 0 — the unit suite's two recorded line-ending assertions in `lessonClaimsAboutApp` (Entry 101's diagnosis) fail here and pass on the runner — the targeted specs' failures passed alone (`e2e-rerun`); the note names them — the spec-existence step read an empty list because the map names the whole suite, and said so; `runs/G96/orchestrator-exit.txt`). Your ruling on G96 (`responses/9c64a9c1.md`) and your approval of the brief with the default evidence, the sheet listening for the store update and the explicit resolver (`responses/questions-71bd6cee.md`). Landed in one chain with G96, U63 and U105 (the reviewer's batching note allowing it; merge range df275e8f..265e319c): map, typecheck, lint, the whole unit suite (only the known CRLF pair red), the app build, then the whole default browser suite because U63 touched style.css (the map names every spec; specs-exist's 'no specs named' is the guard misreading an empty list): 851 passed, 5 failed, of which four passed alone (mic, modes-play-the-tune, score.fill, wide: load) and one was U63's own waiting-for-reads case, fixed forward at 7a4e5605 after L120c renamed 3.4's song option, then today.spec.ts 21 of 21 alone on the merged main checkout.

## Doc rows

**Applied** in this worktree on the orchestrator's word, into today's text (Entry 147's and Entry 160's pending rows are not yet in the docs, so each row sits where it belongs in the current text):
- `04` §4: one sentence after the import detail-line sentence (X3), before the timewise-MusicXML sentence.
- `04` §5, the project sheet's paragraph (*What next with this piece?*): the offers sentence after the sentence listing the choices and the notes, before *Opening it writes nothing*; the focus sentence after *leaving the screen that opened it closes it*. `04` has no general paragraph on sheets closing, so the sentence sits with the sheet that uses the fallback.
- `01`:275: the `projects` row, after *written only by the project sheet*.
- `08`:45: the faults column's end and the tests column's end, each marked G96.
- `08` file lines :274, :313, :557, :562, :564 (the *four choices* phrase replaced) and :620.

The rows as written:

- **`04` §5 :2452–2454** (the sheet): after *the choices the state offers*, add: "From no project, *Keep it playable* is offered only for a piece the learner has passed — its progress row passed or mastered, *I already know this* included — and the store refuses it otherwise; *Save for later*, *Learn this* and *Prepare it for performance* are offered before any run. The offers are drawn once the sheet has read the record, and a pass stored while the sheet is open brings *Keep it playable* in."
- **`04` §4 :1507–1509** (an import's detail line): add: "A PDF's line names no type: its badge, *PDF · pages, not notes*, says what it is."
- **`04` §5, the sheets' paragraph** (a grep for focus on closing found none): "Closing a sheet gives focus back to the control that opened it, or, where the screen drew its list again behind the sheet, to that piece's row as the list shows it now (the opener names it; the sheet searches nothing)."
- **`01`:275, the `projects` row**: add "reads one fact outside itself, whether the piece is passed (its progress row, by id), for the one offer from no project, *Keep it playable*; writes nothing else."
- **`08`:45, the projects row**: faults gain "*Keep it playable* offered or accepted from no project without a pass; the offers drawn before the record is read; a pass stored while the sheet is open not offered; focus lost to the page after *Close* over a redrawn row"; tests gain (a)–(h), (i)–(l), (m)–(r), (s)–(w), (x)–(z), "red on the committed code; 3 mutants caught".
- **`08` file lines:** :274 `library.spec.ts` add "a song never played offered three ways in from Details' door, focus back on its row after *Close*; a PDF's detail line naming no type (G96)"; :313 `projects.spec.ts` add "*Make it a project* on a passed piece offering *Keep it playable*, focus on the new project row after *Close* (G96)"; :557 `progressProjects.test.ts` add "focus on the new project row after *Close*, not the history row (G96)"; :562 `projectLifecycle.test.ts` add "from no project *Keep it playable* only for a piece passed, a self-pass or mastered included, refused otherwise and writing nothing (G96)"; :564 `projectSheet.test.ts` replace "four choices" with "three choices for a piece never played, never a fourth drawn and taken away; four once passed, and once a pass is stored while open (G96)"; :620 `sheetIsolation.test.ts` add "and gives focus back on closing, to the opener's named replacement where a redraw took the control away (G96)".
