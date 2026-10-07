# Reviewer handoff — the G6 and positioned-harmony briefs before dispatch; CB1's artefacts

**Scoreboard: 0 / 28 MUST abilities shipped. PACKET-TRACE: PARTIAL 96, MISSING 5.** A7c.1 waits only for the owner's phone walk. A7b.1 stays `draft`.

The commit carrying this handoff. Respond in `responses/g6-ph-briefs-cb1.md`. Response required before either brief is dispatched (your BB1 ruling, §2 and §3). Nothing heard.

## 1. CB1 landed (Entry 267), for its artefact review

`docs/pending-review.md` Entry 267; `app/src/ui/screens/ChordChartScreen.ts`; `app/tests/e2e/chart-backing.spec.ts`. Only case B changed: from nothing scheduled to the bass and drums without the piano; A, C and D are unchanged. Two pins stated the coupling and were rewritten. The carry-overs pin had skipped on every run. The lifecycle test's helper clicks Comp as its docstring says. A7b.1 step 11 now reads unblocked at the app. A sibling carry-overs test still skips on every run; it is recorded in the entry, not fixed.

## 2. The briefs

- `docs/prompts/runs/curriculum-review-2026-10-05/briefs/g6-minor-shells.md` (`ability: A7b.1`; the lint passes). G6a builds a new item, `drill.jazz.minor-ii-v-i-shells`, nine fixed cases in three keys (C minor with Cm6, A minor with Am7, G minor with Gm7), and CK-6 on the configured shell voicing against a fixture music21 writes. The major item and jazz.5 stay pinned by a differential. G6b, after G6a lands, places the item on jazz.6 and adds the lesson sentences.
- `docs/prompts/runs/curriculum-review-2026-10-05/briefs/seam-chart-positioned-harmony.md`. PH1 is the contract: a pure model change carrying your six cases red-first, a whole-corpus differential, and music21 as a second witness. PH2 is the consumers, on CB1's screen: grid, comp, backing, live cell, a look for each device.

## 3. Asked: four points where your ruling needs a decision

1. **A harmony's offset always moves it.** The tempo reader moves a direction only when its offset says `sound="yes"` (`tempoFromXml.ts:26-27, 211-213`). Reusing that rule for harmony puts the raw Blue Bossa G7 at beat 1 and fails your first case: its offset carries no sound attribute. The brief reuses the walk and moves a harmony by its offset unconditionally, as music21 does. Confirm.
2. **Dense split bars.** The drafter's census, one reader over every MusicXML file under `content/scores/`, PH1 re-runs it: 103 of 114 harmony-bearing files have split bars, 1,757 bars. Of those, 787 only restate the same symbol, 391 symbols fall between beats, and ten files have bars with 6 to 16 symbols. The brief collapses restatements, and the phone's look for a dense bar comes back with pictures before PH2 ships. Rule on collapsing restatements.
3. **The items requirement alone does not protect jazz.6.** A rung is met when every requirement holds, and the generic requirement counts one exercise run. If the minor drill sits in jazz.6's exercises, one run of it meets both requirements, and jazz.6 goes green with none of its comping work. The G6 brief recommends raising the generic count to 2. That is G6b's decision; say now if you want something else.
4. **Recorded, outside both lanes.** The chart plays four beats in every bar, but 30 of the 114 harmony files are not in 4/4 (same census). It is app-wide, so under FABLE §10 it is app work, not yet briefed. Rank it.
