# P18 — Carry-overs: the small things earlier phases left open  ·  Intended model: **Sonnet 5** (Opus for item 5)  ·  Branch: `feat/p18-carry-overs`

(Include `_COMMON-HEADER.md`. The default branch is `claude/piano-teaching-app-bo19td`; there is no `main`.)

Read: `docs/decisions/2026-09-06-p7-screens-storage.md` ("What is not done");
`docs/decisions/2026-09-06-p8-drills-ui.md` ("What is not done");
`docs/decisions/2026-09-06-p6-score-screen.md` ("Not built here");
`docs/decisions/2026-09-06-examination.md` §4–§5; `docs/04-ui-spec.md` §2, §3, §3b, §5, §7,
§7a, §7c; `docs/00-overview.md` D17; the screens and stores each item names.

## Why

Six items were written up honestly as "not done" by P6–P8 and never picked up. None is
large; together they are a session. Each arrives with its test, as every phase must.

Runs in the container. Needs no PDMX. Independent of P11–P17; run it whenever a session is
free.

## Build / verify

1. **Named sections for looping** (`04` §5, P6 "Not built"). `teaching.sections` exists in
   the catalog schema and no item carries any. Add sections to the twenty most-used pieces
   at Stages 1–5 (strains for the rags, A/B sections for the folk tunes, exposition /
   development / recapitulation for the sonatinas — by reading the scores, not guessing),
   and a section picker on the Score screen's loop control that sets the loop from the
   section's bars. `validate.py`: a section's bars lie inside the piece's measure count
   (from the render manifest). E2E: pick a section, the loop wraps at its end.
2. **The amber "probably wrong" state for the microphone** (`04` §5, P6). A third
   `NoteState` in `WindowRenderer` with its CSS; `ScoreSession` paints a mic judgement with
   confidence < 0.5 amber instead of not at all; the keyboard strip matches. Unit test on
   the state map; screenshot test for the colour.
3. **Drag-to-reorder tracks** (`04` §3, P7). Pointer-event drag on the Plan screen's track
   list, writing `planStore.trackOrder`; keyboard fallback (move up / move down buttons stay).
   E2E: drag the third chip to the top and the session builder's next lesson changes
   accordingly.
4. **The chord chart's backing loop** (`04` §3b, P7). Bass on beats 1 and 3 (root and fifth,
   an octave below the comp), a simple drum pattern from three short synthesised sounds
   (kick, snare, hat) on the shared scheduler, swing toggle honoured, count-off, volume
   under the metronome setting. Unit test that the schedule for one bar has the right events
   at the right beats; e2e that starting the loop schedules audio and leaving the screen
   stops it.
5. **Strict prerequisites** (`04` §7, examination §4.4; `00` D17 says gating is opt-in).
   Decide the look — recommended: a locked lesson shows a badge and a one-line reason and
   its option cards open with a confirmation, never a disabled card — and build it: the
   setting toggle exists; `nextRecommended` and the lesson page honour `prerequisites[]` when
   it is on; "I already know this" on the prerequisite unlocks it. Unit tests both ways.
6. **The tablet side panel** (`04` §7a). At the ≥ 900 px breakpoint the Score screen shows a
   collapsible panel with the lesson text or the chord chart and the bars-per-window default
   becomes 4. Nothing else changes on the phone; e2e at 1024×1000 and 412×915.

## Acceptance

- `npm run lint && npm run typecheck && npm test && npm run e2e` green with the new tests.
- `validate.py --strict-license` green with the sections rule.
- Update `04` §7c ("what §7 actually ships") and the three decision notes' "not done" lists
  to say what is now done; write `docs/decisions/<date>-p18-carry-overs.md` for the
  strict-prerequisites look and anything you chose differently from `04`.

**Cannot be checked in the container:** the amber colour against the real mic on the HP-130,
and the backing loop's feel at a real jam. Owner checklist.
