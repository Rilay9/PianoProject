# Review response — A7a.3 St James / A7a.1 Blues Riff draft chains

**Verdict: APPROVE WITH REQUESTED CHANGES**

<!-- reviewer-closure-v1 -->
REVIEW-OPEN: A7a-hands-both-requirement | A runs requirement that means a both-hands performance must be able to declare hands: both and rung completion must read SessionRow.hands.played; one-hand Duet rows must not satisfy it while legacy requirements remain unchanged.
REVIEW-OPEN: A7a3-minor-blues-source | Before A7a.3 teaches one minor twelve-bar form as the form, resolve the generator-versus-Lab bars 9-10 conflict from a cited musical source; then the chosen or explicitly labelled variant must be reflected consistently in learner-facing content and protected by a test.
REVIEW-OPEN: A7a1-bluesriff-restaff | Build the playable Blues Riff teaching edition as an independently verified re-staffing that preserves the source riff and root-bass events while putting riff on the upper staff and roots on the lower; do not silently rewrite the source pitches.
REVIEW-OPEN: A7a-authored-id-resolution | The chain resolver must resolve authored exercise ids such as exercise.blues.twelve-bar-shuffle.c from committed authored source truth without executing the score module, with exact-id and duplicate-id adversaries.

**Scoreboard: 1 / 28 MUST abilities shipped.** A7b.1 remains draft pending PH2. A7a.1 and A7a.3 remain draft designs.

I read the immutable handoff first, then both chain records and both probe briefs, the ability-map/reconciliation evidence they cite, the current requirement/evidence model, the Mode Sheet's Duet contract, the generated-family contract evidence, the current resolver, and the authored C-shuffle source. Nothing heard.

## 1. IDs — confirm A7a.3 and A7a.1

Yes.

- St James belongs to **A7a.3**. The MUST ability is the minor-blues / quick-IV block; St James is real-tune transfer for walking and comping, **not** the minor twelve-bar model.
- Blues Riff in C belongs to **A7a.1** as its full-form transfer.

The SHOULD jam row does not create another ability id. FABLE §2 may name these two ids explicitly.

## 2. Fact-gathering probes may dispatch with unrelated PF1 FAILs — narrowly

The PF1 dispatch rule governs a **learner-facing ability lane**. A fact/intake probe that changes no learner-facing product may run while known PF1 failures remain, because its purpose is to determine facts needed to design the later lane.

That is not a general exception.

For each probe:
- enumerate the PF1 FAILs it can possibly clear;
- enumerate the known FAILs it cannot clear;
- make no stage/lesson/requirement/app change;
- stop before placement/build;
- return the evidence to the reviewer/next design gate.

Once a lane changes what a learner meets, the normal PF1 rule applies again: unrelated FAILs block that learner-facing dispatch.

So both current fact-gathering probes may dispatch under their stated ownership.

## 3. The minor twelve-bar bars 9–10 conflict — source first

Do not choose the generator's **♭VI7 → V7** merely because St James happens to contain that pair, and do not choose the Lab's **V7 → iv7** because it already exists in runtime code.

The repository currently contains two incompatible definitions and no lesson source settles the matter. Research a cited musical source before the learner-facing build.

If the evidence establishes that both are recognized variants, the product may teach them as **named/explicit variants**. It must not present two different forms as though both were one canonical definition.

Until that source decision is made:
- the fact probe may proceed;
- generated notation may be inspected;
- A7a.3's lesson must not state one of the disputed forms as settled truth.

This is the open requirement `A7a3-minor-blues-source`.

## 4. walking_bass is NAMED-PATTERN presented as music

Keep the existing family semantics.

The current family contract says `walking_bass` is a music family, and the generator addendum already treats it as a provisional music family. The ability is learning a recognizable walking-bass construction, not merely executing arbitrary notes under a timing drill.

So for A7a.3:

- `job: NAMED-PATTERN`
- `presented_as: music`
- a sourced definition of the pattern/form properties that are actually claimed;
- a near-miss/adversary that separates the named pattern from something merely bass-like;
- anything not established — especially feel/musical quality — stays UNKNOWN.

Do not relabel it CONTROL merely to reduce its verification burden.

## 5. A7a.3 home — blues.6

Use **blues.6**, not jam.6.

The ability map owns this as a blues progression/form ability. Jam is a recurrence/application surface, not the owner of the concept.

Placement shape:

- put the minor-blues walking-bass control(s) needed by the chain on blues.6;
- the counted requirement names **`exercise.walking-bass.c.minor-blues`** exactly;
- that requirement declares **`hands: both`** once the app-wide hand-condition seam lands;
- St James and St Louis may also appear on blues.6 as **optional transfer repertoire with no song credit**, while retaining any legitimate existing placements elsewhere.

That is the same useful distinction we just used for Insensatez: cross-track/cross-rung repertoire reuse is fine; accidental completion credit is not.

St James remains explicitly **not** the twelve-bar model.

## 6. A7a.1 counted run — make blues.8's requirement about the ability

Place `exercise.blues.twelve-bar-shuffle.c` on blues.8 and make the existing measured exercise requirement name it.

Do **not** add a second overlapping requirement while leaving the generic “any one of five exercises” requirement intact. The rung should not be completable by an unrelated exercise while pretending it measured A7a.1.

Preferred shape:

- `exercise.blues.twelve-bar-shuffle.c` becomes a blues.8 exercise option;
- the existing exercise `runs` requirement becomes item-specific to that id, count 1;
- it declares `hands: both`;
- the unjudged own-chorus line remains unjudged/self-checked.

This keeps one measured completion fact and one honest independence fact.

## 7. App-wide hands gap — fix the requirement contract, not Duet

The handoff's diagnosis is correct.

A Score run already records what the learner played in `SessionRow.hands.played`. Skill evidence already knows the meaning of `both-hands`. Rung completion simply fails to consume that fact.

Add an optional hand condition to a runs requirement:

`hands: both`

Semantics:

- absent: existing requirements behave exactly as today;
- `both`: a candidate row satisfies the requirement only when `row.hands.played === 'both'`;
- a one-hand Duet row therefore fails because of what the learner actually played, **not because its mode/tool is Duet**;
- a legitimate both-hands Keep-tempo run passes normally.

PF1 class 4 should read the same condition and reject a chain that calls a one-hand run counted against a both-hands requirement.

Minimum adversaries:
1. passing tempo/accuracy + both hands → counts;
2. identical row + left only → does not count;
3. identical row + right only → does not count;
4. a legacy requirement with no `hands` field behaves byte-for-byte/equivalently as before;
5. a Duet/accompanied run cannot sneak through merely because its stored mode is Keep tempo.

This is `A7a-hands-both-requirement`.

## 8. Blues Riff playable edition — re-staff, preserve riff + roots, drop the extra voicings

The source's riff and roots are the material this ability needs. Build a separate teaching edition rather than mutating the source:

- upper staff: the source riff events;
- lower staff: the source root-bass events;
- preserve pitch, onset, duration, bar position and written B naturals exactly;
- omit the source's additional rootless piano voicings from this **teaching edition**.

Keeping the rootless voicings would add a third harmonic texture to an exercise whose pedagogical job is specifically “right-hand riff over your own left-hand groove.” That is extra material, not useful fidelity for this role.

The original source remains intact. The re-staffing verifier must compare the selected source riff and root events bar-for-bar/event-for-event against the new edition, and mutation cases must catch a changed/missing pitch, onset or duration.

Do not “correct” the B naturals or explain their stylistic function unless an independent source establishes that claim.

This is `A7a1-bluesriff-restaff`.

## 9. Authored exercise ids — extend the existing resolver from committed source truth

`exercise.blues.twelve-bar-shuffle.c` is authored in `content/scores/authored/blues-12-bar-c.py` with a literal `PIANOPATH["id"]`. The checker currently knows static catalogue ids, PDMX ids/CIDs, generated-id manifest/continuity, excerpts and families, but not these authored module ids.

Extend that resolver narrowly.

Preferred mechanism: parse authored Python modules **statically** with Python's AST and accept a literal `PIANOPATH` mapping whose `id` is a string. Never import/execute the module just to discover an id.

Require:
- exact-id matching;
- duplicate authored ids fail loudly;
- a prefix/suffix/case variant does not resolve;
- malformed/nonliteral metadata does not get guessed.

Do not create another registry unless the build already has a canonical authored-id manifest that can serve this exact purpose.

This is `A7a-authored-id-resolution`.

## 10. PH2 dependency

The A7a fact probes do **not** wait for PH2.

The learner-facing St James chart steps do.

The current chart drops later harmony in 13 of St James's 24 bars, so no lesson/build may rely on those chart steps until PH2's positioned-harmony consumer lands and is reviewed. The existing `PH2-source-measure-direct` reviewer requirement already tracks that dependency; do not create a duplicate A7a blocker for the same seam.

## 11. Dispatch

May dispatch now:
- St James fact/source probe;
- Blues Riff intake/re-staffing fact probe;
- the narrow authored-id resolver design/build;
- the app-wide `hands: both` requirement seam;
- the cited-source research on the minor-blues form.

Learner-facing A7a.3 content waits on the minor-form source and both-hands requirement. Its St James chart steps additionally wait on PH2.

Learner-facing A7a.1 placement waits on the both-hands requirement and a verified playable Blues Riff edition.

No owner/device check is requested.
