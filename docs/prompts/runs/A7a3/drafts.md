# A7a.3 probe, Station 5: drafts for the orchestrator (not applied)

Stopped at placement. No stage file, lesson, requirement, teaching-use decision, catalogue row or fact row was changed. The record's header comment lines were updated (premises marked VERIFIED, SOURCED or CORRECTED); its steps, status and every other field are unchanged. Preflight before and after: 15 FAIL (class 3: 12, class 4: 2, class 6: 1), identical (`pf-before-preflight-A7a.3.txt`, `pf-after-preflight-A7a.3.txt`, run with `--content` pointed at the main checkout's built content, read only).

## 1. Decisions the placement needs (reviewer or owner)

1. **The minor form the lesson names** (requirement `A7a3-minor-blues-source`). SOURCES.md finds three attested bars 9-10 and no source that makes either disputed form canonical. Proposed: keep the generator's ♭VI7-V7 for the walking items (the jazz minor blues, the idiom a walking bass belongs to) and have the lesson name it as one variant and the V7-iv7 form as the other, by name. Option not taken: change the generator or the Lab to one form, which no source requires. Every place the fact lives, each to agree with what the lesson says:
   - `tools/content/generate_exercises.py:3954-3965`, `TWELVE_BAR_MINOR`, and its comment "The shape is the standard one" (overclaims: a variant, per the sources);
   - `tools/content/generate_exercises.py:3708-3716` and `:4660-4666` (comments that quote the table);
   - `docs/02-curriculum.md:1196` ("the ♭VI7–V7 at bars nine and ten", stated as the form);
   - `app/src/engine/sightReading.ts:2226-2230`, `BLUES_MINOR` (V7, iv7), offered through the Lab's key picker (`app/src/ui/screens/LabScreen.ts:1004`, LAB_KEYS includes minor keys) and therefore on **blues.6 itself**, whose `tools` carry the Lab preset `blues-shuffle` (`content/curriculum/stage-6.json`, blues.6; preset at `sightReading.ts:2433-2439`, walking left hand): a learner on A7a.3's home can meet V7-iv7 with a walking bass beside items that play ♭VI7-V7;
   - `app/tests/unit/accompanimentLab.test.ts:187-193` pins bar 9 of the Lab's minor blues as E7 (V7) in A minor;
   - `tools/content/tests/test_harmony_families.py` imports `TWELVE_BAR_MINOR` (`:35`);
   - the 12 `exercise.boogie.*.minor-blues` items share the table (`generate_exercises.py:4699`);
   - `docs/02-curriculum.md:1304` calls St. James Infirmary "the minor blues that rung's lesson names" (it is not a twelve-bar; content/lessons/blues.3.md:42 itself says only "the minor one").
   The ruling's "protected by a test": no test reads the walking items' symbols against a stated form today; `docs/prompts/runs/A7a3/walk_read.py` is a candidate (it reads the built files, never the generator).
2. **The requirement on blues.6.** Ruled: `items: [exercise.walking-bass.c.minor-blues]` with `hands: both` once the seam lands. Open: blues.6's existing requirement (`runs`, `from: exercises`, count 1, over five options, `exercise.walking-bass.c.blues` among them) is the walking-bass rung's measured fact (docs/02-curriculum.md:521, "the track's teaching rung for the walking bass"). The blues.8 ruling (section 6) makes the existing requirement item-specific rather than adding one; on blues.6 that would retire the major walking line's credit. Options: (a) replace it with the minor item (the major walk's credit lost); (b) add the minor requirement beside it (two measured facts, both named); (c) a separate rung or sub-step. (b) is proposed; the reviewer rules.
3. **Teaching use of the four items.** PF1 class 5 reports `teaching-use-not-approved` at step 14's gate. The ruling (section 4) keeps walking_bass as NAMED-PATTERN presented as music, so the skeleton's "a contract-proved drill is admitted without a decision" (D3a) does not apply as written; it needs the sourced definition (SOURCES.md section 2) and a near-miss. This probe ran the contract read and three adversaries (`walk_adversary.py`); whether that suffices is the reviewer's.
4. **The 12 boogie minor items.** Not read here (out of scope); P2's decision whether blues.6 places them.
5. **The independence item's key.** The E♭ minor item writes bar 9's ♭VI7 as B7 (B-D♯-F♯-A; the approach A♯2), a deliberate enharmonic (generate_exercises.py:3712-3716). A learner told "♭VI7" sees B7 in the unpractised key. Options: name it in the lesson (B7, written for C♭7), or take `exercise.walking-bass.b-flat.minor-blues` (bar 9 G♭7, spelled as such) for step 14.
6. **St. Louis Blues for the quick IV: bars 1-4 or 1-12.** Bars 1-12 are a whole twelve-bar with IV in bar 2 (both readers); a learner can see the quick change inside the full form. Bars 1-4 lose nothing for bar 2. Proposed: name bars 1-12 in the lesson, keep the step's focus on bar 2.
7. **St James's description.** The record and the lesson say "a 16-bar verse and an 8-bar refrain", not "three eight-bar phrases". How many times the refrain is played is unsettled (a forward repeat with no end; three lyric lines; the app plays it twice). Step 12's "and the repeat" should drop until settled.

## 2. The experience question per step (Stations 2-3 against the record)

| Step | Tool kept? | Alternative weighed | Evidence boundary, and what this probe changed |
| --- | --- | --- | --- |
| 1 lesson | yes | none: a definition needs text | the lesson names the bars-9-10 variant, never "the form"; St James as verse and refrain |
| 2 Hear it, major | yes | drop (met already on blues.6) | the pair's point is the contrast; kept |
| 3 Hear it, minor | yes | Free play Cm7 vs C7 first | kept; the failure route already has Free play |
| 4 Duet, left hand | yes | Wait for me, left hand | the line is four steady quarters (walk-read.json), so time matters from the start; Duet keeps the clock; the row must never count (hands gap) |
| 5 Keep tempo, counted | yes | none | the counted run; needs `hands: both` (ruled, not built) |
| 6 Keep tempo, F minor | yes | a third key | kept |
| 7 Chart, generated item | yes | Score with the left hand only | supported: one symbol a bar, no drop, Bass + drums offered, default 92; the item's own root-third-seventh shell scores 0.75 yes; a rootless third-seventh shell scores 0.5 no, so the lesson tells the learner to comp the shell the item writes |
| 8 Hear it, St James | yes | none | kept |
| 9-12 Chart, St James | yes, after PH2 | Score with the lesson naming bars | blocked: today's grid has 41 cells (17 past the end) and drops 17 symbols in 13 bars; step 10's cell reads one bass note as no (0.25), as the record says; step 12's "repeat" unsettled |
| 13 Chart, St. Louis | yes | bars 1-12 | bar 2's A7 shows today; bar 3's B7 does not until PH2 |
| 14 Chart, E♭ minor, no Count off | **overturned in part** | Count off pressed with the click muted, or the cell called self-check only | the cell is live but never leaves bar 1: every held comp is judged against E♭m7, so a correct comp of bars 2-13 can read "no"; the step's feedback line must say the cell judges bar 1 only, or the step keeps Count off. Also the B7 spelling (decision 5) |

## 3. PH2 dependency per step

Steps 9, 10, 11, 12: blocked (split bars and the 41-cell grid). Step 13: bar 2 not blocked; bar 3's B7 blocked. Step 7 and step 14: not blocked by PH2 (one symbol a bar); step 14 has its own cell defect (above), not PH2's.

## 4. A `docs/pending-review.md` entry (draft)

> **A7a.3 probe (St James, the minor-blues facts).** Fact probe under `responses/a7a-drafts.md` section 2; nothing learner-facing changed. Two-reader claim checks on both identities of St. James Infirmary (41/41) and St. Louis Blues (23/23); intake records `intake/Qmdyj….md` and `intake/QmYutJ….md` (RE-ADMITTED, CANDIDATE; G10 and G14 not run on the current identities). St James is a 16-bar verse and an 8-bar refrain with an unterminated forward repeat; today's chart draws it as 41 cells. The four minor walking items and the major sibling read by an independent reader: 0 contract breaks in 65 bars, three adversaries red. Minor-blues bars 9-10: three attested forms in eight sources, none canonical (SOURCES.md): `A7a3-minor-blues-source` stays open with a proposed resolution (named variants) and the list of every place the fact lives. Found: the chart's cell with no Count off judges every bar against bar 1 (step 14). Record header updated; steps unchanged; preflight 15 FAIL before and after. Evidence `docs/prompts/runs/A7a3/`.

## 5. Amendment lines for ABILITY-MAP A7a.3 (draft)

- Amended 2026-10-07 from the A7a.3 probe: St. James Infirmary is a 16-bar verse and an 8-bar refrain in D minor, not a twelve-bar and not this block's form MODEL (RECONCILIATION A7a.3 row A); its role is minor-key TRANSFER for walking and comping on the chart, after PH2. Its harmony is checked by two readers (intake/Qmdyj….md).
- Amended 2026-10-07: St. Louis Blues bars 1-12 are a whole twelve-bar in E with the IV in bar 2 (two readers); the quick-IV MODEL can name the whole twelve.
- Amended 2026-10-07: the minor twelve-bar's bars 9-10 have attested variants (♭VI7-V7, V7-iv7, iiø7-V7; docs/prompts/runs/A7a3/SOURCES.md); the generator and the Lab state different ones and both appear on blues.6 (the Lab's key picker). The lesson names variants; the CONTROL's form is the generator's.

## 6. INTAKE-GATE (e), items 1-7

1. **Each step.** Tool: `scan_stj.py` (CSV filter and one tarball stream, 11 members); `candidate_row.py` (two-row candidates.json through shortlist.select, every gate kept); `quarry.py --skip-render --no-reuse` (G1-G3, G8-G9, reconversion); `gates_stj.py` (G4-G6 counts, G11 tool verdicts, round-trip set); `harmony_read.py` (two readers, per identity); `form_read.py` (barlines, repeats, phrase comparison); `chart.probe.ts` (the app's readers and chordMatch, vitest on the lane's config). By hand: G4, G6, G7 against the mapping table; G11's notation and lyric reading; G12's edition comparison; the form reading. Six manual acts; G12's family table and the phrase comparison could be scripted next.
2. **Which tool did what.** quarry.py takes a CID only through candidates.json (the two-row workaround again); gate 5 (render) is fixed to 4173, so G10 has no lane route except content-render.spec on a built app; G14 needs build.py, which this session's permission check refused, so the built catalogue was read from the main checkout.
3. **Where a tool was wrong or silent.** quarry_core.identity says TITLE_ONLY for St James (no creator; correct as far as it goes). analyse calls the St James file LEADSHEET with 151 lyric syllables in its one part: the voice signal (gap ii) is not reported. Nothing flags a forward repeat with no end (music21 refuses to expand it; the app plays it twice). Nothing flags a "D.C. al Fine" with no Fine (St. Louis Blues: 80 rendered measures from 28). The CSV's bar counts (32, 52) are expanded lengths, not the file's.
4. **Decisions a person made.** The edition (the shipped 24-bar one; the others are the refrain alone or a choral arrangement); no cut; the probe builder made each, and a reviewer's request for the refrain alone would reverse "no cut".
5. **Reuse.** As is: scan_stj.py (change the terms), candidate_row.py (change the CIDs), harmony_read.py, form_read.py, gates_stj.py, chart.probe.ts. After a change: walk_read.py for another generated family (its role table is the walking line's). Not reusable: the SOURCES.md searches.
6. **The record.** The two intake files, complete under (c) with G10 and G14 marked; the pending-review line and map lines above.
7. **Unverified.** Nothing was heard. Whether bars 17-24 are the melody a listener knows; the refrain's count; Spitzer, Levine and Aebersold not read; Open Music Theory's Example 4 and Premier Guitar's Fig. 12 bar 10 not read (images); the render of both current identities; the built-time hash checks (G13 at build).
