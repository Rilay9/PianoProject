# Reviewer handoff — HD2 held at its corpus diff: one ruling on a single line that crosses staves without a local gesture

**Scoreboard: 0 / 28 MUST abilities shipped.**

Implementation HEAD: the commit that carries this handoff (HD2's edits are held in its worktree; its corpus diff, classifier and probe are at `docs/prompts/runs/HD2/` in that commit). Respond in `responses/hd2-corpus-diff.md`. Response required; both HD2 and CD1 are blocked on it.

## What HD2 built, held

Your §1 ruling as implemented (`crossedStaves` in `extractScoreModel.ts`; `voiceHomeStaves` removed; `crossStaff` redocumented): the printed staff gives the hand; a note crosses only on evidence inside its printed bar and its own voice (keyed by OSMD's voice object): (a) a chord, or a beam that is one consecutive stretch of the bar's line, spanning both staves keeps the hand of the voice's other notes in that bar when those sit on one staff (a majority fallback was tried and removed as a guess); (b) an excursion: the line starts and ends the bar on one staff and visits the other in between; no excursion is read where one voice id sounds on both staves at once; HD1 unchanged. OSMD exposes a cross-staff chord as one voice entry with a staff per note and gives every beam note its staff; it also hands back runaway beams (Fig Leaf Rag bar 5, twenty notes across bars), hence a beam guard.

Your acceptance set is green (7 of 7 in `printedStaffHand.test.ts`; five cases red on the old rule first: the reused voice, the local excursion, a shared voice id, The Crave bar 40, Solace 22/26/30/32; the cross-staff fixture and the beam and chord groups green on both). `oneStaffHand` green; all 45 existing fixture goldens content-identical. `tsc`, eslint, the full unit suite with only the three known environmental reds.

## The stop: the corpus diff

2014 files, 891,803 notes, 0 failures to compare; 30,662 notes changed in 325 files, every one inside the mechanical boundary (classes A 28,101, B 500, C 1,976, D 85; E and OUTSIDE 0). But inside class A and C two populations are mixed: reused voice ids, where the new rule is right (The Crave, Solace, the NIFC Chopin files, Prelude 17, Étude Op. 25 No. 4), and **consistent single lines that cross staves with no establishable gesture, where it is wrong as music**: *Moonlight* I prints its right-hand triplets (voice 2) on staff 2 for whole bars (13, 14, 21, 22), and in bars 5, 8 and 12 the triplet beams cross the staves with no other voice-2 note in the bar; *Moonlight* III bars 1-8 print each arpeggio as one voice-1 line rising from staff 2 to staff 1; *Clair de Lune* bars 27 on, left-hand arpeggios printed across the staves with no context. The old rule read all of these as the hand standard editions give, through the voice's history, which your ruling forbids; the new rule splits them at the staff line or gives them to the wrong hand. Class D holds doubtful anchors too (*Moonlight* I bar 5 all L; *The Entertainer* (alt) bar 3; K545 (alt) bars 18-21). Nothing here is verified as music; the diff is at `docs/prompts/runs/HD2/corpus-diff.txt` with the classifier beside it.

## The ruling asked

Where a single voice line crosses staves with no establishable local gesture (whole bars on the other staff, or a move inside the bar without return), which stands:
- (i) the printed staff, accepting the *Moonlight* and *Clair de Lune* splits;
- (ii) a bounded neighbour-bar continuity window (a line that crossed within a bar and continues on the other staff in the next bars keeps its hand while continuous), which is history again, only shorter, and which still reads The Crave bar 40 right only if the window requires a crossing anchor;
- (iii) explicit per-item authored hand data for the scores that need it, as HD1 did for one-staff items: a declared hand range (item, bars, voice or staff, hand) in the catalogue's provenance, the corpus diff's class A and C lists as the worklist, no inference from history anywhere;
- (iv) something else.

The orchestrator leans to (i) plus (iii): the printed staff as the default with no history inference, and explicit authored ranges for the consistent-line scores the diff names, because that is the same explicit-truth shape your 3a9684d5 ruling chose over an inferred one, and because (ii) cannot be told from the reused-voice case by notation alone. The cost is authoring data for the affected scores and a store for it; the gain is that no learner's hand focus rests on a guess. Your call.

## Consequences

CD1 is waiting on HD2 to rerun its differential and calibration; the latin.4 placement waits on both. If (i) alone is chosen, HD2 lands with the diff recorded and the Moonlight and Clair de Lune splits named as known wrong readings until authored data exists; if (iii) joins it, HD2 lands first and the authored ranges follow as their own bounded lane. Nothing heard.
