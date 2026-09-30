# U63 — Today's reason keeps its deciding clause: on a session row at 342 px the reason takes two compact lines inside R2's 96 px, where it was one line cut after about thirty characters, and no sentence is rewritten; the swap sheet wears *Paused* / *Put away* beside a piece the learner paused or put away (G94's swap-sheet half, the same file) (backlog U63, P2, the C6 review's finding 6 and `responses/9fce3792.md`:21–25; G94, P3, ruled at `responses/9fce3792.md`:27–35; Entry 170; app only; sent to the reviewer before dispatch; its builder starts only on the reviewer's word (the owner's rule of 2026-09-30: every brief reviewed first))

**Read first:**
- **Procedure.** `docs/prompts/operating-procedure.md` §1–§5 and §11–§13 (§11 :184–186 covers a config copy's `storageState`). `docs/00-invariants.md`:44–47: every change is checked upright (342×740) and sideways (740×342), on a tablet, light and dark, at 100 % and 115 % text.
- **The rows.**
  - `docs/prompts/backlog-2026-09-25.md`:124 (U63) and :268 (G94).
  - For context, :121–131 (U60–U70). Of those, only U64 (:125, a Skills title cut at 342 px beside two buttons) shares the mechanism. Its lanes, U90 and U92, are the precedent for a measured wrap on one list (`style.css`:3688–3699, :3746–3757).
  - `docs/prompts/entry-150.md`:116–118, G1e's Follow-ups 1–3, from which G94 was written.
- **The rulings.**
  - The C6 review, finding 6: `docs/prompts/views/audit/the-c6-review-2026-09-26-artefact-first-against-a5d3d24.md`:44–47.
  - `docs/review/responses/9fce3792.md`: :21–25 (the truncated held sentence, for the row-density/copy owner); :27–31 (the swap sheet); :33–35 (the stale comments).
  - Items 1 and 5 quote them.
- **R2 and Today's contract** (`docs/04-ui-spec.md`):
  - :24–31, R2: *"a Today or Plan row **≤ 96 px** tall"* (:29–30);
  - :147, Today is a hand screen;
  - :161, the title's second line, paid for by the badge line: *"A Today row is four lines deep (title, reason, detail, badges) and 96 px is one title line plus the other three; both at once is 116."*;
  - :316–317, the sentence this lane makes false: *"The line is the session row's second line and is cut at the owner's width, so the claim comes in its first words and the detail after the dash"*;
  - :319–345, the table of lines; :360–380, *"Swap this"*.
- **What was seen.**
  - `docs/prompts/pictures/c6/*-342x740.png`, and `cards.txt`: each card's lines, with a `cut:` flag per reason.
  - `docs/prompts/entry-80.md`:7, the cut; :22, the conditions: `vite preview`, 342 × 740, device scale 2, light, desktop Chromium, C6's build.
  - `docs/prompts/entry-142.md`:10, the same cut seen again by G1d.
- **The code at HEAD a0a8039b.** This is the main checkout, with G86a and U102 merged there and not yet on origin. Origin's head, 2da6b8ef, holds every file below byte for byte, with two exceptions: its `help.ts` lines are twelve lower (G86a's `STATE_TEXT`), and its `learnedPieces` two lower (U102).
  - **`app/src/ui/screens/TodayScreen.ts`:**
    - :14–39, the screen's ranking. The row's name (2, :28–29: *"Half a title is not a name"*) ranks above why the row is there (4, :37–39).
    - :390–448, `showSwapSheet`. Its option row (:422–430) carries a title, a meta line, `data-swap` and `data-tier`, and no badges.
    - :450–545, `rowFor`:
      - :475–482, badges (:481: any progress status but `new`);
      - :484–512, *Swap* and ▶;
      - :520, the subtitle.
    - :745–797, `activityRow`:
      - :748–752, badges (the current row wears *Next*);
      - :757–770, *Swap* while not completed;
      - :774, the subtitle.
    - :803–824, `outsideRow`: its subtitle at :818; ▶ alone.
    - :956–1001, `drawDaily`, the daily read's own card, which is not a session row. :996–999 is `today-reason`.
    - :1104–1107, the project rows, read for `buildSession` alone.
  - **`app/src/ui/widgets.ts`:171–224, `listRow`.** Not yours. :172–173 are the title and `.list-row__sub`; :174–180 put the badges on their own line, with the reason.
  - **`app/src/style.css`.**
    - The row:
      - :3631–3651, `.list-row` (wrapping flex, `padding: 6px 12px`);
      - :3662–3678, `.list-row__text`, `flex: 1 1 5rem`;
      - :3680–3686, the title, `line-height: 1.3`;
      - :3701–3709, `.list-row__sub`;
      - :3730–3736 and :3760–3765, the badge line;
      - :3767–3777, the actions, `min-height: 40px`.
    - **The Today block, :4694–4896,** ending before *Progress heat-map* at :4898:
      - :4726–4732, the daily read's second line;
      - :4744–4761, the title's two lines, shared with three `#progress-*` lists;
      - :4763–4786, the budget comment and a badge row's one-line title, shared with `#progress-history`;
      - :4836–4838, the current row;
      - `.session-next*` (:4840–4867) and `.score-button--primary` (:4869–4873), which sit in the block but are not Today's.
    - Outside it: the two columns sideways (:1103–1131, in the query at :931) and on a tablet (the query at :4066).
  - **`app/src/ui/help.ts`,** G86a's file, read only:
    - :1118–1126, `SLOT_TEXT`'s comment: *"The session row cuts a reason to one line at the owner's width"*;
    - :1127–1188, `SLOT_TEXT`;
    - :1190–1199, `cardLine`, U71's clause cut, for the transfer offer alone;
    - :1361–1368, `askedWords`'s comment;
    - :1407–1468, `slotReason`; :1066, `readingReason`; :1496, `swapChoiceWords`;
    - :656–657, `PROJECT_TEXT.states` *Paused* and *Put away*.
  - **Elsewhere:**
    - `curriculum/session.ts`: :1787–1851, `swapOptions`, which reads no project; :1594–1608, the card's one reading of the projects; :1656 and :1754, where the reasons are written.
    - `data/progressStore.ts`:1189–1197, `learnedPieces`.
    - `data/projectStore.ts`:121, `projectIn`: G96's file, imported only.
    - `LibraryScreen.ts`:129–141, G85's `projectBadge`: G96's file, its shape copied, never imported.
- **Tests.**
  - **`app/tests/e2e/today.spec.ts`:**
    - :43–61, `placeAt` (a rung and any stores, through the backup import);
    - :232–270, C6's learner, at the desktop viewport (:248 and :252 assert whole sentences with `toHaveText`);
    - :351–384, R2 at 360 × 780;
    - :419–471, the daily read at 342 × 740. Its `wholeLine` (:466–471, `scrollWidth > clientWidth + 1 || scrollHeight > clientHeight + 1`) is the measure reused here.
  - **Other browser specs:**
    - `projects.spec.ts`: :181, `putRows`; :304–367, G1e's case at 342 × 740, which builds the held line on a real card (:348–366);
    - `transfer-offer.spec.ts`:29 and :178–196, the offer's card line at 342 px.
  - **Unit:**
    - `todaySessionRun.test.ts`: :21–142, the Today harness (`buildSession` mocked with each reason set directly, `swapOptions` real, a fake IndexedDB); :235–266, the swap cases;
    - `projectLifecycle.test.ts`:514–580, the readers guard: only `projectSheet.ts` acts (:546), and `TodayScreen.ts` is already a reader (:556).
  - **The audits.**
    - `app/tests/tour/audit.ts`:301–305: any `.list-row` over 96 px, at any size, is an `R2-density` finding.
    - `app/tests/states/` is the Score screen's gallery (*today* occurs there only in prose), so it has no Today cell.

## What is decided

1. **The rulings, verbatim, and the goal.**
   - The C6 review, finding 6 (:44–47):

     > **The truncated reason line is P2, X's, not P3.** The pictures show the decisive clause lost on the primary 342 px target ("Keeping this piece playable —…", "Next lesson — this one waits f…"); C6 exists to say why, and hiding half the reason undermines it; X solves it in the Today redesign, likely two compact lines rather than rewriting every reason around an ellipsis.

   - The backlog's decision (:124): *"two compact lines for the reason in X's Today redesign, never rewriting every pedagogical explanation around an ellipsis"*. Its status adds: *"never widen or wrap the shared slot row inside a lifecycle seam"*.
   - `responses/9fce3792.md`:23 and :25, which give this line an owner:

     > The current ellipsis is not a G1e blocker, but record it for the row-density/copy owner.
     >
     > A short form such as **"This lesson is waiting on a paused piece"** would carry more of the useful meaning before truncation, but do not widen or wrap the shared slot row inside this lifecycle seam.

   This lane is that row-density owner. It wraps the row; it does not write the copy (Build 3).

   **The goal, in my words.** On the phone, a learner reads why each row is on Today to the end of the clause that decides it (*last played on 10 Sep*, *this one waits for your reads*), and no row grows taller than the card allows. Where a row cannot hold that, the report names the row and says why. No layout trade is made quietly.

2. **Premises, checked at the line.**
   - **The subtitles at `TodayScreen.ts`:520 and :774: held.** They read `subtitle: cardLine(slot.reason, slot.claim),` and `subtitle: cardLine(activity.reason, activity.slot.claim),`. `cardLine` returns the sentence whole for every claim but the transfer offer (`help.ts`:1197–1198).
     - **A third session row, which the survey did not name:** `outsideRow`, :818, `subtitle: one.words,`.
   - **:996–999: held. This is the daily read's card (`#today-daily`); nothing adds the class to a session row.**

     ```ts
     // The reason takes a second line here rather than an ellipsis (C4): the
     // card's title is one line and it has no Swap, so the row stays inside
     // `04` §0 R2 with the whole sentence on it.
     row.querySelector('.list-row__sub')?.classList.add('today-reason');
     ```

   - **`style.css`:4726–4732: held**, and the rule it leaves in force for every other row is :3701–3709:

     ```css
     /* Today's sight-read says why this phrase in one sentence (C4), and it is
        read whole: the card's title is one line and it has no Swap, so a second
        line of reason keeps the row inside R2's 96 px. Every other row's reason is
        still one line, cut. */
     .list-row__sub.today-reason {
       white-space: normal;
     }
     ```

     ```css
     /* The reason, one line, cut rather than wrapped (`04` §0 R2). */
     .list-row__sub {
       font-size: 0.85rem;
       line-height: 1.35;
       color: var(--text-muted);
       overflow: hidden;
       text-overflow: ellipsis;
       white-space: nowrap;
     }
     ```

   - **Where the sentences come from** (`help.ts`, not touched).
     - *Keeping this piece playable — last played on 10 Sep*: :1422, `` `${SLOT_TEXT.keepPlayable} — ${SLOT_TEXT.lastPlayed} ${readDay(claim.lastPlayed, today)}` ``.
     - *Next lesson — this one waits for your reads*: :1415–1416, `` claim.waitsForReads ? `${up} — ${SLOT_TEXT.waitsForReads}` : up ``.
     - The session's reasons have three writers: `slotReason` (`session.ts`:1656), `readingReason(…, 'slot', …)` (:1754), and `swapChoiceWords` after a swap (`TodayScreen.ts`:494).
     - The page holds the sentences whole. `today.spec.ts`:248 and :252 assert them with `toHaveText`, and `cards.txt` records each line's page text beside `cut: true`. So the stylesheet draws the cut; the words are not shortened.
   - **The sentences as they read.** From C6's cards, on C6's build and machine:
     - **Cut:** *This lesson asks for it — not counted yet*; *The next lesson asks for it — not counted yet*; *Nothing due for review — more from this lesson*; *Keeping this piece playable — last played on 10 Sep*; *Next lesson — this one waits for your reads*; *Read something you have never seen, once, slowly*; *Another like it — 19 of 19 right and in time yesterday*.
     - **Whole:** *More music from this lesson*; *Bass clef: not shown in 4 weeks*.
     - **The spec's table.** Its examples (:319–345), counted in characters (a count, not a width), run from 16 (*From this lesson*) to 74 (*This lesson waits on pieces you paused or put away — more from this lesson*). Two more: 65, *This lesson asks for it, played with Perform on — not counted yet*; 69, *From Hands together: the left hand holds, which this lesson builds on*.
     - **Prefixes.** A review with nothing due puts *Nothing due for review — * in front of three kinds (:1409), and a mastered repertoire piece puts *A piece you know — * in front of its line (:1467).
     - **Variable parts.** Rung titles, tracks, skills, demands, families and days come from the built curriculum, so the longest sentence is measured (Build 1), not read off the table.
   - **What `today.spec.ts` measures.**
     - R2, at 360 × 780, on a fresh learner;
     - the reasons' words, at the desktop viewport;
     - wholeness, on the daily read alone.

     No case measures a session row's reason at 342 px.
   - **The badge line.** `rowFor` badges any status but `new` (:481), and repertoire retention offers only a passed or mastered piece (`progressStore.ts`:1192; `session.ts`:1400). So *Keeping this piece playable — …* always sits over a badge line; C6's picture shows *✓ passed*. In a running session the current row always wears *Next* (:751).

3. **The hypothesis, its mechanism and its refuting test.**
   - **Mechanism.** The reason is one CSS line with an ellipsis (:3701–3709), in a text column whose width is what *Swap* and ▶ leave (:3662–3678, :3767–3777). The claim comes first and the deciding clause after the dash (`04`:316–317), so the ellipsis falls on the deciding clause.
   - **Hypothesis.** Two compact lines in the same 96 px row, with the deciding clause kept whole, restore it.
   - **The alternative, refuted at the line (item 2):** that the words are shortened before the stylesheet sees them. The actions' width is not an alternative; it is the room the two lines have. It is measured, and *Swap* and ▶ stay as they are.
   - **The refuting test.** At 342 px with *Swap* present, if two lines of the longest reason overflow 96 px, the copy, not the layout, is the limit. The builder measures every reason sentence's length before choosing a layout, and reports the longest (Build 1).
   - **Where the stylesheet predicts the refutation.**
     - The comment's arithmetic (:4766–4771): 14 for padding and border, 18.4 for a reason line, 18.4 for the detail and 24 for the badge line.
     - By it, a second reason line fits only on a row whose title is one line and that carries no badge. A two-line title or a badge line, with two reason lines, comes to more than 96, whatever the sentence.
     - That is the comment's arithmetic, not a measurement. C6's picture, from another build, has the same shape.
     - So of U63's two examples, *Next lesson — this one waits for your reads* (one-line title, no badge, in that picture) should gain its line. *Keeping this piece playable — …* (always a badge line) should not.
     - The builder measures both and reports which way each went.

4. **Not decided here: the trade where the row cannot hold both. Question for the reviewer before dispatch, asked again in the handoff with the measured table.**

   Where the title takes two lines or the row carries a badge line, a second reason line costs another of the row's lines. Each way out is a product choice:
   - (a) the reason's second line takes the title's second line, against the screen's ranking (`TodayScreen.ts`:28–29; `04`:161);
   - (b) the badge leaves its line on Today, for the detail line (which `widgets.ts`:174–180 stopped because the detail was cut) or for the space beside the actions;
   - (c) the row exceeds 96 px where both lines are needed: R2's number (`04`:29–30), the owner's;
   - (d) shorter words, as `help.ts` copy after G86a (Build 3).

   **Absent a ruling, this is built:**
   - The reason takes its second line wherever the row keeps every other line within 96 px. It never takes the title's line, the badge's line or R2's budget.
   - A Today-only layout that keeps every line inside 96 (the badge beside the actions, say) is inside the lane. If the builder finds one, it is built and pictured, and the moved badge is named as a deviation.
   - The rows still without room keep one line, cut. They go to a Follow-up with the measured table: the row shapes, how many rows of the constructed cards, the deciding clauses still cut, and the sentences that would fit one line.

5. **What to build: six items, each done or an explicit not-done line.**
   - **Build 1 — red first at 342 × 740: each session row shows its reason's deciding clause in at most two lines.**
     - **The lengths, first.**
       - A throwaway unit probe (`runs/U63/scripts-reason-lengths.test.ts`, run from `build/`) composes every sentence the three writers can produce over the built curriculum's values and the longest day word, and prints the longest per claim kind and overall.
       - A lane-only browser probe then puts each sentence into a real row of Today's card at 342 × 740 (the row as drawn, its reason's text replaced). For each sentence it records the lines, whether the deciding clause is whole, and the row's height, for a one-line and a two-line title, each with and without a badge.
       - The longest sentence is reported, with where it can appear.
     - **The deciding clause** is the words after the sentence's last ` — `, or the whole sentence where it has none. It ends the sentence, so it is whole exactly when nothing is cut. The transfer offer's line is `cardLine`'s head by design (U71) and is judged as printed.
     - **The case**, in `today.spec.ts`: a describe at 342 × 740 using `placeAt`, with three learners:
       - C6's learner (:233–245): *The next lesson asks for it — not counted yet*, and *Keeping this piece playable — …*;
       - the held line, built as `projects.spec.ts`:348–366 builds it;
       - *Next lesson — this one waits for your reads*, if the builder finds a construction (entry-80.md's intermediate met it on 3.4, waiting for its reads). If not, the probe's measurement stands for it, and the case says so.

       For each row it asserts:
       - the reason reads the composed sentence exactly (`toHaveText`);
       - it takes at most two lines (its box against twice its computed line height);
       - on each row with room (item 4), it is whole by `wholeLine`'s measure.

       Red on the committed screen; record the red line.
   - **Build 2 — the row stays within R2's 96 px with *Swap* present.**
     - The same case asserts every session row's box ≤ 96 at 342 × 740: the card before a session and, where it can be reached without a played run, the running card with its *Next* row (*Start*, then back to Today, as `session-run.spec.ts` does).
     - The R2 case at 360 × 780 is kept.
   - **Build 3 — no sentence is rewritten.**
     - `help.ts` is G86a's; nothing in it changes.
     - The reviewer's short form (*This lesson is waiting on a paused piece*), and any shorter sentence the measurement suggests, is recorded for the copy owner once G86a closes, with its measured lines.
     - The comments saying the row is one line (`help.ts`:1123–1125, :1363–1364) are recorded as stale.
   - **Build 4 — 390 px and the tablet judged too: the pictures opened and their ink measured, never the suite alone.**
     - **Sizes:**
       - 342 × 740, light and dark;
       - 390 × 844;
       - 740 × 342 (two columns);
       - 768 × 1024 (one column);
       - 900 × 1200 (two columns);
       - 342 × 740 at 115 % text.

       `00`:44–47 names the sideways phone and 115 % beside the tablet.
     - **What is read.** Each picture is opened. Per row, read from the page its reason's lines, its last visible words and its height, before (the committed build) and after, measured the same way.
     - **A wider face.** Run once under a face wider than this machine's (U90's check, `style.css`:3688–3694): CI's runner lays text out wider, and the face decides which titles take two lines.
     - **A new break of 96.** A size where a row passes 96 px after the change and did not before is fixed within the Today block, or reported with its picture. At 115 % the rows are judged from the picture; the 96 px assertion is R2's, at 100 %.
   - **Build 5 — G94's *Paused* / *Put away* in the swap sheet. Verified: the same file.**
     - `showSwapSheet` is `TodayScreen.ts`:390–448. `swapOptions` (`session.ts`:1787–1851) reads no project, so a paused piece can be listed (G1e's Follow-up 1, `entry-150.md`:116, inferred from the code).
     - The ruling, verbatim (`responses/9fce3792.md`:29–31):

       > A swap sheet is an explicit learner-choice surface, so paused/retired material need not be omitted the way automatic selection omits it.
       >
       > However, it must **not look like an ordinary eligible automatic alternative**. G94 should show the lifecycle state beside such a piece (for example `Paused` / `Put away`) and preserve the learner's explicit choice if they deliberately select it. Do not silently resume the project merely because it was chosen from Swap; project-state changes remain actions on the project sheet.

     - **The lookup.** Keep for the sheet the rows `rebuild` already reads (:1107). Look each option up with `projectIn(rows, { itemId, material: materialOfItem(item) })`: the identity the session (:1603), the lesson page and the Library use.
     - **The badge.** A `paused` or `retired` project puts one beside the option, in `PROJECT_TEXT.states`' words (imported: no new word), with the state in a `data-` attribute, as the Library's badge does (`LibraryScreen.ts`:136–140; the duplicate is a Follow-up for after G96). No other state is marked, and nothing is omitted or reordered.
     - **The choice** is honoured as any swap is (:488–496), with no project write. Only the project sheet acts (`projectLifecycle.test.ts`:546).
     - **Both sheets:** the card's (:488) and the running card's (:763).
     - **The comment at :1104–1106** (*"for one thing: the review's repertoire retention"*), stale since G1e, is rewritten.
     - **Not this lane's:** `projectStore.ts`'s header sentence (G96's brief, item 6); `db.ts`'s `ProjectRow` comment (the next seam that owns `db.ts`; U102 is in flight on it); the *not counted yet* judgement on the phone. G94 stays open for the last two.
   - **Build 6 — the stylesheet change is confined to the Today block** (:4694–4896), in selectors that are Today's alone.
     - The rules naming `#progress-*` beside `#today-card` (:4751–4754, :4782–4783) are not edited for Today's sake; a Today-only rule is added instead.
     - The block's comments (:4726–4729, :4763–4781) are rewritten to what the rows now do.
     - Nothing in `widgets.ts`, the sideways or tablet blocks, or the rest of `style.css`. A class the rows need is added in `TodayScreen.ts`, as :999 does.

6. **Acceptance cases, by layer.**
   - **Unit.**
     - None for the reason line: jsdom lays nothing out, and a class present is not a line on the glass.
     - G94 gets a new file (for example `app/tests/unit/todaySwapWearsTheLifecycle.test.ts`), with the harness copied from `todaySessionRun.test.ts`:21–142. That file is X1's and is not edited. The cases:
       - paused → *Paused* beside the option;
       - retired → *Put away*;
       - a `learning` project, or none → no mark;
       - the paused option chosen → on the card as *You chose this one — …*, with the project read back from the store still `paused`;
       - the running card's sheet → the same.

       Red on the committed screen.
   - **Browser, on the lane's port.**
     - Builds 1 and 2's describe.
     - One G94 case at 342 × 740: placed at 1.1 with one of its songs paused (through `placeAt`'s stores), the new row's *Swap* shows that song's option with *Paused* beside its title. If 1.1's sheet does not list it, use a rung whose sheet does and name it in the case.
     - The committed `today.spec.ts`, `projects.spec.ts` and `transfer-offer.spec.ts` cases pass unchanged. One that asserted the one-line cut is revised, with its class and old assumption.
   - **Gallery cells:** none. The states gallery is the Score screen's.
   - **The product layer.**
     - The pictures go in `docs/prompts/pictures/u63/`, taken by a lane-only probe under `build/` (G86a's `runs/G86a/scripts-pictures.spec.ts` is the shape).
     - They show the card before a session and while running, for C6's learner and the held line, at Build 4's sizes, before and after; and the swap sheet with *Paused*.
     - Nothing is heard.

7. **Mutants, a budget of four.** Each is killed by a named test and recorded:
   - the clamp back to one line → Build 1's wholeness assertion;
   - the clause dropped (the subtitle cut at its ` — ` in `rowFor`) → Build 1's `toHaveText`;
   - the row over 96 px (the reason's clamp removed, so the held line takes three lines) → Build 2's height assertion and Build 1's two-line bound;
   - G94's mark removed → the unit file's *Paused* case.

   A survivor is a finding.

8. **When to deviate** (§13).
   - **The refuting test fires** (two lines of the longest reason overflow 96 px on a row with room): report the sentence, its lines and its row. Rewrite nothing and trade no line.
   - **Badge rows or two-line titles prove rare, or universal:** say so. It changes how much of U63 closes.
   - **A layout keeps every line inside 96:** build it, name it and show it.
   - **A premise here is wrong at the line:** say so at the item and take the better path, with the reason.
   - **A committed case encodes the one-line cut as intended:** replace it (class *replace*), never keep it green with a special case.

9. **Not U63's**, each recorded with its line:
   - `help.ts`'s words and comments, including U71's clause cut, which two lines may make unnecessary (`cardLine`, :1190–1199);
   - the daily read's card; the free prompt, which wraps;
   - `widgets.ts`. G96 changes `openSheet`, which the swap sheet opens, so the landing inspects the two changes together;
   - the other lanes' files:
     - G96: `projectStore.ts`, `projectSheet.ts`, `LibraryScreen.ts`;
     - G86a: `ScoreScreen.ts`, `help.ts`, `help.test.ts`;
     - U102: `DrillScreen.ts`, `sessionRun.ts`, `db.ts`, `progressStore.ts`, `accuracyReading.ts`, `rungState.ts`, `ProgressScreen.ts`;
   - `curriculum/session.ts`;
   - `projectLifecycle.test.ts`, whose title does not name the swap sheet among the readers' purposes (recorded for the store's owner);
   - the tour.

## Verification layers

**Unit.**
- Red first: the G94 file on the committed screen, then green.
- Then `npx vitest run` on it, `todaySessionRun.test.ts`, `todayOfferSnapshot.test.ts`, `todayCardRanking.test.ts`, `todayOpensWithItsRung.test.ts` and `projectLifecycle.test.ts`.
- Then the whole `npx vitest run`, each red attributed and rerun alone (expected: the recorded `lessonClaimsAboutApp` pair, Entry 101; load timeouts). None is inferred green.

**The rest of the chain.** `npx tsc -b`; `npm run lint` (no config copy inside `app/`); `npm run build:app`.

**The map.** `python tools/docs/checks_for_paths.py <final changed paths>`, recorded.
- At drafting, for `TodayScreen.ts`, `style.css`, `today.spec.ts`, `docs/04-ui-spec.md`, `docs/08-test-map.md` and a new unit file, it named tsc, lint, the whole unit suite, the app build and **the whole default Playwright configuration**.
- The whole configuration comes from `app/src/style.css`, which is on every spec's path (*"a rule anywhere in it can move any screen's layout"*).
- `TodayScreen.ts` alone names twelve: `app-shell`, `doors`, `first-day`, `lab`, `lesson-flow`, `modes-free-play`, `modes-placement`, `progress.hierarchy`, `progress`, `session-run`, `today`, `transfer-offer`.

**Browser.**
- The new cases first, alone, on the committed screen (red), then green.
- Then the twelve and `projects.spec.ts`, each file checked to exist first (a missing path is dropped silently), at `--workers=2` on port 4673.
- The whole default configuration is not run by the lane. The handoff lists it under *not run as the map writes it*, for the landing chain or CI.

**The product layer.** Build 4's pictures, opened, with the lines read beside each. Nothing heard; the copy is the copy owner's.

## Rules and files

**You own:**
- in `TodayScreen.ts`:
  - the session rows' reason (:520, :774, :818);
  - `showSwapSheet`'s option rows and the project rows kept for them;
  - the comments at :1104–1106, and at :996–998 if the daily row stops being the only one with a second line;
- `style.css`'s Today block, in Today-only selectors;
- the cases added to `today.spec.ts`;
- the new unit file;
- the pictures and `docs/prompts/runs/U63/`;
- the entry's `## Doc rows`.
  - They are rows, not direct edits: §2 has unspliced rows from Entries 142 and 150, and these are written against them, as G96's are.
  - The rows: `docs/04-ui-spec.md`:316–317 (the line's two lines), :161 if the budget sentence changes, and one sentence at :360–380 (a paused or put-away option wears its state); `docs/08-test-map.md`:362 (`today.spec.ts`) and a line for the new unit file.
  - None of these lines is G86a's (§5, §5f; `08` :15, :346, :595) or U102's (§6; `08` :24, :312, :556).

**Not yours:** item 9's files.

**`docs/prompts/checks.json`.** No new spec is planned: a new unit file runs itself (`app/tests/unit/*.test.ts`). If a new spec does appear, it joins the `app/src/ui/screens/TodayScreen.ts` row's `e2e` list and gets a `docs/08` file line, and the map change goes to the reviewer before the push.

**Base.** Origin's head at dispatch, stated in the entry.
- At drafting, the main checkout's HEAD is a0a8039b and origin's head is 2da6b8ef. Every file this lane owns is the same at both.
- The entry says whether its base holds G86a's and U102's merges. A base without them meets them at landing.

**Fresh-worktree setup,** as G86a's:
- `npm ci` in `app/`;
- `python tools/midi-cleanup/tests/parity_reference.py`;
- `python tools/content/build.py --offline` (Q24), with `content/scores/imported/{kern,musetrainer,mutopia}` and `build/cache` copied read-only from the main checkout. If the build cannot produce `app/public/content`, copy that folder and say so;
- snapshot `docs/prompts/inventory.md`, `docs/prompts/rung-claims.md`, `content/scores/imported/SOURCES.md` and `docs/generated/ladder.md` before the build, and restore them after. `git status` shows none of them.

**The harness.**
- **The worktree.** Your own, cut by the orchestrator. No commits, pushes, stashes, resets or checkouts. Never write in the main checkout.
- **Port 4673.** Port 4173 is the main checkout's. The lane runs a copy of `app/playwright.config.ts` kept under `build/u63/`, not under `app/`:
  - `testDir` absolute;
  - the webServer's cwd `app/`, its command `npm run build:app && npx vite preview --port 4673 --strictPort` (`npm run preview` pins 4173, `app/package.json`:10);
  - `baseURL` and the webServer's `url` on 4673;
  - `use.storageState` an **absolute** path to `build/u63/storageState-4673.json`, the fixture re-keyed to `http://localhost:4673`. A copy outside `app/` resolves a relative path against `app/` (§11).
- **Temp state** under the worktree's gitignored `build/`.
- **No committed spec writes under `docs/`**: the pictures come from the lane-only probe and are copied out.
- **No learner-facing text** says anything waits for review.
- **Never name an AI model.** Never assert a number measured on this machine as a fact beyond its run: a height or width is reported as measured in this run, with its size and face.
- **The disk is nearly full.**
  - At the end, delete `app/node_modules`, `app/dist`, `app/test-results`, the copied caches (a copied `app/public/content` among them) and the config copy.
  - Keep no log over 300 KB: keep the summary and the failing names, and say the full log was not kept.
- **Every item done, or an explicit not-done line**, with where its evidence is.

## Report

**Judgement first:**
- **What a learner now meets differently at 342 × 740:** per row of the constructed cards, the reason's last visible words before and after, which rows still cut, and the pictures. *Unverified as copy* for any sentence judged too long.
- **The refuting test's result:** the longest sentence, where it appears, its lines, and whether the copy or the row's other lines ran out.
- **The measured widths and heights,** per size and row shape (the text column and the rows), as measured in this run.
- **Item 4:** the layout chosen, any moved line, and the rows without room, as the Question with its table.
- **G94:** the swap sheet's mark, and what of G94 stays open.

**Then** Done / Not done / Follow-ups / Questions / Files. The Follow-ups include: the copy for the long sentences and the reviewer's short form; the stale `help.ts` comments; U71's cut; the duplicated project badge; G94's `db.ts` comment; the rows without room, if not ruled.

After those:
- per fix, the mechanism, the discriminating test, the before and after measured the same way, and the red line;
- the tests table, each test with its class (add, replace, preserve) and its old assumption;
- the mutants, and the test that killed each;
- exit codes;
- **not run as the map writes it:** the whole default Playwright configuration, and anything else the map printed that the lane did not run;
- the deviations, each with its reason;
- what is unverified, beside what passes;
- `## Doc rows`.

State the technical and pedagogical verdicts separately. The pedagogical verdict is an observation against C6's lines, never a teacher's verdict: does the reason, read whole, say what the slot is for? The wording is the copy owner's. `operating-procedure.md` §11 and §12 apply.

**Entry 170.** The orchestrator assigns it at dispatch. At drafting, 167 is the highest in the record and G96's draft holds 168. Every run file goes under `docs/prompts/runs/U63/`. The entry is `docs/prompts/runs/U63/ENTRY.md`, starting `### Entry 170 — U63`.

## Reviewer's approval and conditions (`responses/questions-71bd6cee.md`)

Approved for dispatch 2026-09-30 with a product ruling. The reviewer's words below govern wherever the brief's earlier text differs: the full title, then the reason's deciding clause in up to two compact lines, then usable controls, then the lifecycle badge moved into the action-side area on Today only, then 96 px where it honestly fits; a real row that still cannot fit at 342 px comes back measured in the handoff, never truncated, the title never shortened, R2 never widened by the lane; G94's swap-sheet label folds in as ruled.

## U63 — Today's reason in two lines

**APPROVE FOR DISPATCH, with a product ruling on the row-budget trade.**

The decisive reason is more important than preserving the old one-line truncation. U63 exists because the current card can literally hide the clause that tells the learner why the activity is there.

### Product ruling

Use this priority:

1. keep the **full identifying title**, up to its existing two-line allowance;
2. keep the **reason's deciding clause readable**, using up to two compact lines;
3. keep the action controls usable;
4. preserve lifecycle state, but it does **not** require its own dedicated full-width line on Today;
5. preserve the 96 px R2 budget where the above can honestly fit.

Therefore the preferred layout is the orchestrator's recommendation:

**move the lifecycle badge into the action-side area on Today when that recovers the line needed for the reason.**

Do this as a Today-only layout. Do not change the shared `listRow` structure or the Library/Progress badge layout.

A passed/mastered badge is useful context, but on a Today activity it is less important than the full activity title and the reason the app chose it now. It may sit compactly beside/above the controls rather than consuming a dedicated text-row line.

### If 96 px still cannot hold the honest content

Do **not** silently fall back to the old truncated reason merely to satisfy the number.

If, after the Today-only badge relocation and compact two-line reason, a real row with a two-line title still cannot fit inside 96 px at the primary 342 px target, bring that measured case back in the handoff. Do not:

- steal the title's second line;
- rewrite pedagogical sentences merely to fit CSS;
- drop the badge/state entirely;
- unilaterally widen R2 before review.

The expected outcome is that most/all important rows can be solved by the Today-only badge placement. Any genuine remaining exception becomes an explicit R2 product decision rather than hidden truncation.

### G94 swap-sheet state

Approved to fold in. Paused/retired choices remain selectable because Swap is an explicit learner-choice surface, but they must visibly carry `Paused` / `Put away`, and selecting one must not alter project lifecycle state.

U63 may dispatch.

**Landed 2026-09-29** (Entry 170; 7a4e5605, merged b7454fb7); handoff `handoffs/7a4e5605.md`.
