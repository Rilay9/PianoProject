# The Score bar: one layout model (U122)

A design lane, no app code changed. Base `842157ef`. Brief: `docs/prompts/tasks/U122-the-sideways-score-bar-gets-one-layout-model.md`, approved as written (`docs/review/responses/b47ce498.md` §1); motivated by the reviewer's trajectory review (`docs/review/trajectory-2026-10-01.md`). Evidence: `docs/prompts/runs/U122/` (Entry 206). Every width and count below was measured in this machine's Chromium, on its faces: *the app's own face* is this machine's system stack, *the wider face* is Verdana forced onto every element from the first paint (DejaVu Sans where Verdana is absent). Another face moves which cells need what; the model is written so that it measures its inputs on the device, not here. Unverified on a device; nothing here was heard; no pedagogical verdict applies except where a control's place changes what a learner can do (§5.3, §5.5).

## 0. Judgement

**The hypothesis holds.** The bar has no allocation model: what yields is decided in three unrelated ways at once. CSS flex weights decide continuously (the mode select `flex: 1 1 3rem; min-width: 2.75rem`, the tempo label `flex: 0 1 auto` upright, the name `flex-shrink: 1000000` outside a refusal, the refusal sentence `flex: 0 1 auto; min-width: 0; overflow-wrap: anywhere`); a script loop decides discretely by symptom (`barIsOverfull`: did the controls wrap, is ▶ or ⋯ under forty pixels; `leftGroupIsCut`: is the widest `bar m / m` past the group's edge); and a width threshold decides the words (`NARROW_BAR_PX`). Only one item, the location, has a stated minimum (U119a's). The refuting test fails on three measured faults the missing minimums cause, each invisible to the predicates that exist:

- **The mode select has no minimum that holds its label.** Its floor (2.75rem) is under every label, and its id outranks the sideways `flex: none`, so it is the item that silently gives: sideways the selected mode is cut in **500 of the 556 sideways states measured** (U119a's 64 cells in all their states, plus the 880 × 412, 1200 × 360 and 90 % text cells), at every width from 568 × 320 to 1200 × 360, the owner's 780 × 360 among them (*Wa*, *W*), not only at U121's narrow cell; upright in 13 of 52 cells. `score.bar-targets.spec.ts` means to catch exactly this ("a select squeezed until its own words are cut off — so that is what is checked") but measures `scrollWidth > clientWidth`, which a `<select>` never reports: 49 against 49 at U121's cell while its label needs 125.
- **The refusal sentence has no minimum.** `min-width: 0` with `overflow-wrap: anywhere`, sharing the room with the name in proportion, gives it a column a few pixels wide: up to 31 lines, a bar up to 554 px tall in a 264 px room. U120 is not only 568 × 320: the bar leaves the window in 4 cells (20 states), 667 × 375 among them, and ▶ goes above the window in 2 of those.
- **The tap minimum is checked in the wrong unit.** ▶ and ⋯ are floored at `2.5rem`; the loop checks 40 px. Below 100 % text (90 %: 36 px) the check can never pass, so the loop sends Hands *and* `Hear it` behind ⋯ at every width measured, ▶ still 36 px.

**The model, in one paragraph.** The bar is a row of items, each priced once per geometry at the widest thing it can show in this piece: ▶ and ⋯ at the tap minimum in pixels; the mode select at the widest of its four labels, in a long or a short form; the tempo label at its widest digits, with or without the percentage; `Hear it` at the wider of *Hear it* and *Stop*; Hands; sideways also Back and the piece's widest `bar m / m`. One priority order says what gives first: the piece's name; then the tempo's percentage; then the mode's sentence; then the ordinary status line (which holds a band of its own 28vw cap before any long word is spent); then Hands; then `Hear it`. ▶, ⋯, the mode's word, the bpm, Back and the location never give. The allocation is the first configuration, in that order, whose priced widths fit the row; the status line and the name share what is left, status first, each drawn at least as its first letter and a whole ellipsis, or not at all. No input is the run's state, so no control moves mid-piece, by construction: measured the same in every state probed (at rest, paused, refused, after a render and a resize while refused, refused over a paused run); during a demonstration (*Stop*) and after a tempo change it holds because both labels are priced at their widest, not measured. A refusal sentence is not an item of the row: it is drawn whole, by the same status element, on a line of its own across the top of the bar, and the row under it does not change.

**What it replaces.** One function and five CSS declarations replace fourteen of the forty inventoried rules (§4): the threshold, the tap check, both symptom predicates, the loop's stopping test, the select's and the tempo label's flex give, the rem-only tap floor, the sideways `nowrap`, the group's content basis and auto margin, the refusal's in-group wrap, its exception on the name's weight, and a dead `34vw` cap. Twenty-six rules are kept as they are (one of them, the group's clip, inside a rule whose basis changes); nothing is added beyond the function, the own-line rule and the yielding-text floor.

**Measured.** The model was applied in the page (no app source touched: the probe moves the same elements and sets their styles) and measured in all **608 states of 202 cells**: no invariant fails in any (one row of controls; ▶ and ⋯ at 40 px or more; every control hit at five points; nothing outside the window; Back, the location and the widest location whole; the mode and tempo labels whole; the refusal whole on one line above the controls; no yielding text cut without its mark), and the configuration is the same in every state of every cell. Its arithmetic rebuilds today's own row from today's drawn widths within 0.07 px over 530 states (`accounting.txt`). U120's four cells: the bar 71–83 px tall where it is 412–554 px today, ▶ and the sentence inside the window. U121's cells: *Wait* whole where it reads *Wa*.

**One product choice stops here (§5.5), not chosen:** at cells where the row cannot hold Hands or `Hear it` with every label whole, a refusal of that control (*tap R again*, *tap Hear it again*) names a control that is behind ⋯. Today has the same conflict in more cells. Three options, with what a learner meets under each.

**Four choices made inside the model that change what a learner sees (§5.4), for the reviewer to confirm or overturn:** the refusal's own line (read against `bb271f4a`'s "no third status surface"); the status line's band before long words; a whole mode label before Hands or `Hear it` stays on the bar (upright, 13 cells); the yielding-text floor.

## 1. Inventory

Every rule that decides what the bar shows, at `842157ef`. *Lane* is the commit that last wrote the line (`runs/U122/blame.txt`), named by its lane where it has one. *Invariant* is the one the rule protects, with its ruling; *none named* where none can be.

### CSS, every orientation (`app/src/style.css`)

| # | Lines | Rule | Lane | Invariant |
| --- | --- | --- | --- | --- |
| S1 | 2904–2932 | `.score-bar { flex-wrap: wrap }` — the row wraps rather than run a control off an edge | `76258d0b` (tour, S25 pictures) | every control reachable (`04` §5); a fence, not a decision |
| S2 | 2916–2917 | `justify-content: center; align-items: center` | `76258d0b`, `782835bb` | none named (presentation); `align-items: center` is why a grown group's top read as a second row (U119a 3) |
| S3 | 2927–2928 | `gap: 0.15rem; padding: 0.35rem 0` — "measured, not chosen" to fit 342 px | `527955ad` | one row at 342 upright (`08` §7.1); a tuned constant |
| S4 | 2934–2936 | `.score-bar > * { flex: 0 0 auto }` | `782835bb` | none named (default) |
| S5 | 2942–2948 | `.score-bar__left { display: none; gap: 0.4rem; min-width: 0; margin-right: auto }` | `6a8a92ae` (P21e) | upright the header carries Back, the name, the status (P21d A6); the auto margin pushes the controls right sideways |
| S6 | 2950–2957 | `.score-bar__title { … ellipsis; max-width: 34vw }` | `6a8a92ae` | a cut name is marked; **the `34vw` cap applies nowhere** (upright the group is not drawn, sideways L4 lifts it) |
| S7 | 2959–2966 | `.score-bar__status { nowrap; ellipsis; max-width: 28vw }` | `6a8a92ae` | the ordinary status's density contract (`842ea210`, `bb271f4a`); no ruling names the `28vw` |
| S8 | 2972–2974 | `[data-running] .score-stage { margin-bottom: 0 }` — the bar overlays during a run | `6a8a92ae` | one fit per run (decision 5); not an allocation |
| S9 | 2980–2994 | `.score-bar > .score-tempo-label { flex: 0 1 auto; min-width: 0; ellipsis }` — "the one thing on the bar allowed to give" | `1fdc4db7` (B1) | one row upright; sideways overruled by L5 |
| S10 | 2997–2999 | the bar floats `bottom: var(--strip-height)` above the keys | `782835bb` | not an allocation: it sets the room above the bar |
| S11 | 3006–3009, 3028–3030 | `[data-visible='false']`, `[hidden]` | `782835bb`, `b6555a9e` | the fold and `08` §9.20; not an allocation |
| S12 | 3042–3060 | `.score-button, .score-select { font-size: 0.85rem; padding: 0.3rem; min-height: 2.5rem }` | `825bf2c9` | `04` §0 R4 (forty) in height |
| S13 | 3079–3082 | `#score-play, #score-more { min-width: 2.5rem }` | `ea4e0f34` | `04` §0 R4 in width; **in rem, so under 40 px below 100 % text** |
| S14 | 3121–3132 | `#score-mode { flex: 1 1 3rem; min-width: 2.75rem; max-width: 8rem }` | `f9059ac5` (P21e A1), `e5462f9b` | one row at 360 upright; **the floor is under every label (U121), and the id outranks L5 sideways** |
| S15 | 3134–3137 | `.score-group { inline-flex; gap }` — Hands as one segmented control | `782835bb` | one target of three segments (`score.bar-targets`) |
| S16 | 3139–3145, 2560–2566 | the tempo label and `bar n / m` in `tabular-nums`, `bar n / m` `nowrap` | `782835bb`, `b272dce7` | equal digit widths; makes pricing at the widest digits exact |

### CSS, sideways (`@media (orientation: landscape) and (max-height: 500px)`, `style.css`)

| # | Lines | Rule | Lane | Invariant |
| --- | --- | --- | --- | --- |
| L1 | 961–963 | `.score-head { display: none }` | `6a8a92ae` | the header's row to the music sideways (P21d A6, `04` §0 R5) |
| L2 | 965–980 | `.score-bar { justify-content: flex-start; flex-wrap: nowrap }` | `6a8a92ae`; `nowrap` `68a56f05` | one row sideways: a long name wrapped `⋯` onto a second row |
| L3 | 982–1008 | `.score-bar__left { display: flex; flex: 0 1 auto; min-width: 0; overflow-x: clip }` | `68a56f05`; clip `fa4563d1` (U119) | the group yields; the clip: no text covers a control (`questions-e9aa51ae`, `fa4563d1`: "the final safety boundary") |
| L4 | 1010–1017 | `.score-bar__title { max-width: none; flex: 0 1 auto; min-width: 0 }` | `68a56f05` | the name yields |
| L5 | 1020–1022 | `.score-bar > :not(.score-bar__left) { flex: none }` | `68a56f05` | the controls keep their size (one row); **beaten by S14's id** |
| L6 | 1027–1030 | `.score-bar__left > :not(.score-bar__title) { flex: none; nowrap }` | `68a56f05` | Back and `bar n / m` never wrap (the group never taller for them) |
| L7 | 1041–1044 | `.score-bar__left > .score-bar__status { flex: 0 1 auto; min-width: 0 }` | `759596b4` (U119a) | a cut ordinary status ends in its own ellipsis (`fa4563d1` Q2) |
| L8 | 1056–1058 | `body:not(:has([data-sound-refused])) … .score-bar__title { flex-shrink: 1000000 }` | `759596b4` (U119a) | the name yields before the status; not during a refusal, so U105d's proportional share stands |
| L9 | 1066–1068 | `--strip-height: 56px` sideways | `6a8a92ae` | not an allocation: the room above the keys |

### CSS, the refusal

| # | Lines | Rule | Lane | Invariant |
| --- | --- | --- | --- | --- |
| R1 | 6218–6223 | the header's `.help-strip__now` wraps while `data-sound-refused` stands | `6a374f8a` (U105b), U105c | the refusal whole on the upright header (`6a374f8a`, `842ea210`); **not the bar's** |
| R2 | 6254–6263 | `body:has([data-sound-refused]) … .score-bar__status { max-width: none; flex: 0 1 auto; min-width: 0; white-space: normal; overflow-wrap: anywhere; text-wrap: balance }` | `bb271f4a` (U105d) | the refusal whole sideways (`842ea210`); the bar may grow while it stands (`bb271f4a` (a)) |

### Script (`app/src/ui/screens/ScoreScreen.ts`)

| # | Lines | Rule | Lane | Invariant |
| --- | --- | --- | --- | --- |
| J1 | 164; 1554–1561; 4924–4927 | `NARROW_BAR_PX = 440`: below it the mode shows one word and the tempo label drops the percentage | `f9059ac5` (P21e A1); 440 `b6555a9e` | one row upright at 360 and 412; **a width standing in for a fit** |
| J2 | 167; 1492–1495 | `TAP_MIN_PX = 40` checked on ▶ and ⋯ in `barIsOverfull` | `ea4e0f34` | `04` §0 R4; **a remedy (sending controls away) that cannot change what it checks** |
| J3 | 1450; 1655–1666 | `OVERFLOW_ORDER`: Hands, then `Hear it`; ▶, the mode, the tempo, ⋯ never leave | `ea4e0f34` | least-used first; "a gateway that could hide itself would be a trap" |
| J4 | 1485–1497 | `barIsOverfull`: the controls on more than one row, or ▶ / ⋯ under the tap minimum | `ea4e0f34`; the row count `759596b4` | one row (`08` §7.1); a symptom |
| J5 | 1523–1533 | `leftGroupIsCut`: the widest `bar m / m`, written in and read, past the group's right edge | `759596b4` (U119a) | Back and the complete location (`fa4563d1`; `759596b4` 3(a)); a symptom, priced at the widest |
| J6 | 1545–1551 | `fitBarControls`: all back, then send in order while J4 or J5; not while ⋯ is open | `ea4e0f34`; `759596b4` | the decision; the open-sheet skip keeps the sheet's rows under the finger |
| J7 | 1563–1568; 4928–4930 | callers: every `render()` (after the tempo label's text) and every `resize` | `f9059ac5`, `ea4e0f34` | the decision kept current; a face that changes after load waits for the next render (U119a observation 2) |
| J8 | 1452–1470 | `sendToSheet` / `bringBackToBar`: move a control into ⋯'s stash and back to its slot | `ea4e0f34` | the moved control keeps its id, state and listeners |
| J9 | 1218–1235 | `syncBarLeft` and its observer: the header's name, location and line mirrored into the group; the chip's text from the same lines | `6a8a92ae` | one state line (`04` §5f); content, not allocation |
| J10 | 4778–4792 | `drawWhere`; `where.hidden` while a status stands upright | `b272dce7`; `b6555a9e` | the header's own allocation; **not the bar's** |
| J11 | 3567–3570; 3611; 5582 | `measureBar` → `--score-bar-h`, on a fold and a resize | `76258d0b` | the stage keeps the bar's room at rest; not re-measured when a refusal grows the bar |
| J12 | 3255–3263 | `markRefused`: `data-sound-refused` on the refused control | G86a, U105 | the key R1, R2 and L8 read |
| J13 | 1252–1336 | `cornerTexts` / `foldedCornerReserve` (U118's chip) | U118, U118b | **adjacent, not in the model** (below) |

**Forty rules** (S1–S16, L1–L9, R1–R2, J1–J13), counting each table row once. Two have no invariant beyond presentation (S2, S4); one is dead (S6's `34vw`).

**U118's chip (J13): no shared allocation dependency.** The reviewer's clarification asked for one to be named with its lines if found. The chip and the bar share *content*, not room: `syncBarLeft` (1218–1230) writes the chip's text and the bar's mirror from the same lines, and `cornerTexts` (1252–1301) prices the chip from the same sentences. Their geometry never meets: the chip is drawn only while the chrome is folded (`foldedCornerReserve` returns 0 otherwise, 1317–1318), when the bar is `opacity: 0`, `inert` and measured at 0 (`foldChrome` → `measureBar`, 3567–3570, 3611); its reserve is keyed on the stage's width and the chip's face (1321), neither of which the bar's allocation changes. The model leaves the chip alone. One consequence to keep in view: the refusal's own line is drawn only while the bar is (a refusal standing while the chrome is folded is the chip's sentence, as today).

## 2. Invariants, stated once

| # | Invariant | Ruling | Today |
| --- | --- | --- | --- |
| I1 | ▶ and ⋯ always on the bar, visible, at least 40 × 40 CSS px | `04` §0 R4; J3; `score.bar-targets` `MUST_STAY` | broken below 100 % text: 36 px (S13 in rem) |
| I2 | the mode select and the tempo label never leave the bar | J3 (the order's comment); `score.screen.spec.ts` asserts it | holds |
| I3 | the controls are one row | `08` §7.1; `questions-e9aa51ae` (U119); `759596b4` 3(c): a refusal's height is not a second row | holds |
| I4 | Back usable and the piece's widest `bar m / m` whole, sideways | `fa4563d1`; `759596b4` 3(a) | holds |
| I5 | a cut status, or a cut name, visibly marked | `fa4563d1` Q2; `759596b4` Q1 (a character-boundary ellipsis is enough; *P..* accepted) | the name is drawn narrower than its first letter and an ellipsis in 50 states (a bare letter, *H*, or less), the status in 1 (U119a's accepted *P..*) |
| I6 | a sound refusal's sentence whole, wherever the learner reads it | `6a374f8a`, `842ea210`, `bb271f4a` | broken in 17 refusal states (a column of characters) |
| I7 | a control that visible text tells the learner to tap is itself visible | `759596b4` 3(b) | see §5.5 |
| I8 | nothing the bar draws is outside the window | U120 (`759596b4`, kept P1) | broken in 20 refusal states |
| I9 | a selected value readable | U121 (`759596b4`, a P2 finding); `score.bar-targets`' stated intent | broken in 500 of 556 sideways states, 13 of 52 upright |
| I10 | no control moves mid-piece | `759596b4` 3(a) (price the widest location so controls do not move as the piece goes on) | holds for the location; not for the tempo label or `Hear it`/*Stop*, whose widths change mid-run (§7, inferred from the code) |
| I11 | the ordinary status keeps its density contract (one line, its ellipsis) | `842ea210`; `bb271f4a` ("no general multi-line ordinary-status rule") | holds |
| I12 | while a refusal stands, the bar may grow; the name is not removed merely to keep the old height; no third status surface for a narrow exceptional state | `bb271f4a` | the growth is unbounded (I8) |
| I13 | no arbitrary breakpoint: a threshold is derived from measured widths | `questions-e9aa51ae`; `fa4563d1` | J1 is one |
| I14 | the group's clip stays as the last fence | `fa4563d1` | holds |

Added by this inventory: I1's unit (the rule is in pixels, the floor in rem), I10's extension to every variable text, I12's bound (I8 gives the growth a ceiling the ruling did not state), I13 applied to J1.

**Conflicts.**

1. **I6 + I12 (the name kept) against I8, with the sentence in the group.** U105d's proportional share keeps the name and gives the sentence what is left, which at 568–667 px is a few pixels. No in-group allocation satisfies I6, I8 and I12 together at the U120 cells without moving a control for the refusal, which `759596b4` 3(c) rules out. Resolved by the sentence's own line (§3.4): the name is never reduced, the bar grows one line.
2. **The own line against I12's "no third status surface".** The own line is the same element (`#score-status-side`), in the same bar, in every refusal at every width; it is not a new surface and not narrow. That is a reading of `bb271f4a` the reviewer should confirm (§5.4).
3. **I7 against I4 and I9, during a refusal of a control behind ⋯.** Not resolvable inside the model; the product choice of §5.5.
4. **I9 against Hands and `Hear it` on the bar, upright** (13 cells). Not a conflict of invariants: Hands and `Hear it` may leave (J3, `759596b4` 3(b)). A trade, made by the existing rule that a control is better in ⋯ than drawn too small (`score.bar-targets`' header); named in §5.4.
5. **U105d's committed rows assert that the bar does not grow under a refusal at 740 × 342** (`score.screen.spec.ts`:1990–1992). An oracle encoding the old placement, not an invariant: `bb271f4a` allowed growth. The assertion changes (§6).

## 3. The model

### 3.1 Items, each with a minimum and a preferred width

Every item is **priced at the widest content it can show in this piece at this geometry**, so the price never depends on the run's state. Measured on unseen copies laid out in the item's own parent (the same rules give it its face and size), once per key: the window's width, the root font size, the bar's computed face, the piece's last printed bar, the piece's widest bpm.

| Item | Minimum | Preferred | Priced at |
| --- | --- | --- | --- |
| ▶ | the tap minimum: `max(40px, its content)` | the same | the wider of ▶ and ⏸ |
| ⋯ | `max(40px, its content)` | the same | — |
| Back (sideways) | its content | the same | *← Back* |
| `bar n / m` (sideways) | the piece's widest | the same | *bar m / m*, m the last printed bar (U119a's price) |
| mode select | its short form | its long form | each form at the widest of its four labels (*Tempo*; *Play it to me*) |
| tempo label | its short form | its long form | *888 bpm* and *130% · 888 bpm*, as many digits as the piece's written tempo at the slider's top (130 %) |
| `Hear it` | its content, or off the bar | the same | the wider of *Hear it* and *Stop* |
| Hands | its content, or off the bar | the same | *R L Both* |
| the ordinary status line (sideways) | 0, or its floor | its one line, capped at 28vw (S7) | its band: 28vw |
| the piece's name (sideways) | 0, or its floor | its one line | — |
| a refusal sentence | not a row item | — | its own line (§3.4) |

A yielding text's **floor** is its first letter and a whole ellipsis: narrower than that, Chromium draws a bare letter or part of one with no mark (the name reads *H* at 780 × 360). A yielding text gets its floor or more, or nothing.

### 3.2 The priority order

First to give, first in the list:

1. the piece's name (to its floor, then nothing) — `fa4563d1`, U119a's `titleFirst`;
2. the tempo label's percentage (long → short) — the percentage is written on the tempo sheet's slider; the bpm is what is read while playing (the comment at `ScoreScreen.ts`:4920);
3. the mode's sentence (long → short) — the dropdown lists every sentence whole;
4. the ordinary status line (to its floor, then nothing) — `fa4563d1`: "title and ordinary status are the yielding content";
5. Hands → ⋯ — J3, `fa4563d1`;
6. `Hear it` → ⋯ — J3, `759596b4` 3(b);
7. never: ▶, ⋯, the mode's word, the bpm, Back, the widest location.

Items 2–3 come before 4 because a long word repeats what the learner can find one tap away, while the status line is the only copy of what the app is saying sideways (the header is not drawn). Measured against the opposite order in §5.4.

### 3.3 The allocation

```
inputs: W (the bar's width), the priced widths (3.1), the bar's gap g, sideways or not
band  = sideways ? 0.28 × window width : 0                       // the status line's own cap, S7
fixed = ▶ + ⋯ + (sideways ? Back + widest location + 3 × the group's gap : 0)
for (hear, hands) in [(on, on), (on, off), (off, off)]:                      // 5, 6
  for (mode, tempo) in [(long, long), (long, short), (short, long), (short, short)]:   // 2, 3
    items = fixed + mode + tempo + (hear ? Hear it : 0) + (hands ? Hands : 0)
    need  = items + g × (number of bar children − 1)
    if need + (any long word ? band : 0) ≤ W: return (hear, hands, mode, tempo, slot = W − need)
none fits: the stop condition (never reached in the 202 cells measured)
slot (sideways): the status line takes min(slot, its one line, band), the name the rest (3.2: 1, 4);
                 each at its floor or more, or nothing.
```

Upright the same function runs with no group items and no band: words long where they fit, then Hands, then `Hear it`.

**Properties.** The configuration is a function of geometry and piece only: no state input, so nothing on the bar moves when a run starts, pauses, is refused, demonstrates or changes tempo (I10), and a render while a refusal stands cannot move a control (`759596b4` 3(c)) because the refusal is not an input. A control leaves only when no form of the words fits with it (I9 before 5–6), and a long word comes back whenever the room allows. The row is one line by arithmetic (I3); the wrap (S1) and the group's clip (L3, I14) stay as fences that never fire when the arithmetic is right.

### 3.4 Where the refusal sentence lives

Measured both ways on the 64 refusal cells, ▶'s and `Hear it`'s sentences (`placement.txt`), the model's row under both:

| | Today (in the group, shared with the name in proportion) | A: in the status slot, the name giving all of it first, word-wrapped | **B: a line of its own across the top of the bar** |
| --- | --- | --- | --- |
| sentence whole | 121 of 128 | the room is narrower than the sentence's longest word in 10 (it breaks inside a word or overflows) | 128 of 128 |
| inside the window | 120 of 128 | 118 of 118 where it fits | 128 of 128 |
| lines | up to 31 | up to 6 | 1 in every state |
| bar height | up to 554 px | up to 124 px | 71–83 px |
| the name | shares with the sentence | gives all of its room (`bb271f4a`: not removed merely to keep the height) | never reduced: its ordinary room, and the status line's besides while the sentence is on its own line |
| the row | unchanged since U119a | unchanged | unchanged |

**Recommendation: B.** It is the only placement that meets I6, I8, I12's name clause and `759596b4` 3(c) in every measured state. The same element (`#score-status-side`) takes the line, so there is still one state line, in the bar, read once (`04` §5f). A learner meets the whole sentence on one line directly above the row whose ▶ or `Hear it` it names, the row exactly as it was; the cost is one line of height, about twenty pixels, in every sideways refusal, including the wide cells where today the sentence sits beside the name without growing the bar (136 of 320 refusal states measured are taller under B than today, 184 shorter). At rest the stage can refit around that line (`bb271f4a`: "At rest the stage can refit around that height"), which the build measures when the line comes and goes (J11; read in the code, not measured: `measureBar` runs on a fold and a resize only, so today a refusal's growth is not given back to the stage); during a paused run the bar overlays the foot of the music, as it does already.

Rejected: the `⋯` sheet (the learner would have to close it to tap what the sentence names); a toast (G86a's ruling: "The state line is the surface: no toast").

### 3.5 Upright

The same function governs the upright bar (no group, no band). The status is in the header there, and R1 keeps the header's refusal whole; the header's own allocation (J10) is outside this model. Upright the model changes outcomes only where today's select is cut (§5.3).

## 4. The mapping

**K** kept as is; **S** subsumed by the model (the model states it, the rule's mechanism is replaced); **D** deleted.

| # | | What becomes of it |
| --- | --- | --- |
| S1 | K | the wrap stays as the fence; sideways it is also what lets the refusal's line sit above the row (L2's `nowrap` goes) |
| S2, S3, S4 | K | presentation and the measured gaps; the model reads the gap from the page |
| S5 | S | `margin-right: auto` and the group's content basis replaced by `flex: 1 1 0; min-width: 0` sideways: the group is exactly the slot |
| S6 | D | the `34vw` cap applies nowhere; the rest of the rule (face, ellipsis) stays |
| S7 | K | the `28vw` cap is the status line's preferred width and its band in the order |
| S8, S10, S11 | K | not allocations |
| S9 | S | the tempo label's give (`flex: 0 1 auto; min-width: 0; ellipsis`) replaced by its priced width (`min-width` at its widest form, `flex: none`): it is never cut |
| S12 | K | the forty in height |
| S13 | S | `min-width: max(2.5rem, 40px)`: the tap minimum in the invariant's own unit |
| S14 | S | `flex: none; width:` the chosen form's priced width: never under its label (U121) |
| S15, S16 | K | |
| L1 | K | |
| L2 | S | `nowrap` deleted (the arithmetic keeps the row one line; S1's wrap carries the refusal's line); `flex-start` kept |
| L3 | S + K | `flex: 0 1 auto` → `flex: 1 1 0` (S5); `overflow-x: clip` kept (I14) |
| L4, L6, L7 | K | the name and the status line shrink; Back and the location do not |
| L5 | K | the controls keep their priced sizes; with S14 and S9 nothing outranks it any more |
| L8 | S | the weight stays (the name yields before the status line); its `:not(:has([data-sound-refused]))` exception goes, since the refusal is no longer in the group |
| L9 | K | |
| R1 | K | the header's, not the bar's |
| R2 | S | replaced by the own-line rule: while `data-sound-refused` stands, sideways, the status element is the bar's first line (`flex: 0 0 100%`, `max-width: none`, `white-space: normal`, `overflow-wrap: normal`, `text-wrap: balance` kept for a sentence that ever needs two lines) |
| J1 | S | `NARROW_BAR_PX` deleted; the forms come from the fit (I13) |
| J2 | S | `TAP_MIN_PX` kept as ▶'s and ⋯'s priced minimum; no longer a symptom check |
| J3 | K | the order itself, now positions 5–6 of the one order |
| J4 | D | no symptom check; the row's line count is arithmetic |
| J5 | S | the widest location is a priced fixed item, not a written-in-and-read check |
| J6 | S | `allocateBar()`: price once per key, choose, apply; the open-sheet skip kept |
| J7 | K | the callers (render, resize); cheap when the key is unchanged; a face change after load is caught at the next render by the key |
| J8 | K | how a control goes to ⋯ and back |
| J9, J10, J12, J13 | K | content, the header, the mark, the chip |
| J11 | K | measured again when the refusal's line comes and goes (the build's one addition here; §7) |

Fourteen rules replaced or deleted (S5, S6, S9, S13, S14, L2, L3's basis, L8's exception, R2, J1, J2's check, J4, J5, J6's loop), by one function and five declarations (S5/L3's group basis, S9's tempo price, S13's floor, S14's select price, R2's own line) plus the yielding-text floor; twenty-six kept.

## 5. Predicted outcomes

### 5.1 How they were computed

`runs/U122/scripts-probe.spec.ts`, built from U119a's probe, on port 5353. Per state it records (1) today's bar as drawn, (2) every item's own width on an unseen copy in its own parent, and (3) the model applied in the page — the same elements moved to and from the bar, their styles set to the priced widths, the refusal's element moved to the bar's first line — then measured and put back. The model in the page is the same arithmetic as `scripts-model.py`; `scripts-accounting.py` shows that arithmetic rebuilding today's row from today's drawn widths within 0.07 px. The grids:

- **U119a's paused grid** — 568 × 320, 640 × 360, 667 × 375, 700 × 350, 720 × 360, 740 × 342, 780 × 360, 844 × 390; 100 % and 115 % text; both faces; Hot Cross Buns and Moonlight III: 64 cells, at rest and paused (128 states). U119's 52 cells and U105d's 740 × 342 and 667 × 375 cells are inside it.
- **The refusal grid** — the same 64 cells (U119a's 40 refusal cells are its 568–780 rows), at rest, ▶ refused, `Hear it` refused, after the tempo sheet opened and closed, after a resize, and ▶ refused over a paused run (U105d's other state): 384 states.
- **Upright** — 280 × 740, 320 × 740, 342 × 740, 360 × 780, 390 × 844, 412 × 915; both text sizes, faces and pieces: 48 cells.
- **The one-row case's and the target sweep's other sideways widths** — 880 × 412 and 1200 × 360, with When the Saints (alternating), the longest title in `score.bar-targets`: 16 cells.
- **90 % text** — 568 × 320, 740 × 342, 780 × 360 sideways and 360 × 780, 390 × 844 upright, Hot Cross Buns: 10 cells.

202 cells, 608 states, 202 tests passed (`run-*.txt`). Tables: `outcomes-*.txt` (every state, today beside the model), `orders.txt`, `placement.txt`, `hidden.txt`, `shortfall.txt`. Pictures: `pictures/`.

### 5.2 The summary

| Grid | States | Today: invariant failures (measured) | Model: invariant failures (applied, measured) | Configuration differs between a cell's states |
| --- | --- | --- | --- | --- |
| paused | 128 | mode label cut 114; name under its floor (no whole mark) 8; status under its floor 1 | none | 0 of 64 cells |
| refusal | 384 | mode label cut 368; bar above the window 20; sentence above the window 20; sentence not whole 17; ▶ above the window 8; name under its floor 42 | none | 0 of 64 |
| upright | 48 | mode label cut 13 | none | — (one state) |
| 880 × 412, 1200 × 360 | 32 | mode label cut 16 | none | 0 of 16 |
| 90 % text | 16 | mode label cut 2; ▶ and ⋯ at 36 px and Hands and `Hear it` behind ⋯ in all 10 cells | none | 0 of 6 |

### 5.3 Every cell where the model changes an outcome, and what a learner gains or loses

Counted in states; the cells are listed in `outcomes-*.txt`.

**Sideways (556 states).**

- **The selected mode reads whole** where it is cut today: 500 states. The word (*Wait*, *Tempo*) in 423 of them and the sentence (*Wait for me*) in 77, mostly at 720–1200 px and 100 % text; 17 states that read the sentence whole today (at rest, where today's select grows into the empty status line) read the word, because the bar is priced the same at rest as paused. *Gain:* the mode is readable (today *Wa* or *W*); *loss:* the sentence, in those 17 at-rest states only.
- **The tempo label drops its percentage** in 500 states (*50 bpm* for *70% · 50 bpm*). *Loss:* the percentage is on the tempo sheet's slider, one tap away; the bpm stays.
- **Hands comes back to the bar** at 640 × 360, 115 %, wider face, Moonlight III (8 states), where with the short words it fits. *Gain:* hands-separate practice from the bar; *loss:* the paused line there reads 1 character instead of 11.
- **The paused line** (64 paused states): more characters in 41, fewer in 1 (above); at 2 characters or fewer in 3 cells (today 4); median 22 characters (today 21).
- **The name**: more characters in 86 states, fewer in 39 (mostly paused at 780–1200 px, where the long words now take the room the cut select gave it, and at 90 % text, where Hands and `Hear it` come back), drawn at its floor or not at all everywhere (today under its floor in 50 states).
- **A refusal**: the sentence whole on one line in all 320 refusal states, the bar 71–83 px tall. Shorter than today in 184 states (U120's four cells from 412–554 px to 71–83 px, ▶ and the sentence back inside the window), taller in 136 (by up to about 20 px at the wide cells where today the sentence fits beside the name). *Gain:* the sentence is readable as a sentence, never a column, and never off the screen; *loss:* one line of height at the wide cells.
- **90 % text**: Hands and `Hear it` back on the bar in all 6 sideways cells, ▶ and ⋯ at 40 px; the name loses characters to them while paused.

**Upright (52 states).**

- **The selected mode reads whole** in the 13 cells where it is cut today; in 23 of the 48 cells at 100 % and 115 % (and 3 of 4 at 90 %) the model shows the sentence (*Keep tempo*) where today the word is shown, because the room allows it.
- **Hands goes behind ⋯** in 8 cells (342 × 740 at 100 % on the app's face; 360 × 780 at 100 % on the wider face; 390 × 844 at 115 % on the app's face; 412 × 915 at 115 % on the wider face; both pieces): the row is 9–22 px short of keeping it with *Tempo* whole (`shortfall.txt`); today the select is squeezed by exactly that much (*Temp*). **`Hear it` goes behind ⋯** in 5 cells (280 × 740 and 320 × 740 on the wider face or at 115 %): 2–23 px short. *Gain:* a whole mode label; *loss:* hands-separate practice or a demonstration is one tap further away at those sizes. The owner's 360 × 780 at 100 % on the app's own face does not change.
- **90 % text**: Hands and `Hear it` back on the bar at 360 and 390.

### 5.4 Choices the model makes that change what a learner sees

For the reviewer to confirm or overturn; each was measured both ways.

1. **The refusal's own line (§3.4).** The alternative that keeps the sentence in the group (A) breaks inside a word in 10 states and removes the name; today's placement leaves the window in 20.
2. **The status line's band before long words.** Measured against the opposite order (long words first, the status line taking what is left) on the 64 paused cells (`orders.txt`): the paused line reads 2 characters or fewer in 13 cells under that order against 3 under the band (4 today), median 8 characters against 22 (21 today). The band is S7's existing `28vw`, not a new number; if the reviewer prefers another band (for example the widest first word of any status line), only the band changes.
3. **A whole mode label before Hands or `Hear it` stays on the bar** (upright, 13 cells, §5.3). The alternative keeps the controls and lets the select cut its word by up to 23 px; it needs a number for how much cut is readable, which nothing has ruled.
4. **The yielding-text floor.** U119a's accepted narrowest status (*P..*) becomes *Pa…* here because the model leaves that cell more room; the floor's own effect is that a name or a status narrower than its first letter and an ellipsis is not drawn.

### 5.5 Stop: a refusal can name a control that is behind ⋯ (I7)

Not chosen. At the cells where the row cannot hold Hands, or `Hear it`, with every word whole, a refusal of that control names a control the learner cannot see on the bar: *Sound did not start — tap R again* (a hand tapped after *Nothing for the … hand*), *— tap Hear it again*. Measured at rest (`hidden.txt`): Hands is behind ⋯ in 39 of the 138 distinct cells under the model and in 42 today; `Hear it` in 8 under the model (280 × 740 and 320 × 740 upright) and in 13 today (3 of those upright, 10 at 90 % text). No allocation meets I4, I9 and I7 together there during such a refusal: at 280 × 740, 115 %, Hot Cross Buns, the row is 23 px short of holding `Hear it` with *Tempo* whole. The learner tapped that control inside the ⋯ sheet, which stays open after the tap (read in the code: a sheet closes on *Close*, a tap on its backdrop or Escape, `widgets.ts`:283–305, and when the screen goes, `ScoreScreen.ts`:5680), and reads the sentence once the sheet is closed.

| Option | What a learner meets | Cost |
| --- | --- | --- |
| (a) Pin the named control on the bar while its refusal stands | the control appears on the bar beside the sentence and leaves when it goes | the bar changes on a refusal, which `759596b4` 3(c) ruled out for the sentence's height; where nothing else can give, the mode label is cut again (I9) or the location (I4) |
| (b) The sentence names the sheet: *Sound did not start — tap Hear it in ⋯ again* | the instruction says where the control is, as the paused line already does (*Start again in ⋯*) | a copy change to `STATE_TEXT.soundOff`, unverified as copy; a longer sentence (still one line on the own line at every width measured) |
| (c) Accept | the sentence names a control that is one tap away, in the sheet where the learner just used it | I7 as ruled is not met at those cells |

### 5.6 U120 and U121 as acceptance cases

- **U120** (`runs/U119a/scripts-refusal-568.spec.ts`): at 568 × 320, 115 %, the app's face, Hot Cross Buns, today the bar is 514–554 px in a 264 px room, ▶ 15–35 px above the window, the sentence 25–27 lines; under the model the bar is 83 px, ▶ and the sentence inside the window, one line. On the wider face with Moonlight III: 412–428 px → 81–83 px. Also at 568 × 320, 100 %, wider face, Moonlight III (429–508 px → 71–72 px), and at 667 × 375, 115 %, wider face, Moonlight III (466–482 px → 81–83 px): U120's class is four cells, not one. `pictures/refusal-refusal-568x320-t115-stack-hcb-*.png`, `…-667x375-t115-wider-moon-*.png`.
- **U121**: at 568 × 320, 115 %, wider face, Hot Cross Buns, paused, today *Wa* in 51 px of the 125 its label needs; under the model *Wait* whole, Hands behind ⋯ as today, *50 bpm*, the paused line *Paused —…* where today *Paused…*. At the owner's 780 × 360 at 100 % on the app's own face today reads *Wa*; the model *Wait for me*. `pictures/paused-paused-568x320-t115-wider-hcb-*.png`, `…-780x360-t100-stack-hcb-*.png`.

## 6. The build plan: one lane

**Files.**

- `app/src/ui/scoreBarLayout.ts` (new): the pure chooser of §3.3 — priced widths in, configuration and slot out — so the order is unit-tested without a browser.
- `app/src/ui/screens/ScoreScreen.ts`: `allocateBar()` replaces `barIsOverfull`, `leftGroupIsCut`, `fitBarControls`' loop, `applyModeLabels`' threshold and the tempo label's threshold text. It prices the items once per key (window width, root font size, the bar's computed face, last printed bar, widest bpm digits) on unseen copies in their parents (the way `foldedCornerReserve` prices the chip), chooses, applies (J8 for Hands and `Hear it`; the select's options' text and width; the tempo label's form and width, as custom properties on the bar), and hides a yielding text under its floor. The refusal's element moves to the bar's first line and back where `markRefused`/`drawWaitingFor` set and clear the mark; `measureBar` runs when it does. `NARROW_BAR_PX` deleted; `TAP_MIN_PX` kept as a price. The open-sheet skip kept.
- `app/src/style.css`: the five declarations of §4 (S5/L3, S9, S13, S14, R2 → the own line), L2's `nowrap` and S6's `34vw` deleted, L8's exception dropped. Nothing outside the bar's rules.
- Docs: `08-score-render-states.md` §7.1 (the one order, in place of "below 440 px …"; the §13 walk table's row that still says 400 px, line 1160), `04-ui-spec.md` §5 (the sideways refusal on its own line), `08-test-map.md` (the rows below).

**The oracle: the existing matrices kept; an assertion changes only where the model deliberately changes an outcome.**

| Test | Class | What changes, and why |
| --- | --- | --- |
| `score.screen.spec.ts` `barLeftAgainstControls`: `fitsWithHands`, `fitsWithHear` | replace | today they put a control back and read U119a's minimum on the live bar, where the select still shrinks; the model decides with every word whole, so the oracle recomputes the configuration independently from the items' own widths (the probe's method), and asserts Hands and `Hear it` on the bar exactly as that recomputation says |
| the same helper's `titleFirst` | replace | its `refused ||` exemption goes: the refusal is no longer in the group |
| every sideways paused row (`SIDEWAYS_PAUSED`, 23) | add assertions | the selected mode's label whole (its own width against the select's), the tempo label whole, no yielding text under its floor — red today in every row (the label) |
| U105d's two 740 × 342 refusal rows (`:1836`) | replace | `seen.rows` 1 → the controls' rows 1; `seen.bar ≈ ordinary.bar` and `barScroll` → the bar grows by exactly the sentence's line and its gap, the sentence's line above the controls; the rest (whole, clear, in the window, no control under it, the name drawn, back to the ordinary height after) kept |
| U119's 667 × 375 refusal row (`:2342`) | preserve | |
| U119a's 568 × 320 refusal row (`:2401`) | preserve, plus | the controls unchanged by a render while the refusal stands (kept); add the sentence on one line above the controls, the bar inside the window |
| U120's reproducer (`runs/U119a/scripts-refusal-568.spec.ts`) | add, green | into the suite as `759596b4` Q2 asked once U120 is fixed: both cells, ▶ and the sentence inside the window, the bar no taller than the room |
| a 90 % text row (568 × 320 and 780 × 360 sideways, 360 × 780 upright) | add | ▶ and ⋯ at 40 px or more; Hands and `Hear it` where the recomputation keeps them — red today |
| a state-independence row (740 × 342, wider face) | add | the controls and the select's and tempo label's widths identical at rest, paused, ▶ refused, during *Hear it* (*Stop*) and after the tempo sheet sets 130 % |
| `score.bar-targets.spec.ts` "nothing squeezed into illegibility" | replace | `scrollWidth > clientWidth` cannot see a select's cut label; the select's own label width against its drawn width instead — red today at 342 × 740 on the app's face (measured here at rest, Hot Cross Buns); the sweep's other widths at its own heights were not each measured |
| `score.head-height.spec.ts` "the hands control is reachable during a run when the bar has sent it to the sheet" (`:317`) | replace (the forcing) | it forces the overflow by giving the real tempo label `min-width: 260px` and resizing, which the symptom loop saw; the model prices copies, which the injected id rule does not reach. Force it with a width the model sends Hands away at (320 × 740) |
| `score.spec.ts` *one row, seven controls at most* | preserve | five viewports, unchanged |
| `tests/unit/scoreBarLayout.test.ts` | add | the chooser over the probe's measured widths for U121's cell, U120's cell, 640 × 360 115 % wider Moonlight III (Hands back), 342 × 740 (Hands away), 90 % text; the order (each step's flip point); the configuration never a function of the status text |

**Mutants** (each killed by a named row):

| Mutant | Killed by |
| --- | --- |
| the select back to `flex: 1 1 3rem; min-width: 2.75rem` | the sideways paused rows' label assertion (the label is cut in 114 of the paused grid's 128 states today) |
| long words before the status band (§5.4 2 reversed) | the unit test's order; the recomputed configuration in the sideways rows where the two orders differ (most rows from 640 to 780 px: `orders.txt`) |
| Hands leaving before the words shorten | the unit test's order (each step's flip point) |
| the tempo label priced at its current text | the state-independence row (its width after 130 %) |
| the refusal back in the group (R2 restored) | U120's two rows (the window) and U105d's rows (the line above the controls) |
| the tap floor back to `2.5rem` alone | the 90 % row (▶ at 36 px) |
| the group's basis back to `auto` with the wrap | U120's rows and U119a's 568 × 320 refusal row (seen in the probe before its group was given a zero basis: the controls went to a second row under the refusal's line at 568 × 320) |
| the yielding-text floor removed | the 780 × 360 paused row at 100 % on the app's face (the name a bare *H*) |

**Harness**: as `operating-procedure.md` §14; one browser suite at a time; the gallery's bar pictures and the tour change where the labels change (`states/probe.ts` reads `#score-mode`), so their baselines are rebuilt in the same lane.

## 7. Findings outside the model

- **Inferred, not observed: two widths change mid-run today.** The tempo label sideways is `flex: none` at its current text, so a ladder step from 99 % to 100 % widens it by a digit, and `Hear it` reads *Stop* while it plays. Either can flip `leftGroupIsCut` at a cell within a digit of its boundary and move Hands mid-piece. The model prices both at their widest. Not reproduced; the state-independence row would show it.
- **Read in the code, not measured: a refusal's growth is not given back to the stage** (J11): `measureBar` runs on a fold and a resize only, so at rest today's grown bar overlays the stage's foot rather than the stage refitting around it as `bb271f4a` described. The build measures when the line comes and goes; its oracle can read `--score-bar-h` against the bar's height.
- ***Nothing for the left hand in this piece — choose R or Both*** is an ordinary status line that names Hands' controls; where Hands is behind ⋯ it names hidden controls, and as ordinary status it is cut. Not a refusal by any ruling; recorded, not changed.
- **The probe's model pictures upright show the tempo label at 100 %** where the page's label carried no percentage to read; the priced width (at *130% · 88 bpm*) and the layout are unaffected.
