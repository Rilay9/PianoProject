# Review response — MT1, G6b, PH1a and PF1

**Verdict: APPROVE WITH REQUESTED CHANGES**

<!-- reviewer-closure-v1 -->
REVIEW-OPEN: PH2-source-measure-direct | PH2 must consume source measures directly and remove the legacy printed-number metre lookup as a model input.
REVIEW-OPEN: PF1-strict-reviewed-shipped | PF1 --strict must run on the docs-integrity path for every reviewed or shipped chain record.
REVIEW-OPEN: PF1-earlier-rung-review | PF1 reachability must support an explicitly named prerequisite/earlier-rung review step without adding that review item to the current rung's counting pool.
REVIEW-OPEN: A7b1-insensatez-jazz6 | Insensatez must be optional jazz.6 transfer repertoire with no rung credit, with the lesson withholding the bars 13-15 answer until after the learner's decision and removing stale list-position wording.
REVIEW-OPEN: PF1-counted-drill-journey | PF1 class 6 needs a reusable journey template that can complete the named Reading-and-theory drill and demonstrate its counted requirement.
REVIEW-OPEN: A7b1-zero-preflight-before-reviewed | A7b.1 must not move to reviewed until PF1 reports zero FAIL.


**Scoreboard: 1 / 28 MUST abilities shipped. PACKET-TRACE: PARTIAL 96 / MISSING 5.** A7c.1 remains shipped. A7b.1 remains `draft`.

I read the immutable handoff first, then the landed PH1a/MT1/G6b/PF1 artefacts at `75bddb14`: the source-measure model and tests, the metre model / Chord Chart scheduler / browser acceptance, the jazz.6 stage and lesson, the A7b.1 record, PF1's six checks and broken-record tests, its current A7b.1 report, the facts-currency check, and the current CI/docs-integrity runs. CI, docs-integrity and Pages all pass on `75bddb14`. Nothing was heard.

## 1. PH1a — APPROVE

The required model correction is satisfied.

`ChordSymbol` / `ChartMeasure` now preserve source-measure identity and source order instead of treating the printed measure number as a unique key. Repeated and suffixed labels no longer manufacture false harmony conflicts. The conflict count falling **43 → 31** is the expected consequence: the twelve repeated-number collisions were not real musical ambiguity.

The corrected carry denominator also stands: the earlier “543 changed bars” statement was wrong; the actual semantic carry change is about forty bars in eighteen files, with the rest having been synthetic bars beyond the source measures. The correction is recorded rather than hidden.

### MT1's temporary printed-number adapter

The current `chartBarCounts()` compatibility lookup does **not** create a second authoritative measure model, provided it remains exactly what it is now: an adapter from the old one-cell-per-printed-number grid into PH1a's source-measure model.

It may survive only until PH2. PH2 must:
- draw/iterate source measures in source order;
- take each bar's metre directly from that source measure;
- stop using the printed number to choose the first source measure with that label;
- leave the printed number/label as display metadata only.

Do not let any new consumer depend on `chartBarCounts()`' printed-number lookup. Delete or reduce that compatibility path when PH2 replaces the legacy grid.

**PH2 may dispatch now** under the prior positioned-harmony rulings plus this deletion condition.

## 2. MT1 — APPROVE

The landed behavior matches the prior ruling.

- 2/4, 3/4, 4/4, 5/4, 6/8, 12/8 and 2/2 are counted in the app's established felt-beat reading.
- The tempo field names the non-quarter unit instead of silently changing what “bpm” means.
- The tracker and Comp follow the bar's metre.
- Bass + drums is fail-closed outside 4/4 with an actionable explanation rather than inventing an unverified groove.
- 4/4 remains the established backing behavior, including the pickup differential.
- The mixed 3/4 → 4/4 case pins the new bar's downbeat/accent and count.
- The browser test observes scheduled click/audio-clock events rather than claiming anything was heard.

The measurement-fingerprint correction is also accepted. `metre.ts`, `tempoFromXml.ts` and `measureWalk.ts` are genuine dependencies of the measured facts and belong in the fingerprint. `test_facts_current.py` is the right convergence response to the sequencing mistake: a stale proof now fails close to the cause instead of later appearing as a missing curriculum claim.

No additional MT1 seam is required.

## 3. G6b — APPROVE

The prior G6a required change is correctly carried.

The minor drill is on jazz.6; the rung requires two distinct exercise items including the named minor drill; the major jazz.5 drill is not substituted for it. The answer staff now uses the card's named minor key rather than a convenient unrelated major signature, with the chromatic dominant / Cm6 tones written as accidentals against that key.

The five new teaching paragraphs are consistent with the built drill and the established A7b.1 boundary:
- the four-note iiø7 versus iim7 comparison shows the flat fifth;
- the shell sentence explicitly says why root–3–7 cannot distinguish them;
- Cm6 is treated as the chart's configured tonic, not a universal minor-i rule;
- the drill's nine cases / ten-card cycle / 90% requirement are stated accurately;
- the lesson distinguishes what the app can count from chart recognition, voicing choice, comping and later identification that remain self-checked.

The Free Play direction is also a real current route: Today exposes the standalone **Free play** door, so “Open Free play, on Today” is actionable and not another internal-instructions failure.

Blue Bossa's verified harmony paragraph stands. PH2 still owns making bar 16's second-half G7 visible/audible in the chart; the lesson may state the verified score fact before that UI seam lands only because the chain itself already treats the chart rendering as blocked on PH2.

## 4. PF1 — APPROVE as a convergence preflight, with one boundary on strict mode

PF1 is useful and the first run already justified its existence: it found a real missing-id gap in the shipped Bizet record, and after G6b it reduced Blue Bossa to a small set of explicit reachability / acceptance gaps instead of another broad audit.

The six classes are accepted as **preflight checks, not proofs that no other defect can exist**. Their explicit NOT-APPLICABLE / routed results are important; do not turn those into fake PASSes.

### Strict mode

**Yes:** wire `--strict` into docs-integrity for every `reviewed` or `shipped` record.

**But do not describe that as mechanically closing FABLE's “before dispatch” rule.** Drafts are exactly what builders dispatch, and the proposed CI rule exempts them.

For drafts, keep the current report and apply this dispatch rule without adding another schema or governance layer:

> A learner-facing ability lane may dispatch with PF1 FAILs only when each FAIL is explicitly the defect that lane is being dispatched to clear. Any unrelated PF1 FAIL blocks that dispatch.

That is the smallest enforcement consistent with the owner direction. If that rule itself later gets violated, mechanise that failure then; do not build a declaration framework pre-emptively.

For **A7b.1 now**, the current placement / journey FAILs must be cleared before the record can become `reviewed`. PH2 may proceed because it owns the already-declared visible positioned-harmony gap; the three placement FAILs below are not excuses to widen PH2.

## 5. A7b.1 placement decisions

### Step 3 — keep the seventh-quality ear drill on jazz.5 as explicit review

Do **not** add `drill.ear.seventh-qualities` to jazz.6.

Jazz.6's generic two-exercise requirement deliberately preserves “minor drill + one other jazz.6 exercise.” Adding the ear drill to `exerciseOptions` would make that review drill eligible as the second counted item and quietly weaken the meaning we preserved in G6b.

Instead:
- step 3 explicitly says it is opened from **jazz.5 as review**;
- the jazz.6 lesson gives a cold-start navigation sentence using the visible product route, not just the id;
- PF1's reachability check may learn the small general case “explicitly named prerequisite/earlier rung review,” rather than only its current “later rung” exception;
- the ear-drill row continues to count for neither A7b.1 nor jazz.6.

This is deliberate retrieval of prerequisite learning, not a placement of the drill on the new rung.

### Steps 14–15 — add Insensatez to jazz.6 as optional transfer repertoire

Add `song.folk.insensatez-how-insensitive-jobim.pdmx` to jazz.6's `songOptions`.

That is preferable to making a jazz learner leave the chain for an unrelated Latin-track dependency:
- jazz.6 already has `songOptional: true`;
- it has no song-run requirement, so Insensatez earns no rung credit;
- the piece is here for transfer from the minor ii–V–i control into authentic music;
- the existing Latin placement may remain; this is legitimate cross-track repertoire reuse, not a move.

The jazz.6 lesson should tell the learner to open Insensatez, look at **bars 13–15**, decide the progression/key **before playback or Comp**, then reveal/check it afterwards. Preserve the earlier ruling: the answer is not stated before the attempt.

Adding the eighth song makes two current phrases stale. Update them in the same content change:
- do not call Blue Bossa “the last song on this page”;
- do not keep “seven options / the seventh is Blue Bossa” once there are eight. Prefer wording that does not depend on list position/count unless that count teaches something.

Step 16 may still reuse the whole Insensatez chart later for the unprompted locations; the independence target is the **unpointed-out progression/location**, not a requirement that the learner has never seen the title before.

## 6. The fourth current PF1 failure: journey coverage

Do not waive it.

The counted A7b.1 CONTROL is a Reading-and-theory drill, while PF1's generated journey currently has no drill template and therefore cannot show the rung's counted requirement completing. Add the smallest reusable drill template needed to open the named drill from jazz.6 and complete a passing set through the existing MIDI/drill test path. Then the generated journey can account for the named minor-drill requirement instead of treating the chain's one measured CONTROL as `test.fixme`.

This belongs to PF1's class 6, not PH2.

## 7. Dispatch / acceptance

- **PH2:** may dispatch now. It consumes PH1a source measures directly and removes the temporary printed-number metre adapter as a model input.
- **PF1 strict:** may be wired for `reviewed` / `shipped` records now.
- **A7b.1 placement:** apply the jazz.5 review route for step 3 and jazz.6 optional Insensatez placement for steps 14–15.
- **PF1 journey:** add the counted-drill template.
- Rerun PF1. **A7b.1 does not move to `reviewed` until it reports zero FAIL.**

No owner/device check is requested.
