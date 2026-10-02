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

## 8. The one-row premise, measured: the landscape Score chrome (U122a)

The brief (`docs/prompts/tasks/U122a-the-bar-premise-measured.md`) names this section §7; U122's own §7 holds its findings outside the model, so it is §8 here. A design addendum, no app code changed. Worktree base `f9322175`, which contains `842157ef`; nothing under `app/src` differs between the two. It answers the owner's question of 2026-10-01, *why put everything on one line, and why not put the piece's name and the bar location at the top of the screen*, under the reviewer's correction (`docs/review/responses/b47ce498-correction-1.md` §1: test the surface decomposition before the width allocator; `docs/review/holistic-reassessment.md`) and with CL07's reading objective judged in the same comparison (`docs/review/remaining-work-holistic-review-2026-10-01.md`, *U122 + CL07*; `docs/review/responses/questions-90b19bee-correction-1.md`). Evidence: `docs/prompts/runs/U122a/` (Entry 209). **Every pixel count and count of cells below was measured in this machine's Chromium** on U122's two faces; the claims are the relationships (more, less, the same, which term decides). Unverified on a device; nothing was heard; no pedagogical verdict applies except where a control's or a sentence's place changes what a learner can do.

### 8.0 Judgement

**The screen, in product terms (candidate c6, recommended as a product trade, not chosen).**

- **At the top:** one thin line of orientation: the piece's name on the left and `bar n / m` on the right, in the folded chip's type. During a run it lies in the band the run already keeps at the top of the stage for `bar n / m` (§8.2), and when the chrome folds the chip that replaces it says `bar n / m` in the same corner.
- **At the bottom:** one row of what the hands reach for: Back, ▶, `Hear it`, the mode, Hands, the tempo and ⋯, each priced and chosen by U122's order (§3), with the ordinary status line (the paused line, the ladder's pass line) in the row's spare width.
- **Only while it stands:** a sound refusal's sentence on a line of its own directly above that row, whose control it names (U122 §3.4 B, unchanged).
- **Why:** the bar's height costs the music only at rest, because a run gives the bar's whole row to the music at its start (`style.css`:2972–2974); and a run already prices a band at the top for `bar n / m` (`sheetShift`, `WindowRenderer.ts`:2133–2139). So orientation is cheapest at the top, inside that band: it costs a run nothing and costs the at-rest stage one line. The controls stay where the hands are. The refusal, exceptional, takes height only while it stands.

**Why not the others, in one line each.** c1 (U122's one row) costs the music nothing, but the piece's name is drawn whole in 39 of 86 sideways cells at rest and not at all in 60 of 86 while paused. c2 (the same thin line, at the bottom above the controls) costs the same at rest, and the paused line is whole there; but `bar n / m` jumps from the bottom-left to the top-right chip at every fold. c3 (the name and location as an overlay in the corner) covers fingerings, and in Moonlight other ink at the stave's top-right, in 54 of 86 cells at rest; the correction rules out chrome over the score unless the region is measured clear, and it is not. c4 (Back, the name and the location at the top, as the coordinator specified) restores the old header row: Back's tap target sets the zone's height (36–46 px across the three text sizes). At rest it costs the stave in 46 of 86 cells, by up to a fifth. In a run it costs 12 cells, by up to 17 %. c4 and c5 also move the mode, Hands and the tempo behind ⋯ because the code shows they restart a run (§8.3). The selected mode is then readable nowhere on the screen in any cell, which inverts U121's acceptance. Hands' sentences name a control behind ⋯ in every cell. And the bpm that the ladder moves is gone from the screen.

**The one comparison** (sideways: U119a's 64 cells plus U122's 880 × 412, 1200 × 360 and 90 % text cells, 86 cells; "at rest" and "in a run" are against c1 on the same cell; this machine's Chromium):

| | c1 one row (U122) | c2 two tiers, bottom | c3 corner overlay | c4 by role, Back on top | c5 by role, compact top | **c6 context top, controls bottom** |
| --- | --- | --- | --- | --- | --- | --- |
| Top / bottom / transient | — / everything / refusal line | — / thin context line + controls / refusal on the thin line | chip over the score / Back, status, controls / refusal line | Back, name, location (folds) / ▶ Hear it ⋯ / status and refusal strip | name, location (in the band) / Back ▶ Hear it ⋯ / status and refusal strip | name, location (in the band) / Back, status, every control / refusal line |
| Stage at rest | — | 18–25 px less | same | 36–46 px less | 18–22 px less | 18–22 px less |
| Five-line stave at rest | — | smaller in 16 cells, ≤ 11 % | same | smaller in 46 cells, ≤ 20 % | smaller in 16 cells, < 10 % | smaller in 16 cells, < 10 % |
| Stave in a run | — | same | same¹ | smaller in 12 cells, up to 17 % | same | same |
| Next music in view; bars vs the Bars option | in view in every cell | in view everywhere; at rest 2 of 2 bars where c1 shows 1 in 11 cells | as c1 | in view; 2 of 2 in 23 cells at rest, 18 in a run | as c6 | in view everywhere; at rest 2 of 2 where c1 shows 1 in 10 cells |
| Stave under the 22-px floor | none | none | none | none at rest; 6–7 cells under an at-rest refusal (down to about 18.7 px) | none | none |
| Chrome over notation | the bar over the foot while shown mid-run: 8 cells (13 under a paused refusal) | 13 cells | the chip over fingerings in 54 cells at rest, 64 paused | the bar and strip over notes in 69 cells paused, 39 at the freeze | 36 cells paused | 10 cells paused, 36 under a paused refusal |
| Name whole (rest / paused) | 39 / 4, not drawn paused in 60 | 85 / 38 | 46 / 46 | 82 / 82 | 86 / 86 | 86 / 86 |
| `bar n / m` and its widest whole; Back ≥ 40 px and hit | 86; 80² | 86; 80² | 86; 80² | 86; 80² | 86; 80² | 86; 80² |
| Selected mode readable | whole, 86 | whole, 86 | whole, 86 | not on the screen | not on the screen | whole, 86 |
| ▶ and ⋯ ≥ 40 px and hit; one control row | 80²; 86 | 80²; 86 | 80²; 86 | 80²; 86 | 80²; 86 | 80²; 86 |
| Hands / `Hear it` on the row | 83 / 86 | 86 / 86 | 86 / 86 | behind ⋯ / 86 | behind ⋯ / 86 | 86 / 86 |
| Paused line whole | 0 (about 26 characters) | 81 | 0 | 86 | 86 | 0 (about 30 characters) |
| Refusal (▶, Hear it, after a render, over a paused run): whole, one line, in the window, named control drawn and hit | 430 of 430 | 430 of 430 | 430 of 430 | 430 of 430 | 430 of 430 | 430 of 430 |
| U120 (568 × 320 at 115 %, both faces) | bar 83 px, sentence whole, ▶ and the sentence in the window | 83–85 px, same | 83 px, same | 83 px, same | 83 px, same | 83 px, same |
| U121 (568 × 320, 115 %, wider face, paused) | *Wait* whole | *Wait for me* whole | *Wait* whole | not on the screen | not on the screen | *Wait* whole |
| What moves during a run | the music, 22 px down at the fold and back at every reveal (86 of 86 at the reveal); no control | the same | the same | the music, by the zone less the band (up to 24 px) at fold and reveal; no control | nothing | nothing |

¹ One cell's run froze smaller under c3, and the reruns show that is the freeze's own two outcomes, which c1 shows too (§8.6). ² The 6 cells at 90 % text: ▶, ⋯ and Back are 36 px tall in every candidate (the floor is priced in width, the height is `2.5rem`; §8.6).

**The trade c6 puts to the owner (not chosen):**

- *Gains*:
  - the name and `bar n / m` whole in every sideways cell, at the top;
  - the music no longer moves at the fold or the reveal, because the sheet sits below the band from the run's start;
  - Hands stays on the row in 3 cells where c1 sends it behind ⋯.
- *Losses*:
  - at rest the stave is smaller in 16 of 86 sideways cells (740 × 342 at 115 % by ≤ 3 %; 880 × 412 and 1200 × 360 by 7–10 %). Every one of those is a cell where the stage's height decides the size at rest; the smallest stave among them is about 29 px (Moonlight, 740 × 342, 115 %), the rest are above 50 px. A run's size is the same as c1's in every cell, and the next music stays in view in every cell;
  - while a refusal stands over a paused run, its line covers the foot of the music in 36 cells (c1: 13), because the music sits lower by the band whenever the bar is shown.

If the owner declines the trade, c1 is the candidate that costs the music nothing and keeps every control and status invariant; its learner loses the name while paused and keeps the 22-px jump.

**Two more product trades, put and not chosen (§8.8):** where the ordinary status line lives in c6 (the row's spare width, cut at narrow cells, or a strip above the row, whole, over the paused music's foot in 36 cells); and whether the stage refits around a refusal's line at rest (U122's planned `measureBar`, which shrinks the music while the sentence stands) or the line overlays the music's foot.

**CL07, in one line:** the chrome's height costs size only where the height decides. On the phone grid that is the wide, short screens at rest, where the stave is already far above the floor. The read-ahead cap decides the floor-bound cells, so no chrome changes them. A layout that saves height (c1 over c6) pays off only under a maximum-size objective, not under CL07's ruled order (no distortion, comfortably readable, useful next music, then the bar count). **No candidate changes the upright or the tablet screen's music** (c1 against c4: the same stage, stave and systems at rest in all 52 upright and 4 tablet cells, and the same frozen run in 55 of 56; the one exception is a freeze timed after the header's fold under c1 and before it under c4, §8.6). So U33/U78's floor and U5's tablet look-ahead stay with the window rule. U5 is reproduced at 1024 × 768 and 1366 × 1024: Bars 2, two systems of one bar, no next bar, the stave many times the floor.

### 8.1 The question and the candidates

The premise under test is *everything belongs in the bottom bar*. It descends from a valid local decision, hiding the landscape header to give its row to the music (`style.css`:946–963, P21d A6). Six arrangements were built in the real page (the real elements moved and restyled, U122's way) and measured. They cover the reviewer's three families:

| Family (correction §1) | Candidates |
| --- | --- |
| 1. Bottom-heavy, a coherent allocator | c1 (U122's model as designed); c2 (the context on a thin line above the control row, both at the bottom) |
| 2. Split context / control | c4 (the coordinator's: Back, a truncated name and `bar n / m` in a top zone in the flow; the bottom row only ▶, `Hear it`, ⋯; the zone folds with the chrome during a run, as the upright header does); c6 (the name and `bar n / m` on a line at the top in the chip's band; every control in the bottom row) |
| 3. Split with a transient state surface | c4 and c5 (a strip above the bottom row for the status line and the refusal, drawn only while it says something); c1, c3 and c6 carry the refusal on a transient line of its own, U122 §3.4 B |
| Float (the folded chip's precedent) | c3 (the name and `bar n / m` in a chip at the stage's top-right, the row holding Back, the status slot and the controls) |

c5 is c4 made compact: the top line is text only, in the chip's type and band, and Back moves to the bottom row. c6 came out of measuring c1–c5. It keeps c5's top line and puts back what c4 and c5 lose by sending setup controls to ⋯. The probe's code is `runs/U122a/scripts-probe.spec.ts`; each candidate's rules are written out there.

### 8.2 What a piece of chrome costs the music, read at the lines

The window rule sizes the music by the smallest of three terms (`scaleFor`, `WindowRenderer.ts`:3975–4120): the height the stage gives the piece's tallest system; the read-ahead cap sideways (the widest bar and the next bar's first note must fit right of the slide's leftmost target); and the width upright. Chrome changes only the first term, and only through the stage's box. Three moments decide what a piece of chrome costs:

- **At rest.** The stage stops above the bar: `.score-stage { margin-bottom: var(--score-bar-h) }` (`style.css`:2901). `measureBar` writes the bar's height (`ScoreScreen.ts`:3567–3570) on a fold and a resize (:3611, :5582). Sideways the header is not drawn (`style.css`:961–963), so the stage is the window less the keys (`--strip-height: 56px` sideways, :1067) and the bar. Upright, the header's row and its help strip sit above the stage. Anything in the flow above the stage, or in the bar, costs the at-rest stage its height.
- **A run's start.** `section.dataset.running` (`ScoreScreen.ts`:5046) turns `[data-running='true'] .score-stage { margin-bottom: 0 }` on (`style.css`:2972–2974). The stage takes the bar's whole row, and the bar overlays the foot of the music whenever it is shown. The renderer freezes the scale once the stage settles (`FREEZE_SETTLE_MS`, :404) and the piece has been measured, within a bound (`FREEZE_WAIT_FOR_MEASURE_MS`, :391–402; `setRunning` :3874–3880; `freezeAfterSettle` :3927). Sideways, the sliding sheet is priced for the chip's band from the start (`sheetShift`, :2133–2139; `FOLDED_SHEET_SHIFT_PX = 22`, :5025). So **the bar's height costs a run nothing, however tall the bar is**. Anything still in the flow above the stage at the freeze is priced into the run's size: the upright header, or c4's top zone.
- **The fold** (`CONTROL_BAR_START_HIDE_MS = 700` after the start, `ScoreScreen.ts`:192, :2609; `foldChrome` :3594–3612). The bar goes to `opacity: 0` and `inert`. Sideways the buffers move down by the chip's band (`style.css`:2421–2423), which the price already left. The size holds, and **the music moves down by the band at the fold and back up when the bar is asked back**. Upright the header goes (`style.css`:3022–3024) and the stage grows. The frozen scale is held and never grown: `scaleFor`'s hold (:4091–4100) keeps it while the fit would shrink it by less than a tenth (`FROZEN_OVERFLOW`, :257), nothing grows it, and `fitToStage` does not re-engrave on a height change while frozen (:3611–3627). **The fold gives back room, never size.**

Measured, it holds: across all 86 sideways cells, c1, c2, c3, c5 and c6 freeze at the same stave (`music.txt`), apart from two cells where one run took the freeze's second outcome (§8.6). c4's zone costs a run where the run's height decides (12 cells). Under c1–c4 the music moves 22 px (c4: up to 24) at the fold and back at every reveal, in every cell where it was observable. Under c5 and c6 it does not move, because their rule places the sheet below the band from the run's start. That mechanism is separable: c1 could adopt it, leaving the band empty until the fold.

Consequences for any layout:

- chrome in the bar is paid at rest only;
- chrome in the flow above the stage is paid at rest and in the run's size, and if it folds, it moves the music when it goes and when it comes back;
- a float over the stage is paid in notation covered, or, with a reserved band, in the band's height;
- where the read-ahead cap or the width decides the size, height costs nothing in size, only in what the window's shape does with the stage.

### 8.3 Which bar controls act during play, read at the lines

| Control | What a change does to a run | Lines | Kind |
| --- | --- | --- | --- |
| ▶ / ⏸ | starts, pauses, carries on | `togglePlay`, `ScoreScreen.ts`:3115 | during play |
| `Hear it` | during a run: sets the run aside paused, plays, and brings the run back where it was (T33 C1) | `toggleHear` / `toggleHearNow`, :2835–2870 | during play |
| ⋯ | opens the sheet | :1645–1649 | the gateway |
| the mode | `restartForOption`: a running run starts again from its beginning; a paused one starts again held paused (*Restarted at bar 1 in …*) | :1412–1420 → :2932–2947, :2950–2960 | setup |
| Hands | the same restart (*… with the left hand*); the hand already chosen restarts nothing | `chooseHand`, :1612–1623 | setup |
| the tempo | the slider's `change` and the bpm field restart the run (*… at 70 %*); the label opens the tempo sheet; the ladder moves the tempo between passes on its own and says so on the status line (*Clean — up to 70 %*), and the label is "the number you read while playing" (:4920) | :1700–1708, :2266–2273, :2742–2762, :1631–1640 | setup, and a readout during a ladder |

`setRunning`'s own comment names the restarts: "a mode change, a hand change, `Hear it` — each of those is a `setRunning(false)` immediately followed by a `setRunning(true)`" (`WindowRenderer.ts`:3895–3899). `Hear it` is the one of the three that brings the learner's run back where it was.

The coordinator's role rule follows the code. The mode, Hands and the tempo are setup choices, and only ▶, `Hear it` and ⋯ act during play. Moving the setup choices behind ⋯ (c4, c5) costs what is *read* rather than *pressed*. The selected mode (U121's whole subject) is no longer on the screen. The bpm a ladder changes is no longer on the screen; its pass sentence still says the new tempo on the status line. *Choose R or Both* and *tap R again* then name a control behind ⋯ in every cell, not only U122 §5.5's 39. That is the reason c6 keeps them on the row. Whether the selected mode should be shown read-only on the top line, so that c5's row could stay short, was not measured; it would be a new element.

### 8.4 Where a candidate costs the music, cell by cell

At rest (stave against c1; `music.txt` has every cell):

- **c2, c5, c6**: 740 × 342 at 115 % (all four face/piece cells: c5/c6 by 0.5–3 %, c2 by 2–5 %); 880 × 412 with When the Saints (c5/c6 7–8 %, c2 7–9 %); 1200 × 360 (all eight: c5/c6 8–10 %, c2 8–11 %). Nowhere else, out of 86.
- **c4**: 46 cells: 568, 700, 720 and 844 px wide at 115 % text; 740 × 342 and 780 × 360 at 100 % and 115 % (740 × 342 at 90 % too); all 16 cells at 880 × 412 and 1200 × 360. Up to a fifth (1200 × 360 at 115 %).
- **c3**: none.

In a run: c4 alone, at the 12 wide cells where the run's height decides (880 × 412 and 1200 × 360), by 12–17 %.

Systems in view sideways are one in every candidate and cell (the sliding sheet). The next music is in view in every cell under every candidate, at rest and in a run (`next lost 0` in `summary.txt`). Where a shorter stage turns the at-rest fit from the read-ahead cap to the height, the window holds both bars asked at the same or a slightly smaller stave (c2 11 cells, c5/c6 10, c4 23).

Under a refusal at rest, the stage refits around the refusal's line (U122's planned `measureBar`, emulated by the probe's resize). c6's stave then stays at or above the floor in every cell; the closest is Moonlight at 568 × 320, 115 %, at about 22.3 px (c1's closest about 22.9). c4's falls under the floor in 6–7 cells, down to about 18.7 px.

### 8.5 CL07's reading objective beside the chrome

The measured cells the reviewer named:

- **Floor (U33/U78), upright phone.** Moonlight at 280 × 740 is the upright cell nearest the floor (about 22.2 px, three systems). Upright, c1 and c4 give the same stage, stave and systems in all 52 upright cells: the upright chrome is the header and a one-row bar in both; c4 changes only which controls sit on the row. c2, c3, c5 and c6 are landscape-phone arrangements and do not apply upright. So no candidate changes what any floor value would give upright. Inferred from the identical stage boxes, since the window rule is a function of the stage and the piece; floor values themselves were not varied (no app change).
- **Tablet look-ahead (U5).** At 1024 × 768 (the gallery's tablet-sideways cell, not a tablet to the app, `isTablet` wants 900 px on the shorter side, `ui/tablet.ts`:24–29) and 1366 × 1024 (a tablet to the app), Bars 2: two systems of one bar each, no third bar inked, the stave 146–225 px for Hot Cross Buns and 48–63 px for Moonlight. Identical under c1 and c4. The landscape-phone rule (`max-height: 500px`) never reaches these screens, so no candidate here changes U5.
- **Sideways phone.** Under c1, the read-ahead cap decides the size in 68 of 86 cells at rest and 74 in a run; the height decides in the other 18 at rest (the 12 at 880 × 412 and 1200 × 360 with Hot Cross Buns or When the Saints, and Moonlight at 740 × 342 at both text sizes and at 780 × 360 at 115 %) and in those 12 wide cells in a run. Every cell where c6 costs the stave at rest is height-decided, and its stave stays at least 29 px (most above 50). The floor-bound sideways cells (Moonlight at 568 × 320, about 23 px) are decided by the width. There a chrome's height changes nothing, and a higher floor would bind on the width, not the chrome.

**Where a layout would only pay off if the objective changed.** c1's height advantage over c6 buys stave size only on cells already far above any floor under discussion (five-line staves of 25 to 36 px were called readable in the T35 sheet, `WindowRenderer.ts`:106–108). Under the ruled order, size beyond comfortable readability ranks below useful next music, and no candidate changes the next music. So c1's advantage pays off only under a maximum-size objective. Conversely, if CL07 made look-ahead rows take height on the sideways phone (one system today), the at-rest stage would become height-bound in more cells, and every line of chrome would cost more. That interaction is the reason to keep the at-rest chrome to one line.

### 8.6 Findings outside the decision (recorded, not fixed)

- **The freeze has two outcomes for Moonlight on this machine, whatever the chrome** (provenance: pre-existing at `f9322175`; c1, which has today's heights, shows it). The second outcome is about a sixth smaller. At the three cells where one candidate's clean run showed it, the chain's run and three reruns per candidate gave it in 5 of 72 runs, under c1, c3 and c4. At the five runs where the first pass's single page (refusals at rest, then the run) showed it, three reruns of that flow gave it in 3 of 15. On that flow at 568 × 320 it is 19.1 px, under the 22-px floor (`spread.txt`). Both samples were chosen because the outcome had appeared, so neither rate is general. The mechanism is not established; the freeze's race with the piece's measurement (`08` §13a) is the first hypothesis. It attaches to CL07 (U35: a run priced from the cursor's window) as an observation.
- **The tap minimum's height is in rem.** At 90 % text, ▶, ⋯ and Back are 36 px tall in every candidate: U122's model prices the 40-px floor in width (S13 → `max(2.5rem, 40px)`), while the height stays S12's `min-height: 2.5rem`. This attaches to U122's cluster; the build's S12 wants the same `max(…, 40px)`.
- **When the freeze comes relative to the fold can change a run's arrangement.** At 1024 × 768 with Moonlight (not a tablet to the app, so the header folds), c1's run froze after the header had folded, at two systems, and c4's before it, at one system and a slightly larger stave. Same class as the first finding: the freeze waits for the piece's measurement, and the stage it prices depends on whether the chrome has folded by then.
- **A shorter at-rest stage changes the window's shape before a run** (two bars at a height-bound size where the read-ahead cap showed one and the next bar's start). Not a fault; it is why the bars-shown counts move with the chrome at rest.

### 8.7 The allocation within each surface (c6), and what becomes of U122's rules

| Surface | Holds | Allocation |
| --- | --- | --- |
| Top line (sideways only) | the name (left, yielding to an ellipsis), `bar n / m` (right, never yields) | one line in the chip's type; at rest in the flow above the stage; from a run's start absolutely over the stage's top band, the sheet below the band (`[data-running]` rather than `[data-chrome='folded']`), the band `max(22px, the line's height)`; hidden while folded, the chip in its place. Measured 18–22 px tall at 90–115 % text, inside the 22-px band; at larger text the band grows to the line and a run pays the difference |
| Bottom row | Back, the status slot (Back and the status line in the left group), ▶, `Hear it`, the mode, Hands, the tempo, ⋯ | U122's chooser (§3.3) with Back the only fixed text item: the status line's band, then the mode's sentence and the tempo's percentage, then Hands, then `Hear it` |
| Refusal line | the refusal's sentence, the same element | U122 §3.4 B: the bar's first line while `data-sound-refused` stands |

What becomes of U122's inventory (§1, §4) under c6:

- **Disappear, because the information moved:**
  - L4 (the name's yield inside the group);
  - L8 (the name's shrink weight against the status line, and its refusal exception);
  - J5 (`leftGroupIsCut`, the widest location in the group);
  - U122's priced *widest location* fixed item;
  - S6's dead `34vw`.
- **Remain, because they express a real invariant:**
  - S1 (the wrap as the fence) and the one control row it guards;
  - L3's clip (the last fence);
  - L6 (Back never wraps);
  - L7 and S7 (the status line's ellipsis and band);
  - J3's order;
  - J8;
  - the own-line refusal (R2 → §3.4 B);
  - the chip (J13), now the top line's folded form.
- **Still needed: U122's width allocator**, smaller (one fixed text item instead of two), and S13's tap floor extended to S12's height.
- **New:** the top line's rule, and the sideways sheet placed below the band from the run's start instead of at the fold.
- **Upright and tablet:** unchanged.

### 8.8 Product trades and stops, put and not chosen

1. **The decomposition (c6 against c1).** As in §8.0. If declined, c1.
2. **Where c6's ordinary status line lives.** In the row's spare width (as measured for c6): cut in every cell, about 30 characters on average, *Pause…* at U121's cell. Or on a strip above the row while it says something (measured as c5, whose strip is the same geometry over the same sheet position): whole in every cell, but while paused it covers the foot of the music in 36 of 86 cells, where the row-slot placement covers it in 10. What a learner gains is the whole *Paused — ▶ to carry on, or Start again in ⋯ …*; what they lose is the bottom of the bass staff while paused.
3. **The refusal at rest: refit or overlay.** U122's build plan re-measures the bar when the refusal's line comes and goes (its J11 addition). Measured here, that refit shrinks the music at rest while the sentence stands: c6 keeps the floor in every cell; c4 does not in 6–7. The alternative is that the line overlays the foot of the music, as it does during a run. Gain from the refit: no note under the sentence at rest. Loss: the music changes size when a refusal comes and goes.
4. **U122 §5.5 (I7) is unchanged by c6.** Hands is on the row in every sideways cell measured, so sideways *tap R again* names a drawn control. Upright, `Hear it` is behind ⋯ at 280 and 320 px in 8 cells under c1 (`refusal.txt`), as U122 found.

### 8.9 Method and limits

`runs/U122a/scripts-probe.spec.ts` installs each candidate in the real page: the real elements are moved and restyled, and a hidden element with the ⋯ sheet's id stops the app's own allocation loop so that the candidate's alone decides the row. The probe allocates the row by U122's chooser where the candidate has one. It measures the stage, the five lines on the glass (`stavePx`), the inked bars, the fit's term, the frozen scale, every text, every control (hit at five points) and the chrome's boxes against the notes, the SVG text and the ink on the stage. Two flows per cell, each on a fresh page: *run* (at rest, the freeze, after the fold, paused, ▶ refused over the paused run) and *refusal* (▶ then `Hear it` refused at rest, then a render while it stands: the tempo sheet, a resize).

The flows were separated after the first pass suggested that a run's size can depend on what the page drew before it (§8.6); that pass is kept as `history/`. The grids are U122's (U119a's 64 sideways cells, 48 upright, 880 × 412 and 1200 × 360, 90 % text) plus the two tablet cells. The final data is 628 cell-and-candidate pairs, each through both flows: 1,256 tests and 5,652 measured states. In all, 1,575 tests ran, the reruns and the history checks included, and none failed (`run-*.txt`, `rerun-*.txt`). Every at-rest state's stage reserve matches the bar's drawn height (`stale.txt`: 0 of 3,768 disagree). The first pass had 64 that did not, because the row was measured before it was allocated; the probe was fixed and those cells rerun. A first version of c4 let Back wrap in its zone; it was fixed and c4 rerun.

Not measured: a device; any face but these two; text above 115 %; the pieces beyond Hot Cross Buns, Moonlight III and When the Saints; a Hands refusal; floor values other than the code's 22 px.

## 9. Each Score moment shows what it needs: c6 applied state by state (U122b)

A probe, no app code changed (brief `docs/prompts/tasks/U122b-each-score-moment-shows-what-it-needs.md`; the reviewer's `responses/911f8c82.md` and `911f8c82-correction-1.md` govern). Worktree base `d159f407`; nothing under `app/src` differs from U122a's base `f9322175`. Evidence: `docs/prompts/runs/U122b/` (Entry 214). **Every pixel count below was measured in this machine's Chromium**; the claims are the relationships (covers or clears, fits or overflows, moved or held). Unverified on a device. Nothing was heard, and no musical judgement is made; where a place on the glass changes what a learner can do, that is said.

### 9.0 Judgement

**c6 applied per state passes the brief's four checks in every listed cell and state measured** (24 cells, below; the finished state on the 12 whose piece can finish), once the per-state rules include three things c6 as U122a built it does not have:

1. **The fold keys on playing, not on a run existing, and leaves ⏸ behind.** During the count-in, while the run holds for the first note, and while playing, the row folds to ⏸ alone, in ▶'s own place. Paused and refused, the row stays open.
2. **The count-in leaves the stage.** No wash and no numerals over the notes. It is drawn where the name was, in the top line.
3. **The row's background ends at its controls** (no vertical padding).

Two smaller rules come with them. The top line is as tall at rest as the band a run keeps for it, so ▶ moves nothing. The finished sheet shows its actions under its heading, and the folded chip is not drawn over it.

**The hypothesis, part by part:**

- **The refusal fits the top band with the title yielding; no refit.** *Holds.* Three refusals were produced: ▶ and `Hear it` at rest, and ▶ over a paused run. In 24 of 24 cells each was drawn whole on one line, in the top line's 22-px height, with `bar n / m` kept beside it; the music did not move. Every other refusal sentence the Score glass can carry, priced at the same weight, fits beside `bar n / m` with room to spare at the tightest cell (568 × 320, 115 %, wider face). The exception is the refused start (*Nothing for the right hand in this piece — choose L or Both*, R19 below), which is not a sound refusal. At 568 × 320, 115 %, wider face (2 cells) it is wider than the room beside `bar n / m`. It fits the line once `bar n / m` yields too, which the table allows (*position if it still fits*). **No refit is needed, so no fallback is reported.** The 22-px floor never comes into play. For the record, U122a's c6 refit at the closest cell was about 22.3 px (§8.4).
- **A playing state has a direct pause under c6's fold.** *Refuted for c6 as the app folds it, in 24 of 24 cells.* The row folds 0.7 s after ▶ (`CONTROL_BAR_START_HIDE_MS`, `ScoreScreen.ts`:192, :2609), and nothing on the glass pauses. The same holds during the count-in and while the run holds for the first note. With ⏸ kept alone in its own place: 24 of 24 pass, and ⏸ covers no ink in any cell, in any of those three states.
- **No chrome over the notation the state needs.** *Refuted in two places, both fixed by the rules above:*
  - **The app's count-in, in 24 of 24 cells.** Its wash dims the stage. In Moonlight its numerals sit on 11–14 note heads. In Hot Cross Buns they sit on fingering digits and stave lines. That is walk finding 8, reproduced. With the count in the top line: 24 of 24 clear.
  - **c6's own row, at 780 × 360 with Moonlight.** Its padding lies over the bass staff's lowest beams: at rest in all 6 of those cells (3–5 px deep), and while paused at 115 % in 2 (about 8 px deep). The controls themselves do not reach the ink (one touches by under a pixel). Drawn with no vertical padding, the row clears the ink in every cell. The stave is the same in every cell, and the same bars are inked. The music sits identically on the glass and the row sits lower on the keys (the pictures `row-padded-*` against `row-flush-*`).

**Walk finding 5 is reproduced, and it has a twin.** Three seconds after ⏸ the row folds (24 of 24 cells), because the fold timer asks `session.running`, which a paused run keeps (`showBar`, `ScoreScreen.ts`:3613–3619). The name, ▶, the mode, Hands, the tempo and ⋯ are gone, and the chip says *Paused — ▶ to carry on, …* with no ▶ on the glass. The twin: ▶ refused over a paused run leaves *Sound did not start — tap ▶ again* in the chip three seconds later, naming a ▶ that is not drawn (24 of 24). This was observed under the probe's c6. The fold that causes it is the app's own code, so today's layout is inferred to do the same.

### 9.1 The table mapped to the Score's states

The rows are the T31 state machine's (`docs/decisions/2026-09-23-score-state-machine.md` §1) plus the sound refusal (G86a, U105).

| App state | How the code knows | Table row that governs | Probed |
| --- | --- | --- | --- |
| R1 idle at bar 1 | no run (`!session.running`) | At rest | yes |
| R2 idle with a run left half way (the offer to carry on) | `#score-resume` | At rest; the offer's *Carry on* is that moment's next action | no |
| R3 counting in | `#score-countin` drawn (`onBeat`, `tick.isCountIn`) | Count-in | yes |
| R4 armed: holding for the first note | `state.armed` | **No row names it.** Count-in governs: the learner's task is still the entrance, and the cue (*Play your first note to start*) is its action | yes |
| R5–R11 running: Wait, Keep tempo, rhythm only, Listen, Free, Perform, Blind | `data-running='true'`, not paused | Playing | Keep tempo (R6) only |
| R12 paused by ⏸ | `state.paused` | Paused | yes |
| R12 with a note: restarted by an option (C2), back from under a demonstration (C1) | `pauseNote` | Paused; the note says why the run moved, more than *Paused* (Questions) | priced only |
| R13 loop, R14 ladder step | the loop range; the ladder's verdict on the status line | Playing; the verdict is a run line, carried in the chip as today | no |
| R15 hearing (`Hear it`) | `hearing` | Playing, with **Stop** (`Hear it`'s label while it plays) as the one direct control, not ⏸: T31 principle 5, *the button that stops a thing is the one that started it* | no |
| R16 one-bar preview | `hearingBar` | Playing | no |
| R17 page hidden, then R12 with the time away | `awaySeconds` | Paused; the away note carries more than *Paused* (Questions) | priced only |
| R18 summary | `#score-summary` shown | Finished | yes (Hot Cross Buns) |
| R19 refused start: a hand the piece has nothing for | the sentence on `#score-status`, no run (`ScoreScreen.ts`:2575) | Refusal; it names R, L or Both | priced only |
| Sound refusal (G86a, U105) | `data-sound-refused`, `refusedNow()` | Refusal | yes: ▶ and `Hear it` at rest, ▶ over a paused run |
| ▶ waiting for the sound (U69); a transfer offer unread (D4a) | `data-starting-sound`; `offerPending()` | At rest (▶ busy or held; no sentence) | no |
| R20 the sideways twin | `data-chrome` | not a state: the orientation every row here is about | — |

What each moment draws under c6 applied per state (the probe's emulation, `installStates` in `scripts-states.spec.ts`; the build's acceptance description, not a new state model):

| Moment | Top line | Bottom row | Stage |
| --- | --- | --- | --- |
| At rest | the name, `bar n / m` | Back, ▶, `Hear it`, the mode, Hands, the tempo, ⋯ (U122's chooser); flush to its controls | the music |
| Count-in | the count (1 2 3 4, the beat marked) in the name's place; `bar n / m` | ⏸ alone, in ▶'s place | the music, nothing over it |
| Holding for the first note | the cue in the name's place; `bar n / m` | ⏸ alone | the music |
| Playing | folded: the chip's `bar n / m` (and a run line, as today) | ⏸ alone | the music |
| Paused | the name, `bar n / m` | the whole row, not folded; the generic paused sentence not drawn | the music |
| Refusal | the sentence in the name's place (bold, the accent colour); `bar n / m` if it fits | the whole row; the named control on it | unchanged, no refit |
| Finished | not drawn; the chip not drawn | under the summary | the summary: heading, actions, then the figures |

### 9.2 The cells, and per state the result

Cells: 568 × 320 and 780 × 360, each at 90 %, 100 % and 115 % text, on both faces (the app's stack and Verdana forced), with Hot Cross Buns and Moonlight III: 24 cells. They cover the brief's list:

- U120's 568 × 320 refusal at 115 %, on both faces;
- U121's paused case (568 × 320, 115 %, wider face);
- the owner's 780 × 360;
- the narrow and wide faces throughout;
- U124's 90 % text, at both sizes.

The walk on one page per cell: rest, ▶ refused at rest, `Hear it` refused at rest, the refusal cleared (the sound starts by itself), Keep tempo, ▶, the count-in, holding for the first note, playing (the probe strikes the expected keys on the strip, in time), ⏸, three seconds, ▶ refused over the paused run, three seconds, the refusal cleared, ▶, played to the end, the summary. Moonlight runs to the second refusal cleared: its 201 bars do not finish in a probe's time. The summary sheet covers the stage, so the piece's notation does not enter the finished checks.

Each state is measured twice. **A** is the app's own state machine with c6's elements moved, as U122a installed them. **B** is c6 applied per state. Final run `ff` (rules 1–3, the band rule, U124's floor); the base run `f` is the same without rule 3. Counts are cells passing; check 3 counts cells where the music's top edge and stave did not change since the previous state; check 4 counts cells with no drawn box over the stage's ink deeper than a 2-px touch.

| State | B: 1 shown and reachable | B: 2 hidden | B: 3 music held | B: 4 no cover | A (the app's machine under c6) |
| --- | --- | --- | --- | --- | --- |
| At rest | 24 | 24 | 24 | 24 (18 with the padded row) | — |
| ▶ refused at rest | 24 | 24 | 24 | 24 (18) | — |
| `Hear it` refused at rest | **16**: at 90 % text `Hear it` is 36 px tall, under the floor, in 8 cells | 24 | 24 | 24 (18) | — |
| Refusal cleared at rest | 24 | 24 | 24 | 24 (18) | — |
| Count-in | 24 | 24 | 24 | 24 | 0 / 0 / 24 / 0: no direct pause (the row folds 0.7 s in), the wash and numerals over the stage |
| Holding for the first note | 24 | 24 | 24 | 24 | 0 on check 1: no direct pause (the cue is whole, in the chip) |
| Playing | 24 | 24 | 24 | 24 | 0 on check 1: no direct pause |
| Paused (three seconds after ⏸) | 24 | 24 | 24 | 24 (22 with the padded row) | 0 / 0: the row folded; the name, ▶ and setup gone; the paused sentence in the chip, over 8 fingering digits in 1 cell |
| ▶ refused over the paused run | 24 | 24 | 24 | 24 (22) | 0 on check 1: the sentence in the chip names a ▶ not drawn |
| Refusal cleared, paused | 24 | 24 | 24 | 24 (22) | as paused |
| Finished | 12 of 12 | 12 | 12 | 12 | 3 of 12 with an action whole in view (4 below the sheet's visible part, 5 partly in it); the chip `bar 4 / 4` drawn over the summary in 12 |

Every cell and state is in `states-ff.txt` (and `states-f.txt` for the padded row); the counts are in `summary.txt` and `summary-f.txt`.

**The music through the walk (check 3).** Under B, nothing moved and nothing shrank from rest to finished in any of the 24 cells. The stave on the glass is the same in every state of a cell. Hot Cross Buns measures about 81 px at 568 × 320 and about 112 px at 780 × 360. Moonlight measures about 22.9 px and about 31.6 px, every one above the 22-px floor (`music.txt`). Two things would have moved it:

- **Without the band rule** (run `g`), the music's top edge moved down 2.7 px (100 and 115 %) or 4.2 px (90 %) when ▶ started a run, in 20 of 24 cells, at the same size. At rest c6's top line is 18–22 px, while a run keeps a band of at least 22 px. A top line as tall as the band at rest stops it, and it cost no stave in any cell (`compare-g2-f.txt` against run `g`).
- **Moonlight's freeze** took its smaller outcome once at 780 × 360, 115 %, stack face (run `g`: about 26.4 px against about 31.6 px in runs `g2`, `f` and `ff`). U122a's unchanged probe, rerun on that cell, showed the same under c6. The cause is the freeze's own two outcomes (§8.6, U35), not the chrome. It is the same run under A and B.

**Repeatability.** Runs `g2` and `f` (the same probe and settings, apart from the count's second form) gave identical results in every state measured in both, except one A-side fold caught mid-fade (`compare-g2-f.txt`). Runs `f` and `ff` differ in 42 states: 38 on check 4, which is what rule 3 changes, and 4 A-side folds caught mid-fade (`compare-f-ff.txt`).

**Rule 3's side effect, and what U122a's table did not show.** Without padding the row is shorter, so the at-rest stage is taller by the padding. In 22 of 24 cells the window is unchanged. In the other 2 (568 × 320, 115 %, Moonlight, both faces) the fit's term changes from the height to the read-ahead. The stave is the same, the same three bars are inked, and the picture is the same music (`window-f-ff.txt`). U122a's `chrome.txt` has no at-rest entry for 780 × 360 Moonlight under c6 because its analysis kept only chrome whose box overlaps the stage's box (`overStage`): at rest the row sits below the stage, and the ink that runs past the stage's foot was filtered out. Its unchanged probe, rerun here, measures the row over 3 ink paths at rest under c6 and none under c1 (`check-u122a.txt`). The row overlapping the paused music's foot is not c6's: under c1 the shown bar covers the same beams mid-run (§8.0, *the bar over the foot mid-run*).

**Where a lone ⏸ can stand** (`pause.txt`, boxes priced against the ink in the count-in, while holding, and while playing):

- **No ink in any cell:** at ▶'s own place, at the row's left end, at its right end, or the whole row flush on the keys.
- **Straddling the top band:** 40 px tall in a 22-px band, it covers ink in 2–12 of 24 cells, up to about 19 px deep. So the top line cannot hold ⏸ at the tap floor, and the row is where it goes.

### 9.3 The count-in: two forms, a trade

Both forms keep the stage clear.

- **In the top line, the chip's type** (B): passes in 24 of 24 cells.
- **The app's own numerals at their own size, moved off the stage into the row's room left of ⏸, without the wash** (`count2`):
  - all 12 cells at 780 × 360 pass: big and clear of the music (`780x360-t100-stack-moon-B-count2.png`);
  - at 568 × 320 at 100 and 115 % text, the numerals at the app's spacing (`gap: clamp(12px, 6vw, 48px)`) run past the window's left edge in 6 of 12 cells.

The app drew the count so that the first note is not unannounced on a phone on a stand with the sound low (P21c A6, `ScoreScreen.ts`:857–862). The large numerals serve that reason better than the top line's small type; fitting them at 568 × 320 needs tighter spacing, which was not measured. Questions, 1.

### 9.4 The tap floor

U124's floor (`max(2.5rem, 40px)` in both dimensions) was installed for Back, ▶ and ⋯, and they are at least 40 × 40 and hit at five points in every cell and state where they are drawn (`sizes.txt`).

Two controls a sentence can name fall outside it:

- **`Hear it`**, named by its refusal, is 36 px tall at 90 % text (8 cells): the only failure of check 1 under B.
- **Hands' R and L** are 16–24 px wide at every text size. R19 and a Hands refusal name them (*tap R again*).

The floor wants to cover every control a sentence can name, not only the three U124 lists (Follow-ups).

### 9.5 The finished state

The app's summary sheet (`max-height: 72 %`) puts the figures between *Run finished* and its actions.

- At 568 × 320 no action is whole in view in any of the 6 cells: below the sheet's visible part in 3, partly in it in 3.
- At 780 × 360 the actions are whole in view in 3 of 6 cells.
- The folded chip (`bar 4 / 4`) stays drawn over the summary in every cell: stale in-run chrome.

Under B, with the actions directly under the heading and the chip not drawn, *Run finished* and *Again*, *Slower*, *Faster*, *What next with this piece?* and *Done* are whole in view and hit in 12 of 12 (`finished.txt`). Walk finding 9 (a second sheet opened scrolled past its verdict) is the same sheet's other face. It was not reproduced here: the probe's sheet opened at its top every time.

### 9.6 Proposed learner-facing wording (for the build; not changed here)

| Where | Before | After | Why |
| --- | --- | --- | --- |
| Score, sideways, paused by ⏸ (`STATE_TEXT.paused`, `help.ts`:450; `pausedPerforming`, :452) | drawn in the row's spare width, cut to a prefix at narrow cells (`texts.txt`, U122a), or whole in the chip once folded | **not drawn on the sideways glass while ▶ is on the row**; kept as the screen reader's status. The words themselves are unchanged | the correction: the state and a direct ▶ already say it. *Start again* is one tap away in ⋯ (secondary setup), and the cut prefix said less than ▶ does |
| Score, sideways, paused because the page went away (`STATE_TEXT.away`, `help.ts`:454–457), if the reviewer rules it takes the name's place (Questions, 2) | *Paused — you were away 5 s. ▶ to carry on, or Start again in ⋯ to go back to the beginning.* | *Paused — you were away 5 s. ▶ to carry on* | the whole sentence fits beside `bar n / m` at 568 × 320 only at 90 % on the app's face; the shorter one fits in every 568 × 320 cell for any count of seconds a phone will show (the 14-digit ceiling the chip prices runs a few px over in one cell). It keeps what the learner did not cause (why the run paused) and drops the pointer to secondary setup |

No other wording changes. The refusal sentences, the first-note cue and the count's numerals keep their words. The refusal is restyled bold in the accent colour where the name was, so that a warning in the name's place does not read as the name. The cue moves from the chip into the top line.

### 9.7 Method and limits

`runs/U122b/scripts-states.spec.ts` is U122a's probe extended, not rebuilt. U122a's `install('c6')` is unchanged. Its `glass()` gained the count-in, ⏸, the top line's message, the summary and each row control as pieces of chrome, depth per overlap, stave lines told from other ink, and priced boxes. `installStates` adds one stylesheet keyed on `data-u122b` and a message element in the top line. The two runs that are the result, `f` and `ff`, ran on 2 workers. Earlier runs (`g`, `g2`) were the probe's own development; `g3` was interrupted by a machine crash before its log ended and is not used.

Not measured:

- a device;
- upright and tablet (c6 is a landscape-phone arrangement);
- text above 115 %;
- R2, R5 (Wait), R13–R17 and R19 as walked states: R17's, C1/C2's and R19's sentences are priced only;
- Moonlight's finished state;
- the numeral count at a tighter spacing;
- a background-only alternative to rule 3 (paint no background in the row's padding, keep its height).
