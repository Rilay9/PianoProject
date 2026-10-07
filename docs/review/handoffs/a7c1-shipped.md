# Reviewer handoff — A7c.1 is `reviewed`; the acceptance path is in the record; one app gap stands between it and `shipped`

**Scoreboard: 0 / 28 MUST abilities shipped. PACKET-TRACE: PARTIAL 96, MISSING 5.**

Implementation HEAD: `3b4f74bc` (Entries 260 and 261 in `docs/pending-review.md`). Respond in `responses/a7c1-shipped.md`. Response required for §3 only; §1 and §2 are the artefact review of your two required changes, applied. Nothing heard.

## 1. Your required change on `a7c1-reviewed`, applied (Entry 260)

`content/lessons/latin.6.md`: *Por Una Cabeza*'s paragraph now says bars 1 to 14 are the same four events, bar 15 breaks the pattern with two chords and it returns after that, and where it holds and gives way is the learner's to find (the step-20 task above it asks exactly that); the sentences "does not change", "bar after bar is the same" and "never asks you for anything new and it never lets up" are gone. *The Crave*'s paragraph now says bars 21 to 26 play three, three, two in every bar, those six bars are the passage the rung vouches for, and how much of the rest keeps the figure is the learner's to read; "the tresillo under a whole piece" and "most of its fifty-three bars" are gone. The Crave fact row's free-text evidence pointer, which quoted the removed sentence, quotes the narrowed one; no proof field changed. The record's `status` is `reviewed`, as your ruling allowed once those statements were corrected; the checker reads `A7c.1 (reviewed); 0 failure(s), 0 unresolved ref(s)`.

## 2. The acceptance path, landed (Entry 261, lane A7S)

`docs/chains/A7c.1.yaml` names `acceptance_test: app/tests/unit/latin4Completion.test.ts` (the field R8 reads; a probe on a `shipped` copy passes with it and fails without it). The file: latin.4 is met by one Keep tempo run of the 2/4 tresillo control plus one whole Keep tempo run of the Bizet left-hand cut, both at the pass pair and opened from latin.4, and by nothing else; 76 self-check cases (a Hear it, a Rhythm only run and a Wait for me run on every latin.4 option, the looped steps, the uncounted Keep tempo drills, and Hear it, Rhythm only, Wait for me and Keep tempo on *Por Una Cabeza*, *The Crave*, *La Cumparsita B* and *El Choclo* opened from latin.6 or latin.7) award no skill evidence, move no skill, store nothing naming a cell beyond the item's own identity, and write no evidence-job line; latin.6 and latin.7 count no Rhythm only or Wait for me row. Two mutants red (a Rhythm only row counted as measured: 3 cases; every declared skill activated: 2 cases), both restored byte for byte. Your §3 conditions one to three hold on this path.

## 3. The fourth condition, and the gap it found (response required)

The per-step table (`docs/prompts/runs/A7S/steps.md`) reaches 21 of the record's 24 steps by a control on the deployed app. Steps 18, 20 and 23 (the parent's bars 1-12 under the tune; *The Crave* 21-22 tapped; *Por Una Cabeza* 1-14 tapped) need a loop of named bars. The one control that sets a loop of chosen bars is the double-tap, and it marks the window's first bar wherever the learner taps: `ScoreScreen.ts` `measureAt` finds no `data-measure` in the page and falls back to the window's first measure; its own comment records that double-tap-to-loop "has been quietly doing nothing at all". latin.4, latin.6 and latin.7 all say "double-tap the first bar, then the last". So the gap is an existing control, needed by this chain's steps and by every lesson that names a loop: app work under FABLE §10, lane LB1 (`briefs/loop-by-tapped-bar.md`, building: the tapped bar resolves to its printed number; red first on *The Crave* 21-22, the Bizet cut 7-9 and *Por Una Cabeza* 1-14; the long-press to hear a bar retested on the same mechanism; the window rule untouched).

**Asked:** confirm that `shipped` waits on LB1 and on the owner's phone-build confirmation of the twenty-step path (the table says where to tap), and nothing else; or name what else. The owner is asked, separately, to walk the steps on the phone once LB1 deploys.

## 4. Also landed and open

Entry 258's follow-up (lane SR3, your required change on `sr2-landing`: a held run credits none of its judging rung's requirements, immediately or retroactively, its skill evidence kept; the card shows the held level) is building under your ruling; its landing comes to you as an artefact review.
