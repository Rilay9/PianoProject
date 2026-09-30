# Reviewer response — morning bundle at `eebafb5e`

## Overall

The overnight work is coherent, but five landed seams need narrow fix-forwards before closure: G96, U105, L120d, U32 and E50 each have their own response with the exact boundary. T58 is approved to push. X40's evidence lane is approved to push with the product rulings recorded separately.

The individual responses are authoritative for their seams:

- G96: `responses/48bfc167.md` — **APPROVE WITH ONE REQUIRED CHANGE**
- U63: `responses/7a4e5605.md` — **APPROVE**
- U105: `responses/f51e8010.md` — **APPROVE WITH ONE REQUIRED CHANGE**
- L120c: `responses/e6c20b03.md` — **APPROVE**
- E50a: `responses/a95ebcdd.md` — **APPROVE**
- L120d: `responses/4e76c768.md` — **APPROVE WITH ONE REQUIRED CHANGE**
- E54: `responses/496fa11d.md` — **APPROVE**
- U32: `responses/2f67b047.md` — **APPROVE WITH ONE REQUIRED CHANGE**
- E50: `responses/68e0479b.md` — **APPROVE WITH ONE REQUIRED CHANGE**
- T58: `responses/0ba0d2d1.md` — **APPROVE — PUSH**
- X40: `responses/81d9e4af.md` — **APPROVE EVIDENCE LANE — PUSH**

The required-change fast path applies to each narrow correction above. Do not turn them into fresh full brief cycles unless the builder discovers that the stated correction requires a new product/architecture decision.

---

## CL04 brief — evidence truth

**APPROVE FOR DISPATCH**, with G70's assign-sheet question answered **NO**.

The four rows belong together at the evidence/measurement boundary:

- G70: a carried rung's explicit `introduces` facts may contribute **exposure/introduced** state. They write no encounter, familiarity, requirement or competence evidence.
- L70: an observation carrying an unknown definitions version must be refused on both channels rather than silently read as v1.
- L73: when timing is unresolvable at one step, that must not erase independently measurable pitch evidence at that step; the evidence definitions stamp moving 4→5 is appropriate.
- L79: a twin score run judged by the rung may satisfy the listed book piece's run opportunity once, while unaffiliated Shelf/Paper use gains no rung credit and `reads`/`done`/`measure` remain unchanged.

### G70 assign-sheet half

Do **not** default a lesson's `introduces` concepts into an imported piece's `What it trains` concepts.

`introduces` means the lesson exposes a concept even where no material on the rung yet practises it. Writing that fact onto an arbitrary assigned/imported material would turn lesson exposure into a material teaching claim. The brief is correct to leave that half unbuilt.

The L79 file widening is justified by the actual route truth, not scope creep: the twin cannot carry rung judgement unless the paper route preserves `from` through the lesson door.

---

## U66 brief — a stall is not a miss

**APPROVE FOR DISPATCH WITH ONE REQUIRED BRIEF CHANGE.**

Reproduction first is correct, and the preferred shape remains stall-aware rather than adding a permanent grace delay to every miss on every device.

### Required brief change

The seam's truth must also hold at **the last step and lap wrap**. Remove the option in item 3 that says the report may merely state that a stall across the run's end still loses the note.

A Web MIDI event stamped inside the final step's valid window must not become a miss merely because the main thread stalled across the end of the run. The final-step close and lap-wrap cleanup must use the same bounded stall-safe rule as ordinary windows.

Do not reopen an already-painted miss. Do not widen the musical tolerance. Do not help on-screen keys by pretending their handler-time stamp was captured during the stall.

If the stall-aware implementation itself needs a new arbitrary duration rather than a bound derived from the existing input-stamp trust/tick contract, stop and report that product trade instead of smuggling in another magic number.

---

## G101 — current CI red / Library title at increased text size

**Fast-path product ruling: use (a), scoped to the Library.**

The existing G85a adversary says the piece's identifying title stays whole. The current portrait CSS clamps every Library title to two lines. At 115% the long Twinkle identity needs a third line, so the current CI red is a real product failure, not a test that should be weakened.

Required correction:

- allow the **Library** title up to three lines in the portrait row where the two-line clamp cuts the identifying title;
- keep the Folder rule at two lines unless its own evidence shows a defect;
- do not narrow the actions column as the first fix;
- do not shorten/rename the piece merely to fit;
- do not make the assertion relative while permitting the identifying ending to stay cut;
- add the 115% text-size case to the G85a adversary and print the box measurements on failure as proposed.

This does **not** change U63: Today titles remain at up to two lines and Today reasons remain at up to two lines. Different surfaces have different jobs. A Library title is material identity; a Today reason is compact explanatory copy.

G101 is a narrow fast-path correction of an already-reviewed G85a invariant. It may be included in the same physical push as T58, but keep its implementation head/evidence/record distinct from T58's workflow seam.

---

## Listening packet — shape it before handing it to the owner

Yes, shape the list first. Do **not** target a fixed count. Choose the smallest set that unlocks the next important content decisions.

First packet, in this order:

1. **L120c placement read:** Schumann *Chorale* at 3.5 and Schumann *Melody* at 4.3. They were structurally substituted overnight and remain explicitly unverified as music.
2. **Q57 / Latin:** clave, tresillo, tumbao and montuno material. This directly unblocks F4/latin.3/latin.6 decisions.
3. **R9:** Anh. 113 against classical.3's actual teaching: keep whole, move, or teach through the excerpt.
4. **S9 + M2 together where possible:** the five cut excerpts and the music-promising studies, asking `usableScore` and `goodTeachingUse` from the same sitting rather than duplicating listening.
5. **R6 only for rung-placed PDMX pieces whose decision blocks the next CL18 work.** Do not turn the first evening into an exhaustive corpus audition.

Each card/file in the packet should provide: the exact score/audio, the rung/purpose, one concrete question, and the allowed dispositions. The owner should listen/play and decide, not reconstruct the audit.

X16 and the broader genre/musicianship reads can wait until their clusters approach dispatch unless there is spare listening capacity.

---

## Delivery — D25 is current; no new personal-serve tooling row

**Confirmed: D19 is superseded for the current route. D25 is the owner delivery path.**

The personal phone build is already documented as:

1. personal content build, which is the default (`tools/content/build.py --offline`);
2. `VITE_BASE=/ npm run build:app`;
3. HTTPS from the laptop using **`packaging/serve-lan.py`**;
4. install/update on the phone, then run offline from the installed PWA/TWA path.

Do **not** replace that with `vite preview` in the plan. `serve-lan.py` is the purpose-built HTTPS route, carries the cache/update behavior, has its own test, and is already documented in `OWNER-GUIDE.md`, README, app README and architecture docs.

Therefore **no new tooling row** is needed for the personal-build serve step. Open one only if H2 exposes a real install/update/HTTPS/documentation failure.

The public Pages deployment remains the strict build. A bounded public APK/TWA delivery seam after H2 is fine if still wanted; it is release packaging, not a prerequisite for the personal learner walk.

---

## T58 and X40 push ordering

T58 may push now under `responses/0ba0d2d1.md`. Its docs-integrity workflow run on the push is the runner proof to read back.

X40 may ride the same physical push as a distinct evidence/record commit. Its response deliberately does not claim the unpushed implementation HEAD was fetched from origin; it rules the evidence and deferred product choices while preserving X40's no-reader-change boundary.

If G101 is ready before that push, including it in the same physical push is efficient, but it remains a separate semantic head and fast-path record.

---

## Re-check consequence

After the accepted/fix-forward landings above, collapse the convergence map rows that waited specifically on E50a/L120d/U32/U105 rather than dispatching from their stale `RE-CHECK` labels. In particular, do not let E50a continue appearing as a blocker now that its historical table is closed.
