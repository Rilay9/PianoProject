# G96 — From no project, *Keep it playable* is offered only for a piece the record says is passed, and the store refuses it otherwise; after *Close*, focus lands on the row a store redraw put back, through `openSheet`'s own fallback; a PDF import's detail line stops saying *song* (the G85a review's ruling, `responses/9c64a9c1.md`:13–19 and :25–27; backlog G96, P2; Entry 168; app only; sent to the reviewer before dispatch; its builder starts only on the reviewer's word (the owner's rule of 2026-09-30: every brief reviewed first))

**Read first:**
- **Procedure.** `docs/prompts/operating-procedure.md` §1–§5 and §11–§13. §11 :184–186 is the rule for a config copy outside `app/`: name `use.storageState` by an absolute path.
- **The ruling.** `docs/review/responses/9c64a9c1.md`, the whole file (29 lines):
  - :13–19, *Keep it playable* from no project, quoted in item 1;
  - :25–27, focus after a redraw, quoted in item 1;
  - :11, the narrower door rule, approved: no door on a PDF or a placeholder without a project. Keep it;
  - :21–23, the door's words kept (*What next with this piece?*);
  - :29, G85a closes G85.
- **The rows.** `docs/prompts/backlog-2026-09-25.md`:270 (G96; its view is `docs/prompts/views/backlog/G.md`:159). For context: G91 :266, G92 :267, G93 :265, G94 :268, G95 :269, G97 :271, and G88 :262 for its `projectStore.ts` comment.
- **The door's contract.**
  - `docs/prompts/entry-147.md` (G85): :6 (two badges on two lines, over R2's 96); :80, Follow-ups 6 (both ways out are product choices).
  - `docs/prompts/entry-160.md` (G85a):
    - :10, the sheet from no project pictured with four offers under *You have never opened it.*;
    - :14, focus falls to the body (its probes `focusAfterClose` and `item8FocusAfterClose`);
    - :25, the honest-door rule;
    - :58–64, Follow-ups 1–5, which are G96's four parts;
    - :145 onward, its `## Doc rows`, written against Entry 147's.

    Both entries' doc rows are still pending: a grep for `G85` in `docs/04-ui-spec.md`, `docs/01-architecture.md` and `docs/08-test-map.md` at HEAD found none.
  - `docs/prompts/runs/G85a/scripts-zz-g85a-pictures.spec.ts` and `scripts-build-committed-app.py` are the shape for the pictures and the before build.
- **The code at HEAD 4afc3ac0,** quoted in item 3:
  - `app/src/data/projectStore.ts`:
    - :1–35, the header (:18–22 and :87–89 stale);
    - :37, what it imports from `progressStore`;
    - :60–67, the `OFFERS` comment; :68–78, `OFFERS`; :80–83, `actionsFor`;
    - :212–258, `applyProjectAction` and `applyNow` (:229–234, the check; :233, the refusal's words).
  - `app/src/ui/projectSheet.ts`:
    - :1–14, the header; :18, `familiarity` imported; :56–63, `metLine`; :84–88, the sheet closing with its screen;
    - :113–126, `act`; :128–150, `drawActions`;
    - :230–238, `draw`; :240, the first draw; :241–253, the two reads.
  - `app/src/ui/widgets.ts`: :213–214 (a clickable `listRow` is `role="button"`, `tabIndex` 0); :253–263, `isolate`; :265–293, `openSheet` (:266, `returnFocus`; :269–274, `close`; :279, *Close*; :283–285, a tap outside; :286–288, Escape).
  - `app/src/ui/screens/LibraryScreen.ts`:
    - :725–831, `showDetail` (:764–774, the estimated-level sentence);
    - :833–867, `projectDoor` (:845–851, its comment; :855, where it appears; :860–865, the tap);
    - :1024–1120, `rowFor` (:1025–1033, the badges; :1085–1088, the detail line; :1092–1104, the row's data);
    - :1204 and :1207, the list emptied and refilled;
    - :1346–1365, `projectsChanged`; :1452–1453, its listener.
  - `app/src/ui/screens/ProgressScreen.ts`: :401–464, `drawProjects` (:404–409, `reload`; :410–412, `open`; :422–423, a project's row; :427, the passed filter; :437–438, *Make it a project*); :496, :558, :586, other rows that carry `data-item`.
  - `app/src/ui/screens/ScoreScreen.ts`, read and not touched: :3669–3710, `save`, not awaited; :3999 and :4054, the finish sheet's door.
  - Read only:
    - `app/src/data/progressStore.ts`: `getProgress` :150–157, `recordRun`'s status :240–242, `selfPass` :466–477, `contact` :668, `learnedPieces` :1187–1192;
    - `app/src/data/encounterStore.ts`: the facets :186–195, `familiarity` :430–434;
    - `app/src/ui/help.ts`: `PROJECT_TEXT` :629 (actions :638–648, the met lines :662–665), `playedLine` :713, `importSourceWords` :2051–2060;
    - `app/src/data/importStore.ts`: `importToCatalogItem` :1245–1273;
    - `app/src/curriculum/session.ts`: :32–33 and :759;
    - `app/src/ui/screens/screenFrame.ts`:21;
    - `app/src/ui/screens/TodayScreen.ts`: :540, :788, :822.
- **Docs.**
  - `docs/04-ui-spec.md`: §5 :2446–2458 (the sheet; :2452–2454, *the choices the state offers*); §4 :1507–1509 (an import's detail line); §6 :3605–3613 (Progress's Projects).
  - `docs/01-architecture.md`:275 (the `projects` store).
  - `docs/08-test-map.md`:45 (the projects row), and the file lines :274, :313, :557, :562, :564, :620.
- **Tests.**
  - `app/tests/unit/projectLifecycle.test.ts`: :255–265, `TABLE`; :268–282, `pathsFromNothing`; :285–305, the table pin (:287–288); :307–332, the loop from every state; :334–348; :486–490, the walk; :633–640, *learn this piece* before any success.
  - `app/tests/unit/projectSheet.test.ts`: :65–67, `actions()`; :75–79, `open`; :117–150; :182–194.
  - `app/tests/unit/sheetIsolation.test.ts`, the whole file (85 lines; nothing on focus).
  - `app/tests/unit/libraryProjects.test.ts`: the fixtures :32–75 (`import.pdf` :72); :422–437, case (d); :474–483, the source pin.
  - `app/tests/unit/progressProjects.test.ts`: :130–153.
  - `app/tests/e2e/library.spec.ts`: :82–94 (a PDF import); :252 onward, G85's and G85a's describe (:339–453, the Details door).
  - `app/tests/e2e/projects.spec.ts`: :202–292 and :304–367 (Progress's *Make it a project*, then *Keep it playable*, on seeded passed and mastered pieces).

## What is decided

1. **The ruling, verbatim** (`responses/9c64a9c1.md`:13–19 and :25–27):

   > ### “Keep it playable” from no project
   >
   > **Record G96 as a real product bug.**
   >
   > `Keep it playable` implies maintenance of something the learner has already played/learned. It should not be an initial project action for a piece with no evidence/contact supporting that history.
   >
   > Do not block G85a on this because the bad offer belongs to the shared project-sheet offer policy, not the Library door. G96 should constrain the no-project offer set from actual encounter/progress truth.

   > ### Focus after redraw
   >
   > G96/P3 is legitimate. A sheet close should restore useful focus even when the underlying row was replaced by a store-driven redraw. Fix this at the reusable sheet/refocus mechanism if possible, not with a Library-only timeout.

   The backlog records the row as P2 (*"G96 becomes P2"*, :270) for the offer. The reviewer calls the focus part P3.

   **The goal, in this brief's words:**
   - The project sheet never offers to keep playable a piece the learner has not shown they can play, whichever door opened it, and the store will not record it either.
   - Closing the sheet puts the learner back on the same piece's row, even when the list behind the sheet was redrawn.

2. **The rows.** This lane closes G96, all four parts:
   - part 1, focus: item 7;
   - part 2, the offer: items 5, 6 and 9;
   - part 3, the PDF's *song*: item 8;
   - part 4, the two-line title: item 10, fixed or recorded.

   **Context, and what stays open:**
   - G91, ruled: Details is the door, and G85a built it.
   - G92, G85's small follow-ups. Its two badges on two lines are the sibling of part 4 and stay open.
   - G93, fixed in G1e.
   - G94, ruled. It assigns `projectStore.ts`'s stale header sentence to the next seam that owns the file, which is this one (item 6).
   - G88. It assigns `projectStore.ts`'s `PROJECT_STAGES` comment to the file's next touch (item 6).
   - G95, not this lane's.

   **G97 is not this lane.** G97 asks which sheets close when their screen goes: each screen's disposer, or `openSheet` closing on its owner's dispose. That is the reviewer's open question on G86's handoff. This lane changes only where focus goes when a sheet closes. It never changes when or whether a sheet closes, and it adds no owner to `openSheet`.

3. **Premises, checked at the line** (HEAD 4afc3ac0, the main checkout).
   - **The table is keyed on the state alone.** Held.
     - `projectStore.ts`:69 is `none: ['save', 'learn', 'polish', 'keep'],`.
     - :81–83 is `export function actionsFor(state: ProjectState | undefined): readonly ProjectAction[] { return OFFERS[state ?? 'none']; }`.
     - The comment above them (:61–63) gives the reason: *"From no project: the first three states and *Keep it playable* (a piece already learned, made a project from Progress)"*. The offer was meant for Progress's door, and the table cannot tell which door opened it.
   - **The store's check reads the same table.** Held.
     - `applyNow` :229–234: `const existing = await projectFor(target); if (!actionsFor(existing?.state).includes(action)) { … throw new Error('That is not offered for this piece now.'); }`. So a *Keep* from no project is accepted for any piece.
     - The module reads nothing of progress. It imports only `dayKey` from `progressStore` (:37).
     - `progressStore.ts` imports nothing from `projectStore` (a grep of both stores' imports), so a read from there adds no cycle.
   - **The sheet draws the table.** Held, with one correction.
     - `drawActions` is at `projectSheet.ts`:128, and its first line is `const offered = actionsFor(project?.state);` (:129).
     - The module does import `familiarity` (:18), but only `metLine` reads it (:56–63), for *You have never opened it.* and its kin. `drawActions` does not.
     - The first draw (:240) runs before the project read (:241–245) and the history read (:246–253) answer, so the offers are drawn once from no project and then again.
   - **The readers of `actionsFor` in `app/src`.** A grep for `actionsFor|OFFERS` outside the store finds `projectSheet.ts`:129 alone, plus a comment in `LibraryScreen.ts`:847.
   - **The doors.** There are three `openProjectSheet` callers:
     - `ScoreScreen.ts`:4054: the finish sheet's *What next with this piece?*, on any song after a run, passed or not.
     - `ProgressScreen.ts`:410–412. It opens from a project's row (:422) and from *Make it a project* (:437), and the offers are drawn from `rows.filter((row) => row.status === 'passed' || row.status === 'mastered')` (:427).
     - `LibraryScreen.ts`:864, Details' door on any song that opens on the Score screen (:855), played or not.

     So the Library's door is the one that reaches a never-played piece, and the Score screen's reaches one played but not passed.
   - **Focus after *Close*.** Held.
     - `widgets.ts`:266 is `const returnFocus = document.activeElement;`. `close` (:269–274) runs `release?.(); … root.remove(); if (returnFocus instanceof HTMLElement) returnFocus.focus();`.
     - Nothing checks that the element is still in the document. A detached element's `focus()` does nothing, so focus falls to the body (observed, Entry 160 :14).
     - The Library's redraw is `projectsChanged` (:1352–1365). It waits a task (`setTimeout(…, 0)`, :1354), reads the store, and calls `draw()`. `draw()` empties the list (`list.replaceChildren();` :1204) and appends new rows (`list.append(rowFor(item));` :1207). The list element stays; every row and its *Details* button are new.
     - The door's tap (:860–865) runs `sheet.close()`, so Details' `close` focuses the row's *Details*. It then opens the project sheet, whose `openSheet` records that button (:266).
     - Progress's `reload` (:404–409) redraws `#progress-projects` the same way after the sheet's `onChange`.
   - **The PDF's detail line.** Held.
     - `LibraryScreen.ts`:1086 is `meta: [levelLabel(item.level, item.levelSource), shortHandsLabel(item.hands), (item.imported ? importSourceWords(item) : '') || item.type]`.
     - For a PDF, `importSourceWords` returns `''` (`help.ts`:2058: `if (row.kind === 'pdf' || !row.provenance) return '';`).
     - So the line falls back to `item.type`, and that is `'song'` for every import (`importStore.ts`:1248).
     - Entry 160 pictured it as *≈ L5.0 · song* (Follow-ups 3). The badges are at :1025–1033; the PDF's `'PDF · pages, not notes'` is at :1032.
   - **The tests.** Besides the sheet's, the widget's, the Library's and the two browser files, two more encode the table: `projectLifecycle.test.ts` (:255–265, :287–288, :307–332, :486–490) and `progressProjects.test.ts` (:130–153, preserved).

4. **The mechanism, as a hypothesis with its test.**
   - **The hypothesis.** I hold that the offer table is keyed on the project state alone and never on the piece's evidence (:68–83). So `none` offers *Keep it playable* for a piece with no passed run, through every door, and the store accepts it for the same reason (:230).
   - **The refuting test.** If `actionsFor`, or whatever the sheet draws from at your base, already reads the piece's evidence and the sheet only mislabels what it draws, the fix is in the sheet, not the store. Read both before choosing, and report which held. At drafting the reading says the table alone (item 3). The observations are item 11's (a) and (i), red on the committed code.
   - **Focus.** I hold that `close` focuses a detached element. The test is to read `returnFocus.isConnected` at close in case (u). `false` holds the hypothesis. `true` means another cause (an `inert` left set, for instance), and the fix follows that cause.

   **Items 5–10 are the six things to build, in the order the orchestrator set them.** The report answers each by its number, done or with an explicit not-done line.

5. **The offer from no project follows the piece's evidence.**
   - **A song never played, opened from the Library's Details door.** It reads as follows, every word unchanged from `PROJECT_TEXT`:
     - *Not a project yet*
     - *You have never opened it.*
     - *Save for later* · *Learn this* · *Prepare it for performance*

     There is no *Keep it playable*.
   - **A piece Progress lists under *Pieces you have passed, not yet projects*.** Opened by *Make it a project*, it reads as now:
     - *Not a project yet*
     - *You last played it on 2026-09-28.* (its own day)
     - *Save for later* · *Learn this* · *Prepare it for performance* · *Keep it playable*
   - **The Score screen's door** follows the same rule through the sheet: three offers after a run that did not pass, four once a pass is on the record.
   - **No new words.** The sheet does not say why *Keep it playable* is absent. `help.ts` is another lane's (G86a). If the picture tells you a learner needs a sentence, that is a Question with the picture, not a sentence built.
   - **One draw, no flash.** *Keep it playable* is drawn only once the evidence is read, so a never-played piece never shows it and then loses it. How the sheet waits is yours; one read that answers the project and the offer together is the obvious shape. Case (i) holds it.
   - **The Score screen's window (read, not touched).** `save` is not awaited (`ScoreScreen.ts`:3669–3673: *"not awaited: the numbers are already final"*). So the finish sheet and its door are up while `recordRun` is in flight, and a tap in that window can read the progress row before the pass is on it. Choose one, and give a unit case either way:
     - the sheet redraws its offers on `onProgressChange` while it is open (its own file; the listener goes with the sheet), or
     - the window is recorded as scoped and not fixed.
   - **Unchanged.**
     - The offers from every other state. `learning`, `performance-ready` and `refreshing` keep *Keep it playable*, because the ruling is about no project.
     - A learner who knows a piece from outside the app still reaches *Keeping it playable* from no project, in two taps: *Learn this*, then *Keep it playable* (`OFFERS.learning`, :71).
     - *Learn this* and *Prepare it for performance* stay offered before any run (G1b's adversary, `projectLifecycle.test.ts`:633–640).

6. **The store refuses.** `applyProjectAction(target, 'keep')` from no project, on a piece without the evidence, throws the store's existing *That is not offered for this piece now.* (:233) and writes nothing, whoever calls it.
   - **One policy, read by both.** The offer set from no project is decided in `projectStore.ts`, in one exported function. The sheet draws from it and `applyNow` checks it. The sheet holds no second copy of the rule.
   - **The store reads the evidence itself.** Never through a flag a caller passes in: a caller able to say "passed" would put the refusal back in the caller's hands.
   - **The table.** You choose whether `OFFERS.none` keeps `'keep'` as a conditional entry or the policy adds it on the evidence; say why. `projectLifecycle.test.ts`'s `TABLE` and its pin move with the choice.
   - **The comments.**
     - The header (:1–35) gains the one read the store now makes: whether the piece is passed, for the one offer from no project. It still writes nothing but the project.
     - Two header sentences are stale, and the backlog assigns each to the next seam that owns this file:
       - :18–22, *"the review's repertoire retention does not offer a piece whose project is `paused` or `retired`"*. Since G1e every automatic chooser asks (`session.ts`:32, `usable()` :759; G94, `responses/9fce3792.md`).
       - :87–89, *"as `session.ts` keeps its own `PROJECT_STAGES`"*. `session.ts`:33 imports the store's (G88).

       Correct those two sentences and nothing else of G88 or G94.
     - The `OFFERS` comment (:60–67) and `projectSheet.ts`'s header (:8) state the new rule.
     - `LibraryScreen.ts`'s door comment (:846–848, *"the sheet's four offers from no project are the learner's intentions, allowed before any run"*) follows the evidence.

7. **After *Close*, focus lands on the redrawn row, from `openSheet`.**
   - **What the learner meets.**
     - In the Library: Details, then *What next with this piece?*, then an action, then *Close*. Focus is back on that piece's row, on its *Details* button where the new row has one, never on the page's body.
     - On Progress: *Make it a project*, then an action, then *Close*. Focus lands on the piece's new project row.
   - **Where.** In `openSheet`'s `close` (`widgets.ts`:269–274), for every sheet and for all three ways one closes: *Close* (:279), a tap outside (:283–285) and Escape (:286–288).
     - No Library timeout.
     - No focus call in the Library or on Progress after a redraw.
     - No timer in `openSheet`: the fallback runs inside `close`.
   - **The rule.**
     - Where the element focused at open is still in the document, focus goes back to it, as today.
     - Where it is gone, focus goes to its replacement. Find the element with the same `data-item` inside the nearest ancestor of the old element that is still in the document. Inside that row, take the control that matches the old one (by its text or `aria-label`), else the row itself.
     - Record the ancestors at open. At close the old row is detached, and a removed node's `parentNode` is `null`, so walking up from the stale control reaches only the detached row.
     - Set focus after `release()` (:270): nothing inert takes focus.
     - Where no replacement is found, nothing new happens, as today.
   - **Never on the next screen.**
     - The ancestor search stops at the screen's own `section[data-screen]` (`screenFrame.ts`:21).
     - The project sheet closes itself when its screen goes (`projectSheet.ts`:84–88). The next screen's rows may carry the same `data-item` (Today's, `TodayScreen.ts`:540, :788, :822), and focus lands in none of them.
   - **Never in another list on the same screen.** Progress puts the same item's `data-item` on its repertoire, performance and history rows (`ProgressScreen.ts`:496, :558, :586), as well as on the project row (:423). The container rule picks the project row.
   - **The second choice.** If the fallback cannot be made safe from what `openSheet` records, give `openSheet` an option through which the opener names where focus goes. That is still the reusable mechanism, never a screen's timeout. Record it as a deviation, with the reason.
   - **Scoped.** A *Close* before the redraw lands (inside the task `projectsChanged` waits) focuses the old button, which the redraw then replaces. Probe whether a learner can reach that window. Record what you find; do not fix it.

8. **A PDF import's detail line.**
   - **Verify the wording first,** in the browser: `library.spec.ts`:82–94 imports a PDF; read the row's `.list-row__metatext`. At drafting it reads *≈ L5.0 · song*.
   - **After:** a PDF's line carries no type, so it reads *≈ L5.0*. The badge beside it, *PDF · pages, not notes* (:1032), already says what it is. `importSourceWords`' own comment says the same: *"`''` where the row does not say (a PDF, whose badge does …)"* (`help.ts`:2051–2056).
   - **Where:** `LibraryScreen.ts`:1086 alone, with no new word.
   - **Unchanged:**
     - a MusicXML or MIDI import keeps *read from the file* or *converted from MIDI*;
     - a bundled song keeps *song*;
     - an import from before provenance keeps *song*, which is true of it. That case is not this lane's.

9. **The evidence: a sub-choice you make and state with its reason.**
   - **The default: a pass on the record.** The piece's progress row is `passed` or `mastered`.
     - This is the predicate Progress's list is drawn from (`ProgressScreen.ts`:427; `learnedPieces`, `progressStore.ts`:1187–1192).
     - A passed run writes it (`recordRun` :240–242).
     - So does *I already know this* (`selfPass` :466–477, called from `LessonScreen.ts`:322 and `PaperScreen.ts`:355). That is the learner's own statement that they know the piece, the same kind of statement as a project action.
     - **Why the default:** build item 1's second half then holds for every piece Progress offers, and the door that lists a piece and the sheet it opens agree by construction.
   - **Read by the item's id,** as Progress reads it. A pass under another id of the same material does not count, by the store's own rule, *identity fails conservatively* (:26–29). Widen it to the material only with a reason.
   - **The alternatives.**
     - *A stored run with `passed: true`* (the `sessions` store). It drops self-passes. It also drops what `projects.spec.ts` seeds without that field: at :314–315, a `mastered` progress row beside a session row with no `passed`, which reaches *Keep it playable* through Progress today (:338). If you take it, say which Progress rows lose the offer and why.
     - *Any contact* (`contact`, `progressStore.ts`:668, or `familiarity`). It admits a piece only opened or heard, which the ruling's *"already played/learned"* does not support. If you take it, make it at least a run (`attempted`), and say why.
   - **The self-pass case to look at.** A learner who said *I already know this* on a lesson page and never opened the piece sees *You have never opened it.* above *Keep it playable*. It is honest; judge it on the picture and report it.

10. **The two-line title with a badge.** This is G96's fourth part (Entry 160 Follow-ups 4), the sibling of Entry 147's Follow-ups 6 and of G92.
    - **Measure it** at 342 × 740, on the *(hands together)* *Twinkle* row with a project badge, as Entry 160's facts files did. Report its height against R2's 96 as a relationship; assert no number measured on this machine.
    - **Fix it only** if `LibraryScreen.ts` alone can. Two limits:
      - The fix must not change what the row says: no badge dropped and no words shortened. G85 called both of those product choices (Entry 147 :80).
      - It must not touch `style.css`, which belongs to U63's lane. The title's clamp is in `style.css` (`#library-list .list-row__title`, :621–622).
    - **Expected: recorded, not fixed.** At drafting I see no change that meets both limits. Record it with the picture.

11. **Red first, unit.** Record each red case with its red line on the committed code, and mark each guard as green by design.
    - **The store,** in `projectLifecycle.test.ts`:
      - (a) No project and no progress row: `keep` is refused (`/not offered/`), `projectFor` is still `undefined`, and every other store is unchanged. Red: the piece enters `maintaining`.
      - (b) The same after a run that did not pass (`started`): refused.
      - (c) After a passed run: accepted, `maintaining`, one history line with `why: 'keep'`. Guard.
      - (d) After `selfPass`: accepted under the default, otherwise whatever your definition answers.
      - (e) A `mastered` row: accepted.
      - (f) `save`, `learn` and `polish` from no project on a never-played piece: accepted, as now. Guard.
      - (g) `keep` from `learning`, `performance-ready` and `refreshing` on a never-played piece: accepted, as now. Guard.
      - (h) The evidence read writes nothing: `everyOtherStore` is equal before and after an accepted and a refused `keep`.

      **Replaced, with the reason and the class (§11):**
      - the `TABLE` pin (:255–265, :287–288);
      - the loop from every state (:307–332), which takes `keep` from `none` for any piece;
      - the walk (:486–490), where `keep`'s path from nothing is `['keep']` on a piece with no pass.

      All three assumed that every action in `OFFERS.none` is offered for any piece.
    - **The sheet,** in `projectSheet.test.ts`:
      - (i) Never opened: `actions()` is `save`, `learn`, `polish`, with the three labels quoted in item 5. There is no `#project-action-keep`, and no Keep button appears at any moment while the reads answer (observe `#project-actions`). Red: four offers. It replaces :118–135's *"offers four ways in"* (class replace).
      - (j) Viewed, heard, and played without a pass: no Keep.
      - (k) Passed: four offers with *Keep it playable*; tapped, the sheet reads *Keeping it playable since …*. Guard.
      - (l) The Score screen's window (item 5), as you decided it.
    - **The widget,** in `sheetIsolation.test.ts`:
      - (m) The target is still in the document: it is focused. Guard.
      - (n) The row is replaced in the same list: a `div.list-row[data-item]` holding a button, the list emptied, a new row appended. Focus goes to the new row's matching button. Red: the body.
      - (o) The new row has no matching control: focus goes to the row.
      - (p) The screen is replaced: the old `section[data-screen]` is gone, and a new one holds a row with the same `data-item`. Focus lands in no row of the new section.
      - (q) The same `data-item` sits in two containers of one section: focus goes to the one in the old row's container.
      - (r) *Close*, Escape and a tap outside each take the fallback.
    - **The Library,** in `libraryProjects.test.ts`:
      - (s) Case (d) (:422–437), revised: `song.none`, never played, shows the three offers. The old assumption was `OFFERS.none` on any song (class replace).
      - (t) A passed song with no project (seed a passed `recordRun`): the door opens the sheet on four offers, with *Keep it playable*.
      - (u) The door, *Learn this*, the badge's redraw awaited, then *Close*: `document.activeElement` is inside `#library-list [data-item="song.none"]`, not the body. Red: the body.
      - (v) `import.pdf`'s `.list-row__metatext` holds no *song* and keeps the level; `import.mine` keeps its source words; a bundled song keeps *song*. Red: *song*.
    - **Progress,** in `progressProjects.test.ts`:
      - (w) *Make it a project*, *Keep it playable*, then *Close*: focus is on `#progress-projects [data-project][data-item="song.passed"]`. Red: the body.
      - :130–153 is preserved.

12. **Browser, red first on the lane's own port; and the pictures.**
    - **In `library.spec.ts`,** in G85's describe (:252 onward):
      - (x) Pick a never-played bundled song the offline build carries. Open Details, then the door. The sheet reads *Not a project yet* and *You have never opened it.*, and its buttons are exactly *Save for later*, *Learn this* and *Prepare it for performance*. Tap *Learn this*, then *Close*. Poll until `document.activeElement` is inside `#library-list .list-row[data-item="…"]`. Red on the committed build: *Keep it playable* is present and focus is on the body.
      - (y) Extend :82–94: the PDF row's detail line has no *song*. Red, then green.
    - **In `projects.spec.ts`:**
      - (z) Progress's *Make it a project* on a seeded passed piece shows the four offers, *Keep it playable* among them; the flows at :267 and :338 already take it. After *Close*, focus is on the piece's project row. Red for the focus.
    - **The pictures,** at 342 × 740, in `docs/prompts/pictures/g96/`, before (the committed build) and after:
      - the sheet from the Library's Details on a never-played song;
      - the sheet from Progress on a passed piece (after only; it is unchanged);
      - the PDF row;
      - the two-line title with a project badge (item 10).

      Take them from a lane-only picture spec: copy it into `app/tests/e2e/` for its run and remove it afterwards; keep it as `runs/G96/scripts-*.spec.ts`; let it write under `test-results/`; copy the PNGs out by hand. **A committed spec never writes under `docs/`.**
    - **What neither layer observes:** what a screen reader announces where focus lands. Say *unverified with a screen reader*.

13. **Mutants, a budget of three.** Kill and record each with the test that caught it:
    - *Keep it playable* offered again from no project (the evidence condition removed from the policy): (i), (s), (x).
    - The store accepting `keep` without the evidence while the sheet still hides it (the store's check skipped): (a).
    - The refocus fallback removed from `close`: (n), (u), (w).

14. **Not G96's.** Record each with its line.
    - G97, and any change to when a sheet closes.
    - G92's other parts, and its two-badge line (item 10 is recorded beside it).
    - G88's Plan and *Next up*; G94's swap sheet and its other two comments (`TodayScreen.ts`, `db.ts`); G95.
    - *Keep it playable* from any state other than no project.
    - The Score screen's door, beyond item 5's window.
    - **Record it; do not fix it:** a PDF's Details says *The app guessed this level from the music itself — change it if it feels wrong.* (`LibraryScreen.ts`:764–774) of a level nobody guessed. A PDF has no notes, and an import with no level gets 5, marked estimated (`importStore.ts`:1250, :1255). The row's *≈ L5.0* is that same placeholder. Confirm it, and classify it: it is a false sentence on screen.
    - **Files not to touch:**
      - `ScoreScreen.ts` and `help.ts` (G86a: merged in the main checkout at drafting, under review);
      - `sessionRun.ts` (U102);
      - `style.css` (U63);
      - `ScoreScreen.css` and `ProgressScreen.ts`;
      - `progressStore.ts`, `encounterStore.ts` and `db.ts` (no schema change);
      - every other screen, `tools/**` and `content/**`.

15. **When to deviate** (§13).
    - If a premise here is wrong at your base, say so at the item and take the better path, recording why.
    - If the refuting test holds and the sheet already reads the evidence, fix the sheet and say so.
    - If the evidence read cannot sit in the store without a cycle or a read of the catalogue, say where it went and why.

## Verification layers

**Unit.**
- Red first (item 11): on the committed code, then green.
- Then `npx vitest run tests/unit/projectLifecycle.test.ts tests/unit/projectSheet.test.ts tests/unit/sheetIsolation.test.ts tests/unit/libraryProjects.test.ts tests/unit/progressProjects.test.ts tests/unit/projectOnTheFinishSheet.test.ts tests/unit/stage9ProjectsPage.test.ts`.
- Then the whole `npx vitest run`. The two `lessonClaimsAboutApp` line-ending claims fail on a CRLF checkout and pass on the runner (Entry 101's diagnosis); name them if they are the only red. Attribute every other failure and rerun it alone.

**The rest of the chain.** `npx tsc -b`; `npm run lint`, with no port config inside `app/`; `npm run build:app`.

**The map.** Run `python tools/docs/checks_for_paths.py <final changed paths>` and record what it prints. At drafting, for `projectStore.ts`, `projectSheet.ts`, `widgets.ts`, `LibraryScreen.ts`, the five unit files, `library.spec.ts`, `projects.spec.ts` and the three docs, it named:
- tsc, lint, the whole unit suite and the app build;
- these specs (`tests/e2e/<name>.spec.ts`): `app-shell`, `doors`, `empty-states`, `feedback-placement`, `finder`, `landscape`, `lesson-flow`, `library`, `modes-rhythm-only`, `progress`, `projects`, `today`, `transfer-offer`, `wide`.

`widgets.ts`'s row (`app/src/ui/*.ts`) names the five R1–R6 walks. `openSheet`'s `close` runs on every sheet, but the fallback acts only where the old target is gone, and guard (m) holds that. So judgement adds no spec.

**`docs/prompts/checks.json`.** Nothing to touch while the cases go into `library.spec.ts` (named by the `LibraryScreen.ts` row) and `projects.spec.ts` (named by the `projectStore.ts` and `projectSheet.ts` rows). If you add a new spec file instead:
- add it to the rows whose modules it tests, each with its reason: `app/src/ui/screens/LibraryScreen.ts`, `app/src/ui/projectSheet.ts` and `app/src/data/projectStore.ts`, and `app/src/ui/*.ts` if it tests `openSheet`;
- add a `docs/08` file line for it.

A `checks.json` change is a test-map change: list it in the report, for the reviewer.

**Browser.**
- The new cases first, alone, on the committed build (red), then green.
- Then every spec the map printed, at `--workers=2` on port 4573. Check that each file exists before the run: a path that resolves to no file is dropped silently.
- Run through a copy of `app/playwright.config.ts` kept under `build/g96/`, not in `app/` and not for the commit:
  - `testDir` absolute;
  - the webServer's cwd `app/`, serving on 4573, with `baseURL` on 4573;
  - `use.storageState` an **absolute** path to `build/g96/storageState-4573.json`, the fixture re-keyed to `http://localhost:4573`. A config copy outside `app/` resolves a relative `storageState` against `app/` (§11 :184–186).
- Nothing on port 4173: it is the main checkout's.

**The product layer.** The pictures. Nothing is heard. The sheet's words are unchanged and no new copy appears. Focus is observed in Chromium; *unverified with a screen reader*.

## Rules and files

**You own:**
- `app/src/data/projectStore.ts`: the offer policy from no project; `applyNow`'s check (:229–234); the `OFFERS` comment (:60–67); the header's new read and its two stale sentences (item 6);
- `app/src/ui/projectSheet.ts`: `drawActions` and the read it draws from, and the header (:1–14);
- `app/src/ui/widgets.ts`: `openSheet` (:265–293), what it records at open and what `close` focuses. Nothing else in the file;
- `app/src/ui/screens/LibraryScreen.ts`: the detail line (:1086) for a PDF; the door's comment (:845–851); item 10 only on its condition;
- the tests items 11 and 12 name;
- the pictures, and `docs/prompts/runs/G96/`;
- the entry's `## Doc rows`. These are not direct edits: Entry 147's and Entry 160's rows for the same sections are still pending, and these rows are written against them.
  - `04` §5 :2452–2454: the choices from no project, with *Keep it playable* only for a piece passed (by your definition);
  - `04` §4 :1507–1509: a PDF's detail line names no type, because its badge says what it is;
  - `04`: one sentence where it states what a sheet does on closing (a grep of `04` for focus on close found none): focus returns to the control that opened the sheet, or to that control's row where a redraw replaced it;
  - `01`:275, the `projects` row: the store reads one fact outside itself, whether the piece is passed, for the one offer from no project;
  - `08`:45: the faults gain *Keep it playable* offered or accepted from no project without a pass, and focus lost after a redrawn row. Update the file lines :274, :313, :557, :562, :564 and :620.

**Not yours:** everything item 14 names.

**Base.** Origin's head at dispatch, stated in the entry; the orchestrator cuts your worktree from it.
- HEAD at drafting: 4afc3ac0 in the main checkout, with G86a merged there. Origin's head at the last fetch: 2da6b8ef.
- The files this brief names are the same at both, except `help.ts` and `ScoreScreen.ts`, which this lane only reads.

**Fresh-worktree setup,** as U102's:
- `npm ci` in `app/`;
- `python tools/midi-cleanup/tests/parity_reference.py`;
- `python tools/content/build.py --offline` (Q24). Copy `content/scores/imported/{kern,musetrainer,mutopia}` and `build/cache` read-only from the main checkout. If the build cannot produce `app/public/content`, copy that folder from the main checkout and say so;
- snapshot `docs/prompts/inventory.md`, `docs/prompts/rung-claims.md`, `content/scores/imported/SOURCES.md` and `docs/generated/ladder.md` before the content build, and restore them after. `git status` shows none of them.

**The rules.**
- Never name an AI model. Never assert a number measured on this machine.
- No commits, pushes, stashes, resets or checkouts. Never write in the main checkout.
- Your own worktree, cut by the orchestrator. Port 4173 is the main checkout's; the lane runs on 4573 (above).
- Temp state goes under the worktree's own gitignored `build/`.
- No learner-facing text saying that anything waits for review.
- The disk is nearly full.
  - When the run is over, after the pictures and captures are copied out, delete the worktree's `app/dist`, `app/test-results` and `app/node_modules`, the copied caches (a copied `app/public/content` among them) and the config copy.
  - Keep no log over 300 KB in the run folder. Keep the summary and the failing names, and say the full log was not kept.
- Every item done, or an explicit not-done line.
- When a premise here is found wrong, say so and take the better path, recording why.

## Report

**Judgement first,** in this shape:
- **What a learner now meets differently,** at 342 × 740, each with its picture: the sheet from the Library on a never-played song; the sheet from Progress on a passed piece; where focus is after *Close*, on both; the PDF row. *Nothing heard* and *unverified with a screen reader* go in the first lines.
- **Which held:** the store or the sheet (item 4), and the evidence definition you chose, with its reason (item 9).
- **Deviations,** each with its reason.
- **Questions.**
- **Not run as the map writes it:** every check the map printed that you ran otherwise (the port, the workers, the config copy) or did not run, and why.

**Then** Done / Not done / Follow-ups / Questions / Files.
- Items 5–10 are each done or carry an explicit not-done line, with where the evidence is: a file under `runs/G96/`, a picture, or a test name.
- Follow-ups: item 7's scoped window; item 10, if recorded; item 14's PDF sentence; item 5's Score window, if recorded.

After those:
- per fix: the mechanism, the discriminating test and its red line;
- the tests table, each test with its class (replace, preserve, add) and the old assumption;
- the mutants;
- exit codes;
- what is unverified, beside what passes;
- `## Doc rows`.

State the technical and pedagogical verdicts separately. The pedagogical one is narrow, because nothing taught or judged changes. Whether a learner misses *Keep it playable* on a piece they know from elsewhere is a product judgement; the two-tap path is in item 5. `operating-procedure.md` §11 and §12 apply.

**Entry 168** (the next free number at drafting; the orchestrator confirms it at dispatch). Every run file goes under `docs/prompts/runs/G96/`. The entry is `docs/prompts/runs/G96/ENTRY.md`, starting `### Entry 168 — G96`.

## Reviewer's approval and conditions (`responses/questions-71bd6cee.md`)

Approved for dispatch 2026-09-30. The reviewer's words below govern wherever the brief's earlier text differs: the default evidence (the progress row `passed` or `mastered`, a self-pass included, keyed by the item's identity, enforced in the store with no caller flag); the shared sheet listens for the store update and redraws its no-project offers while open; the focus fallback is an explicit resolver option supplied by the Library and Progress, never a DOM search by text or item in `openSheet`; the PDF line and the two-line title as ruled.

## G96 — offer from no project

**APPROVE FOR DISPATCH, with the default evidence choice and one focus-mechanism constraint.**

### Keep-it-playable eligibility

Use the brief's default:

**from no project, `Keep it playable` is offered only when the item's progress row is `passed` or `mastered`.**

That is the honest product meaning. Merely opening/hearing/attempting a piece does not mean the learner can keep it playable. A failed attempt is also not enough.

A self-pass (`I already know this`) counts because it deliberately establishes the same learner truth the Progress list already treats as known material. The slightly odd combination “You have never opened it” + “Keep it playable” is still coherent: the app has no encounter, but the learner explicitly said they know the piece.

Keep the rule keyed by the item's existing progress identity as Progress does today. Do not widen to material-equivalent ids in this seam.

The store must enforce the same rule the sheet displays. No caller-supplied `passed` flag.

### Score finish-sheet race

Do not allow a just-passed run to permanently miss `Keep it playable` merely because `recordRun` is still in flight when the sheet first opens.

Prefer the shared project sheet to listen for the progress/store update and redraw its no-project offers while open. That keeps the policy in the sheet/store boundary and avoids making Score await persistence solely for this button.

### Focus after redraw

Fix this at the reusable sheet boundary, but **do not make `openSheet` guess globally by searching arbitrary same-text/same-item DOM nodes.**

Use an explicit reusable fallback/resolver option supplied by callers whose opener may be replaced. The Library and Progress know the stable container and item identity of the replacement they want. That is safer than teaching the generic sheet primitive to infer semantic identity from DOM text.

The default behavior remains exactly today's: if the original opener still exists, return focus to it. The optional fallback runs only if it has been detached.

This still satisfies the prior ruling: no Library timeout, no screen-specific delayed focus hack, and the reusable sheet mechanism owns the fallback timing.

### PDF detail line

Approved. A PDF already has its PDF badge; dropping the false fallback word `song` from the metadata line is correct.

### Two-line Library title

Measure and record it as planned. Do not drop the project badge, shorten the title, or touch U63's stylesheet from this seam. It does not block G96's offer/focus fix.

G96 may dispatch.

**Landed 2026-09-29** (Entry 168; 48bfc167, merged e279c31f); handoff `handoffs/48bfc167.md`.
## Record

lane: G96 · closes: G96 · entry: 168
index: From no project, *Keep it playable* only for a passed piece and refused at the store; focus after a redraw; a PDF's detail line (the G85a review's ruling; backlog G96, P2) | app | brief drafted 2026-09-30 (`G96-the-offer-from-no-project.md`); with the reviewer before dispatch; Entry 168; **brief approved for dispatch 2026-09-30, with the default evidence choice and one focus-mechanism constraint** (`responses/questions-71bd6cee.md`); **dispatched 2026-09-30** at a7c232c7, building (Entry 168) |
in-flight: brief drafted 2026-09-30 (`G96-the-offer-from-no-project.md`): from no project *Keep it playable* is offered only for a piece the record says is passed and the store refuses it otherwise; after *Close* focus lands on the row a redraw put back, through `openSheet`'s own fallback; a PDF import's detail line stops saying *song* (the G85a review's ruling, `responses/9c64a9c1.md`; backlog G96, P2); with the reviewer before dispatch (Entry 168). **Brief approved for dispatch, with the default evidence choice and one focus-mechanism constraint** 2026-09-30 (`responses/questions-71bd6cee.md`): from no project *Keep it playable* offered only when the item's progress row is `passed` or `mastered` (a self-pass counts), keyed by the item's existing progress identity and never widened to material-equivalent ids, the store enforcing the rule the sheet displays with no caller-supplied `passed` flag; a just-passed run never permanently misses the offer, the preferred fix the shared project sheet listening for the progress/store update and redrawing its no-project offers while open, so Score never awaits persistence for it; the focus fallback an explicit reusable resolver option supplied by callers whose opener may be replaced (the Library and Progress), never `openSheet` guessing by same-text or same-item DOM nodes, today's return to a still-attached opener unchanged; the PDF line drops *song*; the two-line title measured and recorded, the badge and title untouched and U63's stylesheet not touched. The conditions, verbatim, are in the brief. **Dispatched** 2026-09-30 at a7c232c7, building (Entry 168). **Landed** 2026-09-29 (merged e279c31f, chain green); handoff `handoffs/48bfc167.md`, with the reviewer.
state: dispatched 2026-09-30: dispatched at a7c232c7, building (Entry 168)
- landed 2026-09-30: merged e279c31f; handoff `handoffs/48bfc167.md`
- verdict 2026-09-30: APPROVE WITH ONE REQUIRED CHANGE — G99's PDF Details wording and type fixed on this seam under the fast path before closure, both false statements pinned red first; deviations 1–3 accepted; `getProgress`'s caching read kept (`responses/48bfc167.md`)
