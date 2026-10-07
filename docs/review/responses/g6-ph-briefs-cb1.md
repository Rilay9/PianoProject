# Review response — G6 + positioned-harmony briefs; CB1 artefacts

**Verdict: APPROVE WITH REQUESTED CHANGES**

**Scoreboard: 0 / 28 MUST abilities shipped. PACKET-TRACE: PARTIAL 96, MISSING 5.**

I read the immutable handoff first, then the G6 brief, the positioned-harmony brief, the current jazz.6 requirements, the exact CB1 diff and four-case browser spec, the current Chord Chart scheduler, the existing MusicXML position walk, the BB1 response this work implements, and the current A7b.1 record. I also checked MusicXML 4.0's published `<offset>` definition because question 1 turns on that semantic. Nothing was heard.

Disposition:

- **CB1: APPROVE.**
- **G6a: APPROVED FOR DISPATCH.**
- **G6b: design approved now; dispatch only after G6a lands, as briefed.**
- **PH1: APPROVED FOR DISPATCH after the restatement rule below is corrected in the brief.**
- **PH2: not dispatched until PH1 lands and returns for artefact review; its dense-bar look remains a real product review, not a pre-decided CSS exercise.**

## 1. CB1 artefact review — APPROVE

Entry 267 implements exactly the product rule already decided.

The production diff is narrow:

- `onBeat` invokes the piano comp only under `comping`;
- it independently invokes the bass/drum scheduler under `backing`;
- `compBar` no longer owns backing;
- the Bass + drums chip no longer forces Comp on.

The four-case browser spec observes scheduled audio work, not labels:

- A: backing + comp -> rhythm section + piano;
- B: backing + no comp -> the same rhythm section, no piano;
- C: comp + no backing -> piano only;
- D: neither -> neither.

The recorded differential is exactly the intended one: only B changes. The landing correction to the lifecycle helper is within the semantic radius because that helper claimed both controls were on while relying on the old forced coupling.

The sibling `carry-overs.spec.ts` screen-leave case that still skips is real test debt, but it predates CB1 and does not overturn this artefact. Do **not** open another seam for it now. PH2 already has stop/suspend/resume state-machine acceptance; make that path replace or repair the skipped coverage when PH2 touches this surface.

CB1 closes.

## 2. Question 1 — harmony offsets move unconditionally: CONFIRMED

Use the shared MusicXML position walk, but apply a harmony's own `<offset>` to the harmony position **regardless of the offset's `sound` attribute**.

That is not a contradiction with `tempoFromXml.ts`:

- the existing tempo rule is specifically about a **direction's** associated playback/listening semantics;
- `<harmony>` is itself a parent of `<offset>`;
- the `sound` attribute's defined effect concerns associated `<sound>` / `<listening>` on a direction, which a harmony does not contain;
- music21 independently places both Blue Bossa representations at the same beat-3 position.

So PH1's first acceptance case is right: the raw-shaped Blue Bossa G7 without `sound="yes"` still lands at quarter offset 2.0.

Keep the tempo reader's existing direction behaviour byte-identical. Share/factor the cursor mechanics, not the direction-specific offset policy.

## 3. Question 2 — do NOT collapse a later restatement merely because the symbol is identical

This is the required correction before PH1 dispatch.

The proposed rule:

> identical to the harmony already sounding -> no new segment

throws away a written event. A repeated identical chord symbol later in a bar can communicate **harmonic rhythm / re-articulation** even though the pitch-class set and printed text are unchanged. PH2's comp is specifically supposed to strike at written change/event positions; collapsing the event would make the model incapable of doing that.

The model must therefore preserve every positioned harmony event at a **different offset**, including an identical repeated symbol.

A narrow de-duplication is allowed only for **exact semantic duplicates at the same offset** — same root, kind/degrees/pitch classes, bass and printed text — where two parts or duplicate XML state the same fact at the same instant. PH1's census must report how many it merges.

If two harmonies at the same offset disagree, do not silently choose by part order. Report the conflict. It is an ambiguous chart-model case and needs a disposition before a consumer pretends one is the harmony.

This changes the interpretation of the 787 “restatement” bars: they are not automatically noise. Preserve them first; PH1 may classify them. Dense display is PH2's problem.

### Dense bars

Do not solve 6–16-symbol bars by deleting musical events.

PH2's current stop condition is right: show the actual densest cases on phone upright, phone sideways and tablet. If proportional side-by-side labels cannot remain legible, bring back a fallback with pictures. A compact in-cell sequence, expanded bar treatment, or another chart-specific representation may be right; the reviewer should choose from evidence rather than pre-approve shrinking/wrapping until sixteen labels technically fit.

One-segment bars must remain visually unchanged.

## 4. PH1 bar length — settle the pickup boundary now

The brief marks bar length open. Use the **active time signature as the nominal bar length**, but do not stretch a pickup / explicitly incomplete measure to a full nominal bar merely to make segment math easy.

PH1 should carry enough information to distinguish:

- an ordinary complete measure: nominal length from the active time signature;
- an explicit pickup/incomplete measure: its actual notated duration, independently checked against music21;
- an unexplained mismatch between nominal and actual length: report it in the census; no silent clamp.

This is a model contract, not PH2 styling. The A7b.1 charts are ordinary 4/4, so a corpus irregularity does not block them unless it exposes a flaw in the shared walk.

## 5. Question 3 — jazz.6 generic requirement: use count 2

Approve the recommended G6b requirement:

```json
[
  { "kind": "runs", "from": "exercises", "count": 2 },
  { "kind": "runs", "from": "exercises", "items": ["drill.jazz.minor-ii-v-i-shells"], "count": 1 }
]
```

With the generic count left at 1, the new minor drill could satisfy both rows by itself. That would accidentally make the rest of jazz.6 easier when the intended change is to **add** the minor-shell ability.

With count 2, the learner must complete:

- the minor shell drill; and
- at least one other distinct jazz.6 exercise.

That preserves the old rung's “do some jazz.6 work” requirement while adding A7b.1's specific CONTROL. Do not claim this guarantees comping specifically — the existing generic pool never did.

Pin the distinct-item behaviour in the rung-state test as the brief proposes.

## 6. G6 brief — approved

The new-item boundary is correct.

Keep:

- `drill.jazz.ii-v-i-shells` and jazz.5 unchanged;
- new stable id `drill.jazz.minor-ii-v-i-shells`;
- C minor -> Cm6, A minor -> Am7, G minor -> Gm7;
- all nine cases present in an ordinary run;
- the actual symbol in every prompt;
- no m(maj7) without a consumer;
- the omitted-flat-fifth limitation as lesson teaching, not a fake three-note drill claim;
- music21 as the independent theory oracle;
- a byte-level prompt differential over every existing chord row.

The fixture split is also sound: the symbol establishes the full chord and the configured shell members; the numeral establishes the harmonic root/quality relation but must not be abused to turn Cm6 into a universal minor-tonic formula.

G6a may dispatch now. G6b follows only after G6a's artefact is landed, and its learner-facing content returns for review before A7b.1 becomes reviewed.

## 7. Question 4 — fixed four beats per chart bar: P1 chart correctness, not an A7b.1 blocker

This is a real app-wide Chord Chart defect.

The current screen hard-codes four metronome beats and `barSchedule(... beatsPerBar: 4)`. The census says 30 / 114 harmony-bearing files are not 4/4. On those charts the bar tracker, click/backing cycle and any time-positioned consumer can disagree with the written metre.

**Rank: P1 within the Chord Chart product surface.**

It does **not** block A7b.1 because Blue Bossa and the Insensatez passage used by this chain are 4/4. Do not make the second slice wait on unrelated 3/4 / 6/8 charts.

But do not let PH2 accidentally cement the four-beat assumption either. Before PH2 dispatch, write the small metre seam brief and decide whether it should land immediately before PH2 or be folded into PH2's scheduler work. The decision needs to handle at least 2/4, 3/4, 4/4, 5/4, 6/8 and 2/2 honestly; do not translate all of them into “N quarter-note clicks” by guess.

PH1 may proceed independently because its model should already carry correct nominal/effective bar lengths.

## 8. Dispatch summary

After editing PH1's restatement rule and pickup/bar-length wording:

- **Dispatch G6a.**
- **Dispatch PH1.**
- Do not dispatch G6b until G6a lands.
- Do not dispatch PH2 until PH1 lands and its positioned-harmony artefacts are reviewed.
- Draft the chart-metre seam before PH2 dispatch; it does not hold Blue Bossa's G6/content work.

A7b.1 remains `draft`. A7c.1 remains gated only by the owner's phone walk.
