# Review response — SR4 landing

**Verdict: APPROVE**

**Scoreboard: 0 / 28 MUST abilities shipped. PACKET-TRACE: PARTIAL 96, MISSING 5.**

I read the immutable handoff first, then the exact implementation at `fe33cba9`: the run-header shape, Score-screen write path, rung-state read path, source callers, the SR3 cases, the historical-vocabulary adversary, and the persistence/backup round trip. Nothing heard.

## 1. The required SR3 change is satisfied

The architecture is now the one I asked for.

- `RunHeader.opened.hold?: string` is a narrow provenance fact: the lower rung whose taught set deliberately held the generated sight-reading phrase while another rung judged the run.
- The Score screen decides that fact at phrase-write time through `storedHold`; ordinary/unheld runs store no hold.
- `runHeader` copies the already-decided `phraseHold` into the observation. It is not reconstructed when the run finishes.
- `rungState` reads only the stored fact through `heldWhenPlayed`. It no longer needs the catalogue or present-day vocabulary to decide whether a historical run was held.
- A row with no stored hold — including every legacy row — is never guessed as held or rewritten.
- The phrase's `material` remains the generated material identity and is not overloaded with policy provenance.

This closes the conceptual fault in Entry 262.

## 2. The adversary is the important proof

`heldFactStoredAtPlay.test.ts` proves the failure mode that required SR4 rather than merely replaying the happy path.

It stores:

1. a daily read genuinely held at 1.1 while judged by 1.5; and
2. an ordinary unheld read judged by 2.2.

It then changes today's vocabulary so Entry 262's old inference would classify **both in the opposite direction**. Their rung credit nevertheless stays as it was at play time because the reader uses the stored fact.

That is the right regression boundary.

The existing SR3 behavior also remains intact: held runs credit none of the judging rung's requirements, legitimate learner evidence remains elsewhere, unheld runs count normally, and old held runs cannot become future-rung credit merely because the learner later reaches the rung.

## 3. Persistence shape is accepted

No DB-version bump is required for this optional nested field on the evidence presented.

The test verifies the hold through the normal session write/read, evidence replacement, compaction, in-memory and streamed backups, and restore into a fresh store. Those paths preserve the complete row rather than whitelisting the old `opened` shape.

The compatibility rule is explicit and correct: runs written while SR2/SR3 existed but before SR4 have no `opened.hold`, so they retain legacy credit rather than being retroactively inferred. That is the deliberate price of refusing to manufacture historical facts.

## 4. One non-blocking truth cleanup

`app/tests/unit/heldDailyRunRoundTrip.test.ts` still has its pre-SR4 explanatory comment saying the route's hold is “never stored” and that the held phrase is recovered “with no new stored field.” The test itself is still useful — it proves the reader/evidence job can reconstruct the actual generated phrase from `material` — but those two comment claims are now false.

Please update that comment in the next convenient commit so it says, in substance:

- `opened.hold` stores the **policy/provenance fact** for rung credit;
- `material` independently stores enough of the **phrase identity** for the reader/evidence job to reproduce what was actually read.

No new seam or re-review is required for that wording cleanup.

## 5. Disposition

**SR4 approved. SR3 is closed.**

This does not add any condition to A7c.1. Its only remaining shipping gate is still the owner's phone walk of the deployed learner path; after that passes, the record may become `shipped` and the scoreboard may move to **1 / 28**.

The Blue Bossa chain/brief is not yet a response-required handoff in `docs/review/current.md`; review it when its immutable handoff lands rather than reviewing the drafter's in-progress narrative.
