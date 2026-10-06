# Review response — A7b.1 / Blue Bossa design

**Verdict: APPROVE WITH ONE REQUIRED CHANGE**

**Scoreboard: 0 / 28 MUST abilities shipped. PACKET-TRACE: PARTIAL 96, MISSING 5.**

I read the immutable handoff first, then the draft A7b.1 record, the probe brief, the latin-cluster skeleton, A7b.1 in the ability map, the relevant MODE-SHEET boundaries, the current shell-drill construction, the Lab progression writer, the Chord Chart implementation, the intake-record contract, and the existing verified-facts boundary. Nothing heard.

This is a good second chain. It is materially more varied than A7c.1 without being varied for its own sake: lesson -> Free Play -> ear drill -> shell CONTROL -> Lab MODEL/TRANSFER -> real Chord Chart MUSIC -> an unseen chart decision. Each tool has a different learner job, and the record is unusually careful about what is and is not stored.

The probe may dispatch after the one required design correction in §4 below. The record stays draft.

## 1. Question 1 — keep one counted G6 run; do not add the Lab run

**Keep the minor-shell drill as the one counted row. Do not add the Lab's Read it run merely to make completion look heavier.**

The Lab run would measure the learner playing **the voicing the generator wrote on the page**. It does not measure recognising the progression, choosing the voicing from symbols, or using it in music. Counting it would add a second green fact without getting closer to the independent target.

The one G6 run is an honest measured completion boundary **only if G6's set itself covers the CONTROL it claims**:

- configure exactly three minor keys for this first chain;
- the prompt population must contain iiø7, V7 and the explicitly specified tonic chord for **every one of those three keys**;
- the ordinary run must actually ask all nine key × chord cases, not sample a subset.

The current chord drill cycles deterministically through its built chord list and defaults to ten prompts, so three keys × three figures can meet that shape. G6 must pin it with a test; if it later uses four keys, random sampling, or a shorter set, one run is no longer enough and the completion rule must change with it.

The lesson also needs the CT-1 truth sentence already implied by the record:

> The app can mark the shell drill requirement. Finding the progression on a chart, choosing the tonic voicing from the symbol, comping the tune and the later unseen identification are self-checked and do not become app-verified because the rung is met.

Do not make the Lab row count, the chart cell count, the ear-drill row count, or a melody run of Blue Bossa count.

The known app-wide coloured “complete” presentation for a rung whose independence is self-checked remains its separate product seam; do not use that UI state as evidence that A7b.1's independence has been measured.

## 2. Question 2 — G6 must not choose one universal minor-tonic quality

**Do not choose one of im7 / im6 / im(maj7) as “the” tonic of the minor ii-V-i.**

The chain itself already disproves that simplification:

- Blue Bossa's candidate chart is being verified as **Cm6** at the target resolutions;
- Insensatez's transfer/independence chart is being verified as **Am7**.

The independent target is correctly worded: **play the tonic shell the symbol asks for**. G6 should implement that target, not turn one tune's tonic quality into a theory law.

For this first seam:

- the generated CONTROL must include at least **minor-sixth and minor-seventh** tonic cases;
- each tonic prompt must name the actual chord/symbol it expects; bare `i` is not enough to distinguish root-3-6 from root-3-7;
- C minor may deliberately use the Blue-Bossa-facing **Cm6** case first;
- at least one of the other configured keys must use a **minor-seventh** tonic so the CONTROL transfers to the Insensatez case;
- **minor-major-seventh is not required for A7b.1** unless the source search finds a named learner-facing consumer for it. Do not add it just because it is theoretically possible.

CK-6 should therefore compare the exact configured chord symbols/pitch-class sets, not ask music21 to invent a single generic “sourced i” quality for all cases.

The iiø7 limitation remains as drafted: a root-3-7 shell cannot show the flat fifth. Either the drill includes the fifth on a dedicated card, or the lesson explicitly says the shell is identical to the corresponding m7 shell. The current record's Free Play four-note comparison is a legitimate way to teach that limitation; the three-note drill must not claim it measured the distinction.

## 3. Question 3 — keep the harmony facts in the intake records for this chain

**Do not add `kind: harmony` to `content/sources/verified-facts.json` yet.**

For A7b.1, these are item-specific claim checks used by a lesson/chain, not a runtime detector result or a cross-item query. The intake contract already has the right second-step home: **Claim checks**.

Station 2's route is good, with these requirements:

- record the exact raw and converted/current identities (the G13 hashes);
- record the normalized per-bar harmony facts the lesson will rely on;
- require the two independent readers to agree on root, kind, alterations/degrees and resulting pitch classes;
- record the app harmony reader beside them as the consumer, never as the witness;
- explicitly record the negative Insensatez look-alike at bars 29–31;
- placement/lesson work may cite those facts only while the file identity is the one the claim check names. If the identity moves, the claim check is stale and must be re-run before the wording is reused.

Do **not** write code that parses the Markdown intake record as a fact database.

If a second chain later needs machine-readable harmony passage facts, or a real app/build consumer needs to query them, bring back a small `harmony` fact-kind proposal with the two-chain use cases. At that point the shared store may be justified. Building the schema now would be framework before a consumer.

## 4. Required change before dispatch — the chart backing premise is false

The record's Blue Bossa comping step says:

> Comp off and Bass + drums on.

That musical task is good: the learner supplies the harmony while the app supplies a rhythm section. But **the current Chord Chart cannot actually provide it**.

In `ChordChartScreen.ts`:

1. turning **Bass + drums** on forces `comping = true`; and
2. more importantly, the backing scheduler is called from `compBar()`, while `onBeat` calls `compBar()` only when `comping` is true.

So even if the learner turns Comp off again while the Bass + drums toggle remains visually on, the bass/drum backing is no longer scheduled. The UI state can say “backing on” while the intended rhythm section is silent.

The probe's Station 4 currently asks the opposite question — “whether Comp sounds with Bass + drums off.” Replace/add the actual discriminating check:

> **With Bass + drums on and Comp off, do bass and drums sound for each bar while the app supplies no chord comp?**

On the current code the answer should be no. Record that as a capability gap, not as a Blue Bossa content defect.

### Disposition

Preserve the learner action rather than silently weakening it. This is a plainly app-wide Chord Chart capability: **backing and comp must be independently switchable**, so a learner can comp with the rhythm section without the app duplicating the chords.

The first probe lane does **not** build that app seam. It should:

- correct A7b.1's header to name this additional unresolved capability;
- mark the “Comp off + Bass + drums on” step as blocked on it;
- make Station 4 reproduce the current coupling/silence;
- draft the smallest follow-up seam that schedules backing whenever `backing` is on, independent of `comping`, while `comping` controls only the app's chord voicing.

That app seam must land before the chain is `reviewed`, but it does not block the intake/harmony/G6 fact probe.

Also make the following whole-chorus step explicit about **Comp off**. After the backing-only step, “Bass + drums off” by itself is not a statement about whether the app is still supplying chords.

## 5. Remaining record/tool boundaries

The rest of the evidence wording is acceptable at design time:

- Free Play's chord name is a readout, not evidence.
- The ear drill measures the echo, not the spoken quality name.
- The Lab's Read it measures execution of written generated material, not voicing choice.
- Play the tune's pitch-class count is ephemeral and does not establish rhythm, form or choice.
- The Chord Chart live cell is unstored and cannot establish voicing/rhythm/form over time.
- Blue Bossa melody Keep tempo does not establish harmony.
- The Insensatez identification and later whole-chart independence remain explicitly self-checked.
- The optional A7c.3 bossa-bass step correctly warns that the chart cell is the wrong feedback for a root-fifth bass.

Station 2 must still verify every named harmony claim before any lesson states it. Until then the bar claims remain hypotheses.

## 6. Dispatch

After §4 is edited into the record and probe brief:

**APPROVED FOR DISPATCH: `probe-bluebossa` only.**

It may admit Blue Bossa, independently verify the named harmony claims, inspect G6/Lab/Chart facts, and stop at placement. It must not build G6, the chart-backing capability, placement, lesson text, or a new verified-fact schema.

Bring back the probe artefacts and the resulting placement/G6/chart-capability briefs as separate seams.
