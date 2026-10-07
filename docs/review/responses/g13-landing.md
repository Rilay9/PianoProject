# Review response — Entries 254–256 / G13 landing

**Verdict: APPROVE**

**Scoreboard: 0 / 28 MUST abilities shipped. PACKET-TRACE: PARTIAL 96, MISSING 5.**

I read the immutable handoff first, then the G13 implementation at `f8fb9779`, the current follow-up through `13cd9a90`, all four committed G13 MusicXML artefacts, the latin.4 lesson and A7c.1 record, the admission rule, the cut-identity test/fix, the current Bizet verified passage fact, and the CD1a staleness seam. Nothing heard.

The three commits after `f8fb9779` change only the review artefacts and the already-reported gate-test pin; they do not change the production semantics reviewed here.

## 1. Entry 256 / G13 artefact review

The required change from `responses/g13-habanera-control.md` is satisfied. latin.4 now counts exactly:

1. `exercise.bass-cell.tresillo.c` in Keep tempo; and
2. the whole Bizet LH cut in Keep tempo.

The habanera drills and the old 4/4 tresillo items remain practice and cannot substitute for the 2/4 control. The lesson, chain and completion tests agree on that boundary.

I read the whole notation denominator committed under `docs/prompts/runs/G13/notation/`:

- `exercise.bass-cell.tresillo.c`: eight bars, 2/4, quarter=60, C major; LH C3 at onset fractions 0, 3/8, 3/4 in every bar; held C-E-G above; printed count `1 . . a . . & .`.
- `exercise.bass-cell.habanera.c`: eight bars, same metre/tempo/key/RH/pitch role, with the one additional LH onset at the half bar in every bar; printed count `1 . . a 2 . & .`.
- `.habanera.f`: the same habanera cell on F3 under F-A-C with one flat.
- `.habanera.g`: the same habanera cell on G3 under G-B-D with one sharp.

I found no bar or counting-line mismatch with the record. The exact sibling comparison is therefore real: in C the two drills differ in the onset cell and not in metre, tempo, key, bar count, LH pitch role or held RH harmony.

The proof boundary is also the one approved in the brief: the app detector plus the independent Partitura witness bar-by-bar, the small family parameter space checked independently, music21 used for theory/spelling rather than as the generator's own reader, and structural/sibling/witness-disagreement near-misses. Feel and changing-harmony role remain UNKNOWN and unclaimed.

### Question 1 — the drill admission rule stands

**Keep the existing gate rule. Do not add a teaching-use-decision requirement for `promise: drill`. Leave the four new drills' teaching-use bits null.**

My pre-dispatch sentence saying to bring the built items back "for the teaching-use decision" was too broad. The important requirement was that no approval be invented before their actual generated facts existed. Those facts now exist and have been reviewed; but D3a's already-reviewed semantic boundary is still correct:

- generated material that promises **music** needs the identity-bound teaching-use decision;
- an **excerpt** needs it;
- a deliberately mechanical generated **drill** is admitted on its objective family contract and the ordinary material/learner gates.

Requiring a person to approve every contract-proved mechanical drill would add a new human quality gate and blur the distinction FABLE deliberately makes between generated CONTROL and generated music. G13 is the clean case for retaining that distinction.

So Start / Quick check / Today may use these drills subject to the existing coping/material gates. This response is an artefact review, not a new `goodTeachingUse` row.

## 2. Entry 255 / cut identity

The implemented fix is approved. The original architecture question in `cut-identity-machine-dependent.md` was correctly withdrawn: identity remains the built file's sha256. The actual fault was the unpinned ZIP `create_system` field, and the cutter now pins the same creating-system value as the importer.

That is the right narrow fix: no new identity semantics, no notation-derived special case, and no compressor rewrite. The test distinguishes the old machine-dependent archive from the fixed one, and the Bizet passage fact is now current on `a39e76951869aabbf39c1d0b4440e4f433baa86da584d7edec650dfa1e539069`.

### Question 2 — re-issue the Bizet teaching-use decision

**Yes. Re-issue Entry 253's Bizet-cut teaching-use decision on the current `a39e7695…` identity, with `supersedes` naming the stale `9ae0d629…` event, and keep the same reason.**

A fresh musical/teaching read is not required for this one repair. The identity rule did exactly what it should: the byte identity changed, so the old event became stale. The discriminating evidence then established why it changed: the inner MusicXML and container entries are byte-identical and the archive difference was only the ZIP creating-system metadata. Re-issuing rather than bypassing staleness preserves the authority model.

This is not a general permission to carry review decisions over arbitrary identity changes. A future change still needs evidence that the old and new subjects are equivalent for the reviewed claim, or a fresh review.

## 3. Entry 254 / CD1a

The required change from `responses/d0762e52.md` is closed. The passage proof now derives its measurement side from the build's authoritative measurement fingerprint, keeps the independent witness side, and pins the one-staff declared hand actually used for measurement. A vocabulary/detector/model/bridge change or a declared-hand change can no longer leave yesterday's proof looking current.

## 4. What remains

Nothing in Entries 254–256 blocks the Bizet chain on these seams. Re-issue the current cut decision as above, then continue the existing A7c.1 finish work. The scoreboard correctly remains 0/28 until the chain's remaining conditions — including the later independence/application line and the generated-id checker resolution already recorded as H7 — are actually satisfied and the learner-facing acceptance path ships.
