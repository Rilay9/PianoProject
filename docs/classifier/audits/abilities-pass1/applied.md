# Abilities pass 1: what was applied to `docs/classifier/abilities.md` (2026-10-08)

**Who:** an agent that wrote neither the list nor the findings. **Base:** worktree cut from origin at 9bf8345e. **Inputs:** `rows.md` and `missing.md` in this folder; the owner's decisions of 2026-10-08 ("Those sound good, k"), relayed by the coordinator; FABLE.md sections 2 and 3. **Changed:** `docs/classifier/abilities.md` and this file only.

**Naming.** `rows.md` and `missing.md` say GAP-01 to GAP-07. On the owner's word (relayed 2026-10-08) section 6 of the list is now "Open research items (not gaps: a gap means what code cannot verify, FABLE phase 3)" and the items are OPEN-01 to OPEN-07, the same numbers: GAP-0n = OPEN-0n. This file uses OPEN-nn. New open items are OPEN-08 to OPEN-12.

**How the edits were made (measured).** By script (`build/apply.py`, `build/newrows.py`, `build/trace21.py`, `build/apply2.py` in the worktree, not committed), from a copy of the list taken before any edit. Section 5's "fully" and "in part" columns and all of section 7 are generated from section 1 and the trace, so they agree with the rows by construction. The trace is checked against the four drafts by script: 482 draft row ids, 482 traced, none missing, none twice, none extra.

**How quotes were checked (measured).** Every source page or PDF behind an N row, and behind every quote I added to an existing row, was downloaded with curl on 2026-10-08 (34 URLs, under `build/src/`). PDFs were converted page by page with PyMuPDF; HTML was stripped to text. A script (`build/find.py`) searched each quote after normalising case, whitespace, quote marks and dashes, and printed the PDF page. The ABRSM 2027-28 sight-reading table (p.16) was rendered as an image and read by eye for the rest and dotted-rhythm symbols, which are glyphs. "Found verbatim" below means found by that script, or, for the two glyph cases, read on the rendered page. The web-fetch tool was not used.

**Outcome words.** *applied*: done as the finding says. *changed*: done, but differently from the finding (how is stated). *not applied*: not done, with the reason. *not done*: could not be done, or outside this brief, with the reason.

## 1. Row verdicts from `rows.md` (every WRONG and UNSURE row)

| # | finding | outcome | what was done, or why not |
| --- | --- | --- | --- |
| R01 | AB-004 WRONG minor: A9.1 mapping cannot claim the stop condition | applied | existing-ability cell now "A9.1 (in part: tension awareness, not the stop condition …)" |
| R02 | AB-027 WRONG material: no prepared level for 2/2 and 3/8 | applied | FB 3A added for common time, cut time and 3/8 (Faber chart p.2 found verbatim), with a pass-1 note on the prepared-versus-sight gap |
| R03 | AB-028 WRONG material: only at-sight levels | applied | FB 3A (6/8), FB 4 (sixteenths in 6/8), FB 5 (12/8) added from the Faber chart (found verbatim) |
| R04 | AB-031 WRONG minor: ABRSM Initial rest is the semibreve rest; FB 3B sixteenths missing | applied | checked on the rendered ABRSM p.16 (Initial: semibreve rest; Grade 1: minim and crotchet rests); parameters corrected; FB 3B sixteenth patterns added; AT-088's carried cell left verbatim with a superseding note |
| R05 | AB-032 WRONG minor: dotted quaver-semiquaver at ABRSM G3 missing | applied | added after reading the rendered p.16 Grade 3 cell |
| R06 | AB-039 WRONG minor: E minor filed under two accidentals | applied | key groups rewritten: E minor under one (AB G2, TCL G4); "none" now names C major and A minor by board |
| R07 | AB-061 WRONG minor: Trinity G2 and Faber 3B levels missing | applied | TCL G2 (AT-164, Trinity p.88) and FB 3B grace notes added, both found verbatim |
| R08 | AB-070 WRONG minor: an exam descriptor, not a measurable act | applied | restated: play running passagework evenly and clearly at the piece's tempo |
| R09 | AB-071 WRONG minor: a list descriptor; join with AB-054, AB-049, AB-063 | changed | restated as an ability (a lyrical melody played cantabile), not joined: the brief says restate; the row notes the overlap and is kept as the combination a lyrical piece asks |
| R10 | AB-073 WRONG minor: names a list; fold AB-073 to AB-076 into AB-072 or restate | changed | restated as "play a Baroque piece in a Baroque style" (the brief says restate, keeping sources); no source read states the style's demands, so the row says so and OPEN-12 asks for one |
| R11 | AB-074 WRONG material: List B at L1-2 is wrong; sonatinas also at L8; restate | applied | parameters rewritten from RCM p.4 (List A Baroque and Classical at L1-2; List B L3-10) and p.73 (L8 prints sonatinas), both found verbatim; restated as playing in the style; OPEN-12 |
| R12 | AB-075 WRONG minor: as AB-073 | changed | restated as "play a Romantic piece in a Romantic style", not folded; OPEN-12 |
| R13 | AB-076 WRONG minor: as AB-073 | changed | restated as playing a post-Romantic to 21st-century piece in its style, not folded; OPEN-12 |
| R14 | AB-077 WRONG minor: an exam component; state as A7f.2's act | applied | restated: play a study at its marked tempo with its target technique secure; the row says the RCM supports only the count |
| R15 | AB-078 WRONG minor: an exam substitution rule; drop or fold | changed | restated as an ability (play a notated popular-song arrangement for solo piano at one's level), not dropped: the brief says restate; kept because reading a notated pop arrangement differs from realising a chart (my reading, stated in the row) |
| R16 | AB-079 WRONG minor: a repertoire category; drop or restate | changed | restated (play a solo-piano reduction, keeping the main line clear), not dropped; the texture clause is marked as my reading; OPEN-12 |
| R17 | AB-081 WRONG minor: RCM Prep A already has D major | applied | parameters corrected (D at RCM Prep A, found verbatim on p.9) |
| R18 | AB-102 WRONG minor: Faber 3A one-octave arpeggios missing | applied | FB 3A added (on the chart's p.2; the script missed it only because the PDF text puts a soft hyphen in "One-octave", read in the extracted text) |
| R19 | AB-105 WRONG minor: is A2.1 in part | applied | existing-ability cell now "A2.1 (in part …)"; Faber 2B "I, IV, and V7 chords in C, G, and F" cited (found verbatim); FB 5 cadences added (see D07) |
| R20 | AB-112 UNSURE: whether figured bass is needed | applied | the owner's decision 3: kept, at the advanced levels only; parameters and disagreements cells say so |
| R21 | AB-116 WRONG minor: also A7g.1 in part | applied | existing-ability cell adds "A7g.1 (in part: a song or hymn in a second key)" |
| R22 | AB-126 WRONG material: singing from a score is not singing back | applied | the owner's decision 2: row dropped; AT-144 and AT-145 traced "DROPPED (owner, 2026-10-08)"; listed in section 3 with the reason |
| R23 | AB-127 UNSURE: singing an interval | applied | the owner's decision 2: row dropped; RC-055 traced "DROPPED (owner, 2026-10-08)"; section 3 |
| R24 | AB-134 WRONG minor: "its key and modulations" duplicates AB-132 and AB-138 | applied | clause removed from the title (section 1 and section 4) |
| R25 | AB-154 WRONG minor: cites the writing-down rows AT-023 and ST-165, which scope keeps out | applied | citations removed; both rows traced DROPPED and listed in section 3. **For the owner:** the 2026-10-08 reinstatement had folded them into AB-154; I followed FABLE section 2 ("writing music out on paper are out") and that decision's own "still out" line, as rows.md asks; if the reinstatement meant otherwise, this is the line to reverse |
| R26 | AB-155 WRONG minor: not separable from AB-179; join | changed | restated (make up one's own keyboard part in a named style, rather than play a learned groove), not joined: the brief lists AB-155 for restating; the row names AB-179 and AB-110 as near; the changed Berklee wording is noted (found verbatim) |
| R27 | AB-161 WRONG minor: advice, not an ability; fold into AB-157 or AB-172 | changed | restated (play a simple non-jazz tune in a jazz interpretation), not folded: the brief lists it for restating; kept because the starting tune is not a jazz head |
| R28 | AB-163 WRONG minor: Berklee lesson 8 names the minor II-V-I; not weak | applied | citation added (found verbatim); a pass-1 note supersedes the carried "weakly sourced" text, which is left verbatim as the list's rule requires; A7b.1 no longer marked weak |
| R29 | AB-175 WRONG minor: Berklee lesson 5 names intros; extend the row | applied | title now intros, turnarounds and endings; citation added (found verbatim); A7a.2 intro gap closed |
| R30 | AB-195 WRONG minor: ILPN-227 mis-cited; Berklee Latin quote not on the page | applied | ILPN-227 citation moved to AB-197 (its page downloaded: both ILPN quotes found verbatim); the Berklee Latin quote removed; with the owner's split (M11) |
| R31 | AB-201 WRONG minor: duplicates AB-023; carry Trinity levels, not Theory | applied | joined AB-023: TCL Init, G1, G2 levels added (Trinity p.88, found verbatim); AT-157's level cell carried verbatim with a note that its Th levels are written work and not a level for the row; AT-157 traced to AB-023; id retired |
| R32 | AB-202 WRONG minor: empty cells | applied | TCL G3 (Trinity p.89, found verbatim); tracks core, classical; plus FB 3B motive and sequence and FB 4 patterns and sequence (D07) |
| R33 | AB-203 WRONG minor: duplicates AB-100 and AB-105; its recognition belongs with AB-204 | changed | joined AB-105, not AB-204: the brief names AB-100 and AB-105, and a learner who plays I-IV-V7 in a key can name the notes of its I, IV and V triads; TCL G4 and G5 levels added (Trinity p.89, found verbatim); inversions marked written work; AT-167 traced to AB-105; id retired |
| R34 | AB-204 WRONG minor: empty cells | applied | filled: RCM KH9-10 (RC-084), ABRSM Theory G5 cadences as a level reference only, PM G7-8 (AT-176); RC-084's quote found verbatim in the RCM Theory syllabus p.33 |
| R35 | AB-205 WRONG minor: empty cells | applied | filled: TCL G4 (Trinity p.89, found verbatim) |
| R36 | AB-206 WRONG minor: empty cells; unsourced "use them to learn and memorise it" | applied | filled: TCL G5, KH9, KH10 (RCM Theory pp.33, 35, found verbatim), FB 2B and 3A forms (D07); the unsourced clause removed |
| R37 | AB-207 WRONG minor: empty cells; "let them shape the performance" is AB-063 | applied | filled: TCL G5, LCM musical awareness G1-8; clause removed |

## 2. Merge calls (the 12 of section 8.1; rows.md section 2 and missing.md section 2.2)

| # | merge call | outcome | what was done, or why not |
| --- | --- | --- | --- |
| M01 | AB-083, three minor forms in one row (both agree) | applied | stands; recorded in 8.1 |
| M02 | AB-082, scales with hands, range and articulation as parameters (both agree; missing.md's condition) | applied | stands; the condition holds (the parameters cell names hands separately, then together, by level); recorded |
| M03 | Chords block/broken, arpeggios split (both agree; rows.md: AB-203 should go) | applied | stands; AB-203 joined AB-105 (R33) |
| M04 | AB-046, hands and position in one sight-reading row (both agree; missing.md: reading ahead and leaving out are separate) | applied | stands; AB-227 and AB-228 added (N20, N21) |
| M05 | AB-023, clefs and range merged (both agree; rows.md: AB-201 joins it) | applied | stands; AB-201 joined (R31) |
| M06 | Metre split four ways (both agree) | applied | stands |
| M07 | AB-147 (rows.md agree; missing.md split) | applied | the owner's decision 5: split; AB-147 keeps call-and-response and the RCM period answers; AB-233 holds the Keyboard Harmony consequents with a bass (RC-076 KH9-10, RC-077 KH10; RCM Theory pp.32, 34, found verbatim) |
| M08 | AB-141 apart from AB-139 (rows.md disagree in part; missing.md agree) | applied | the owner's decision 6: major 7, minor 7 and dominant 7 moved into AB-139 (title, parameters, jazz track); AB-141 keeps function, substitution and modes; ST-144 stays traced to AB-141 |
| M09 | AB-154, composition craft rows as parameters (both agree) | applied | stands; writing-down citations removed (R25) |
| M10 | AB-131, dynamics, articulation and tempo by ear (both agree) | applied | stands; AB-134's clause removed (R24) |
| M11 | AB-195 (rows.md agree conditionally; missing.md split) | applied | the owner's decision 4: split into AB-195 (play a written accompaniment with a soloist, or with people singing from the hymn book) and AB-234 (accompany a singer from chord symbols). ST-123 (hymn singing and choirs from the written score) placed in AB-195: my reading, because its notes come from a written part; ST-127 traced to AB-234, supported by two newly verified quotes (Hal Leonard *Piano for Singers*, PianoGroove) |
| M12 | AB-062 kept as its own row (both agree) | applied | stands |

## 3. Mapping findings (`rows.md` section 3, and the brief)

| # | finding | outcome | what was done |
| --- | --- | --- | --- |
| P01 | A2.1 has AB-105 in part | applied | AB-105 maps to A2.1 in part; section 5 shows it |
| P02 | A7g.1 has AB-116 in part | applied | AB-116 maps to A7g.1 in part; section 5 shows it |
| P03 | A7a.2's blues-intro gap closes (AB-175) | applied | AB-175 extended; section 5's unsupported cell updated |
| P04 | A7b.1's support is not weak (AB-163) | applied | AB-163 mapping no longer weak; section 5 updated |
| P05 | A10.1's two-feel bass has a source (Berklee Jazz lesson 6) | applied | the topic found verbatim on the Berklee course page; added to AB-171 (now a two-feel, then walking in four); AB-171 maps to A10.1 for both |

## 4. Document-level findings

| # | finding | outcome | what was done, or why not |
| --- | --- | --- | --- |
| D01 | Section 7 still counts 200 abilities and 130 NEW (rows.md) | applied | section 7 regenerated by script: 230 abilities, 146 NEW, 7 full, 77 in part, trace checked |
| D02 | Section 4's heading calls the kept rows BORDERLINE (rows.md) | applied | section 4 retitled "Rows answered by clapping, tapping, singing or saying (kept; formerly BORDERLINE)"; AB-126 and AB-127 removed; section 1.I heading fixed the same way |
| D03 | Section 5 says A8.1's support is all BORDERLINE (rows.md) | applied | A8.1's cell now says the rows are kept by the 2026-10-08 decision |
| D04 | Section 5 says A5.1's rows AT-168, AT-172, RC-084, RC-085, ST-167 are dropped (rows.md) | applied | A5.1 now lists AB-204 and AB-205 in part and names those rows as reinstated |
| D05 | Section 5 says AT-023 and ST-165 are dropped while AB-154 cites them (rows.md) | applied | now consistent: both dropped (R25) |
| D06 | Section 3 is headed "Dropped" over rows now reinstated (rows.md) | applied | section 3 split into the 7 draft rows actually dropped and a table of the 21 reinstated rows with the row each is now in |
| D07 | Faber chart levels missing from every row: binary and ternary form 3A, motive and sequence 3B, 12 major and minor triads 3B, cadences Level 5, circle of fifths Level 5 (rows.md) | changed | four applied, each found verbatim on the chart: 3A form to AB-206 (with 2B "AB and ABA Coda", which I added from the same page), motive and sequence 3B to AB-202 (with Level 4 "Patterns and sequence"), the 12 triads 3B to AB-100 (with 3B inversions), cadences L5 to AB-105. Circle of fifths not applied: the chart lists it as a concept, and no row plays it at the keyboard; knowing it away from the piano is out of scope |
| D08 | Stale header count ("207 abilities", "unchecked") and the scope bullet calling score analysis dropped (brief) | applied | header, "What this is" and the scope bullet rewritten; a column note explains the closed BORDERLINE category and the "Pass 1:" notes |
| D09 | Berklee strings whose page wording changed, in rows rows.md judged OK (rows.md, method note) | not applied | those rows are OK in rows.md (meaning holds); only AB-155's changed wording is noted in its row, since that row was being edited anyway |
| D10 | 11 Schott quotes read only through the fetch tool, not verbatim-checked (rows.md, method note) | not done | outside this brief's list; Schott refuses curl (rows.md: HTTP 403); they stay unverified, as rows.md says |
| D11 | missing.md's possible merges among the proposals (N03 with N04, N20 with N21, N15 with N16) | applied | kept apart, as missing.md itself recommends (a learner can do one of each pair without the other); recorded in 8.1 |
| D12 | missing.md section 3.2, ten items considered and not proposed, each with a covering row | applied | no change needed; the covering rows exist (AB-109's "at sight" was not changed) |
| D13 | Rename GAP to open research items (the owner, relayed) | applied | section 6 retitled with the owner's wording; GAP-01 to GAP-07 renumbered OPEN-01 to OPEN-07; every reference in the list updated (section 5's cells no longer cite GAP numbers; the only "GAP" left is section 6's note saying what the old names were) |

## 5. Proposed new rows N01 to N25 (`missing.md` section 1)

Every quote below was searched in the downloaded text; "found" means found verbatim by `build/find.py` on 2026-10-08.

| # | proposal | outcome | new row | quote check |
| --- | --- | --- | --- | --- |
| N01 | slow practice, tempo raised in small steps | applied | AB-208 | found, musiciansway.com/blog/2013/07/increasing-tempo-in-practice/ |
| N02 | hands separately, then together | applied | AB-209 | both found: help.pianoadventures.com teaching-tips; Chang II.7 (readthedocs). Their difference (Faber for some students; Chang's discussion of skipping it) kept in the row, with two further quotes, both found |
| N03 | isolate a hard spot, practise the joins | applied | AB-210 | both found: Chang II.8; musiciansway.com increasing-tempo-in-practice |
| N04 | fix a mistake in practice | applied | AB-211 | found, musiciansway.com/blog/2018/06/managing-mistakes/ (and "differ radically", found) |
| N05 | practise in variants | applied | AB-212 | found, musiciansway.com/blog/2016/12/7-deep-practice-strategies/ |
| N06 | record and listen back | applied | AB-213 | found, same page (plus "listen back with a critical ear", found) |
| N07 | start from any landmark | applied | AB-214 | found, Chang III.6 (readthedocs) |
| N08 | mock performance | applied | AB-215 | found, musiciansway.com 7-deep-practice-strategies |
| N09 | count in | applied | AB-216 | found, studybass.com/lessons/meter/counting-off-songs/ |
| N10 | keep one's place, re-enter when lost, follow cues | applied | AB-217 | both found: jazzbooks.com V26ES.pdf (PDF p.3); en.wikipedia.org/wiki/Head_(music). "The tag" dropped from the title: neither source names it |
| N11 | leaps | applied | AB-218 | found, trinityrock.com/instruments/keyboards/grade2 |
| N12 | two against three | applied | AB-219 | both found: trinityrock.com grade7; en.wikipedia.org/wiki/Polyrhythm |
| N13 | pedal depth (half, flutter) | applied | AB-220 | **replaced**: missing.md's quote is not on the page (the page reads quarter, half and flutter pedal "are also ways to change the timbre"); replaced by two verbatim quotes from the same page, hub.yamaha.com piano-pedagogy-pedaling, both found; quarter pedal added to the row |
| N14 | sostenuto pedal | applied | AB-221 | found, melaniespanswick.com/2021/07/04/exploring-the-sostenuto-pedal/; "advanced" kept only as missing.md's reading (the source states no level) |
| N15 | trill | applied | AB-222 | found, Chang III.3 (readthedocs) |
| N16 | tremolo | applied | AB-223 | both found: trinityrock.com grade4; Chang III.3 |
| N17 | glissando | applied | AB-224 | found, trinitycollege.com/resource?id=7900, PDF p.38, in the Grade 2 column (read in the page text) |
| N18 | silent finger substitution | applied | AB-225 | found, en.wikipedia.org/wiki/Finger_substitution |
| N19 | rubato | applied | AB-226 | both found: ABRSM 2025-26 practical syllabus PDF p.60 (the criteria table is headed Initial to 8); en.wikipedia.org/wiki/Tempo_rubato |
| N20 | read ahead | applied | AB-227 | found: Faber Music Harris guide PDF p.8, and its contents p.3 for the Pre-Grade 1 and Grade 7 stages; practisingthepiano.com sight-reading tips |
| N21 | leave out notes to keep the pulse | applied | AB-228 | found, practisingthepiano.com sight-reading tips |
| N22 | page turns | applied | AB-229 | found, ABRSM 2025-26 PDF p.13 (and the Grades 6 to 8 page-turner sentence, found) |
| N23 | piano-vocal-guitar score | applied | AB-230 | found, help.praisecharts.com what-does-pvg-stand-for |
| N24 | learn a song by ear from a recording | applied | AB-231 | found verbatim in the Wayback Machine copy of open.edu Teaching secondary music 3.4 (the live page refuses curl, HTTP 403); the copy shows the words are Lucy Green's, in an interview transcript. The row says the tonic-bass-chords-tune order is not in the source |
| N25 | choose a key for a voice | applied | AB-232 | found, pianogroove.com working-with-singers-tips. "Giving the starting note in the introduction" dropped from the title: the source does not say it (AB-194 holds giving the key in an introduction) |

No N row is UNSOURCED. Level ranges are missing.md's, checked against the sources where a source gives one (N11, N12, N16, N17, N19, N20, N22); the rest say "no level stated by the source".

## 6. Open research items (were GAP-01 to GAP-07) and the unsourced candidates

| # | item | outcome | what was done |
| --- | --- | --- | --- |
| O01 | OPEN-01 practice method (missing.md: missing, N01 to N08) | applied | closed: AB-208 to AB-215, in scope by the owner's decision 1; planning away from the keyboard stays out |
| O02 | OPEN-02 ensemble functions (missing in part: N09, N10) | applied | closed: AB-216, AB-217; trading fours and guitar keys covered by existing rows, as missing.md says |
| O03 | OPEN-03 physical and rhythmic demands (missing: N11 to N13, N15, N16; also N14, N17) | applied | closed in part: AB-218 to AB-224; repeated notes stay AB-018 (the Trinity "faster repeated notes" line found, PDF p.39, not p.38 as missing.md says); three against four and hemiola stay open (OPEN-09, OPEN-10) |
| O04 | OPEN-04 piano-vocal-guitar score (missing: N23) | applied | closed: AB-230 |
| O05 | OPEN-05 carols (covered) | applied | marked covered by AB-193, AB-194, AB-195 and AB-232 |
| O06 | OPEN-06 sources not read (resolved in part, rest open) | applied | the read and still-unread sources listed as missing.md gives them; stays open |
| O07 | OPEN-07 reading ahead (missing: N20, with N21) | applied | closed: AB-227, AB-228 |
| O08 | Unsourced: blocking broken-chord passages (missing.md 3.1) | applied | listed as OPEN-08 with what was searched; no row |
| O09 | Unsourced: three against four | applied | OPEN-09; no row |
| O10 | Unsourced: hemiola | applied | OPEN-10; no row |
| O11 | Unsourced: learning from falling-notes videos | applied | OPEN-11; no row |
| O12 | New: no source states the playing demands of the period styles (AB-073 to AB-076) or of a reduction (AB-079) | applied | OPEN-12 added, so the restated rows are not mistaken for sourced demands |

## 7. Things I noticed that no finding names (not changed)

- The ten draft rows the 2026-10-08 reinstatement folded into existing rows (AT-159 to AT-165, AT-171, AT-173, AT-174) appear in their rows' sources cells only as "citation in its draft". Their level cells are not carried into the "level range by source" column, as the list's own column rule asks. The trace is complete. Not changed: no finding names it, and filling the cells would add levels nobody has checked.
- AB-202 still ends "and use them to learn it", a clause no member source states (the same kind as the clause removed from AB-206). Not changed: rows.md did not flag it.
- The edit removes 158 lines from the list (sections 3 to 8 rewritten). That is more than the 150-line threshold of `.claude/hooks/diff-growth.js`; it is a deliberate rewrite, not a reformat (the file keeps its CRLF line endings).

## 8. Counts

Abilities and draft rows were taken by script (`build/before.py`, `build/apply2.py`) over the list before and after. Outcomes were counted by script over the outcome column of sections 1 to 6 of this file (the command is below the table).

| count | value |
| --- | --- |
| abilities before (rows in section 1) | 207 (AB-001 to AB-207; the old section 7 said 200) |
| abilities after | 230 |
| ability rows removed | 4: AB-126 and AB-127 dropped (the owner); AB-201 joined AB-023 and AB-203 joined AB-105 |
| ability rows added | 27: AB-208 to AB-232 (N01 to N25), AB-233 (split from AB-147), AB-234 (split from AB-195) |
| check: 207 - 4 + 27 | 230 |
| draft rows dropped, before / after | 2 / 7 (added: AT-144, AT-145, RC-055 by the owner; AT-023, ST-165 under FABLE section 2) |
| draft rows traced | 482 of 482, each once |
| existing-ability match, before (full / in part / NEW) | 7 / 65 / 135 |
| existing-ability match, after (full / in part / NEW) | 7 / 77 / 146 |
| findings in this file | 104: 37 row verdicts (R), 12 merge calls (M), 5 mapping (P), 13 document-level (D), 25 N rows (N), 12 open items and candidates (O) |
| findings by outcome, all sections | applied 92; changed 10; not applied 1; not done 1 |
| by section | R: applied 28, changed 9. M: applied 12. P: applied 5. D: applied 10, changed 1, not applied 1, not done 1. N: applied 25 (of which 1 with its quote replaced, N13, and 1 found in an archived copy, N24; 0 UNSOURCED). O: applied 12 |
| quote checks for N rows | 25 rows: 23 found verbatim on the live page or PDF, 1 replaced by a verbatim quote from the same page (N13), 1 found verbatim in the Wayback Machine copy (N24); 0 UNSOURCED |

Outcome counts from: `grep -E '^\| [RMPDNO][0-9]{2} \|' applied.md | cut -d'|' -f2,4 | sed 's/ //g' | sed -E 's/^([A-Z])[0-9]+\|/\1 /' | sort | uniq -c`, which gave D applied 10, D changed 1, D not applied 1, D not done 1, M applied 12, N applied 25, O applied 12, P applied 5, R applied 28, R changed 9.
