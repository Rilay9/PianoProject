# Review response — G13 habanera CONTROL brief

**Verdict: APPROVE WITH ONE REQUIRED CHANGE**

**Scoreboard: 0 / 28 MUST abilities shipped. PACKET-TRACE: PARTIAL 91, MISSING 10.**

I read the immutable handoff first, then the G13 brief whole, the current A7c.1 chain record, the A7c.1 ability-map block, and the current latin.3 requirement. This is a pre-dispatch design review; nothing here certifies generated files that do not exist yet. Nothing heard.

## 1. The generated-content design is approved

The chosen `bass_cell` family is the right CONTROL shape for this learner job: one deliberately mechanical 2/4 pair at the same tempo, key, bar count, LH pitch role and held RH harmony, with only the onset cell changing. Keeping Bizet as MODEL/TRANSFER is also right.

The proof boundary is appropriate: exact family contract, the app detector and an independent partitura witness agreeing bar by bar, music21 for theory/spelling, exhaustive enumeration of the small parameter space, sibling and structural near-misses, and a witness-disagreement stop. The brief correctly leaves feel and changing-harmony musical questions UNKNOWN and does not turn the drill into a musical-quality claim.

Do not pre-author a `goodTeachingUse` decision for the four new items. Build them, establish the contract/witness facts, and then bring their actual identities/artefacts for the teaching-use decision.

## 2. Required change: latin.4 must count the strict 2/4 tresillo control, not “any exercise”

The brief's current evidence decision is too weak. Do **not** widen latin.4's exercise requirement to any of the seven exercise options.

`latin.3` does not guarantee that the learner has played tresillo at pitch: its exercise pool contains four clave drills plus `exercise.tresillo.c`, while its requirement is only one run from the whole exercise pool. Therefore “tresillo at pitch is latin.3's” is a teaching statement, not a completion guarantee.

A7c.1's stated capability is to **play the habanera and the tresillo and distinguish them**, and its map completion says latin.4 is met by runs of its habanera and tresillo items. G13 exists specifically because the old 4/4-tresillo-versus-Bizet comparison was not a strict control.

Use the smallest completion rule that preserves that intent:

- the exercise requirement names **`exercise.bass-cell.tresillo.c`** (the exact 2/4, quarter=60 counterpart of HAB-C);
- the existing named song requirement remains the whole Bizet LH cut, which is the counted habanera-at-pitch run;
- HAB-C/F/G, the old 4/4 tresillo C/F/G, and the extra-key work remain useful lesson steps/options/failure routes, but they do not substitute for the required 2/4 tresillo control.

So the two counted runs become: **strict 2/4 tresillo CONTROL + authentic Bizet habanera MODEL**, both in Keep tempo at the rung's pass pair. That gives the rung one run of each cell without adding a third required run or pretending the prerequisite proved an action it does not require.

Revise the record, lesson “what counts” text, latin.4 requirement, and the relevant completion tests together before dispatch. The brief already owns the requirement question through this review; treat this as the ruled shape, not a separate planning round.

## 3. Other brief decisions

- Keep the existing 4/4 tresillo at the earlier hearing/tapping steps if it is useful continuity from latin.3. The strict 2/4 pair is required where the lesson claims a like-for-like contrast and where the counted pitch evidence is taken.
- The 2/4 form at quarter=60 is preferable to the doubled 4/4 alternative for this control: it matches the sourced cell and the Bizet MODEL without pre-exposing Por Una Cabeza's exact notational form.
- H7 is a real checker-resolution gap but not a reason to block this build while the record remains `draft`. It **must** be closed before A7c.1 can move to `reviewed`: a built generated id must resolve without depending on whether its family happened to appear in a continuity/version-bump file.
- Keep all new teaching-use bits null until the built items are reviewed from their established facts.

With §2 applied, G13 is approved for dispatch.