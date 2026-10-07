# Intake: St Louis Blues (Berkman style)

Item: song.classical.st-louis-blues.pdmx (content/sources/pdmx.json, the row at :19781; title in the catalogue "St. Louis Blues (1914)")
Source: PDMX CID QmYutJi8H9KmexPTGDuRXTzQNkqnu1Jk8ERW1gZiMs33ZG (archive record 14648209, member mxl/16/46/QmYutJi8H9KmexPTGDuRXTzQNkqnu1Jk8ERW1gZiMs33ZG.mxl; MuseScore 821091) | content/scores/pdmx/QmYutJi8H9KmexPTGDuRXTzQNkqnu1Jk8ERW1gZiMs33ZG.mxl
CSV facts: title "st louis blues" / song_name "St. Louis Blues" / composer "NA" / artist "W. C. Handy" / tracks 0 / bars 52 (the file has 28) / rating 4.49, 3 ratings, 1585 views / dedup flag True / genres "classical" / license cc-zero. Metadata: orders work, decides nothing
Asset shape class: lead_sheet (analyse: LEADSHEET; parts 1, "Piano", program 0; staves [1]; 23 <harmony>)
Editions compared: NOT RUN - this short record serves one claim (bars 1-4, the quick IV); no edition scan was made for St. Louis Blues

Checks
G1 parse and normalise: PASS - quarry.py gate 1, the same two-row command as intake/Qmdyj1mGLEBPPF13XMNXh6Z3ntb3vSMRK3hrbmSw3Bk6gs.md - converted 28 bars, 115 notes, 1 staff (single line), tempo 96 defaulted; converted sha256 e41004fe86dacdca366b5a069b8b4d0efadead023666d9a9a5a91b27ae4147e6, equal to the committed file and to convertedSha256
G2 not empty: PASS - quarry.py gate 3 - 28 bars, 115 notes
G3 not truncated or corrupted: PASS - quarry.py gates 2 and 4; gates_stj.py: 173 (bar, staff, pitch) entries on the raw and converted files, equal
G4 pitched notation: BY HAND - gates_stj.py element counts - 0 `<unpitched>`, 0 percussion clefs; one clef, G2; one part, "Piano"
G5 parts and staves from the XML: PASS - quarry_core.analyse on the raw bytes - 1 score-part, program 0, one staff, 4/4, fifths 4, 23 harmony, 28 bars
G6 asset shape: BY HAND - the mapping table - LEADSHEET is lead_sheet; no `<lyric>`
G7 supported shape: BY HAND - lead_sheet is supported
G8 note, time and bar structure: PASS - quarry.py gate 3 (28 bars, 4/4, tempo 96 defaulted). Finding, not a gate failure: the words "A loose Swing Blues", "B Gritty New orleans dirge, heavy triplet feel" and "D.C. al Fine", and no Fine mark in the file; a forward repeat at bar 1 and a backward repeat at bar 12; music21's expandRepeats refuses the stream; the app's render of the former identity counted 80 measures from 28 (G10)
G9 piano range: PASS - quarry.py gate 3 (the melody spans A3-C5)
G10 render, readback, cursor, round trip: NOT RUN on this identity (as for Qmdyj). Former identity only (2026-09-14, former_identities.json:580, sha256 c53d25a4...): the main checkout's build/render-report.json (2026-09-18) says ok, 316 steps / 316 cursor steps, 80 measures from 28 source measures, no console error
G11 identity: PASS (tool MATCH) - quarry_core.identity("st louis blues", ["handy", "w. c. handy"]) says MATCH, "creator alias 'handy' found"; credit words "St Louis Blues  (Berkman style)" and "AABA": an arrangement, not Handy's 1914 print, whatever the catalogue title says (recorded, not traced)
G12 edition duplicates: PARTIAL - quarry.py duplicate_of = null against the main checkout's built catalogue; no edition family read
G13 provenance and checksums: PASS - the archive member's sha256 d3e5a851099883b46adbc214c8244298344cad1cc4a21ba10263a2abe970c3b6 (scan_stj.py, one streaming) equals rawSha256 and quarry.py's raw_sha256; the committed file's sha256 e41004fe86dacdca366b5a069b8b4d0efadead023666d9a9a5a91b27ae4147e6 equals convertedSha256 and the quarry's reconversion
G14 build-valid, openable item: PARTIAL - build.py not run in this lane (refused by the session's permission check); the main checkout's built catalog.json (2026-10-07 07:59, this identity) carries the item: level 3.03 (estimated), hands right, tempoBpm 96 (tempo-defaulted), keySig "4 sharps", notation bars 28, chordCount 23, chords A7 B7 E E7 Emi7 F♯mi, swungMark true
G15 cut fidelity: NOT RUN - the record names bars 1-4 (`song.classical.st-louis-blues.pdmx@bars=1-4`) as a reference on the Chord chart, which opens the whole item; no excerpt is cut

Excerpt: none cut (the chain names bars 1-4 in a lesson)
Reason for the cut: no cut. Option not taken: an excerpt of bars 1-12. Bars 1-12 are a whole twelve-bar with the quick IV (Claim checks), which a placement may prefer to bars 1-4; that is a decision for the record, not this gate
Claim checks (second step, not the gate): readers and rule as in intake/Qmdyj1mGLEBPPF13XMNXh6Z3ntb3vSMRK3hrbmSw3Bk6gs.md (roman figures in E major). Identities raw d3e5a851099883b46adbc214c8244298344cad1cc4a21ba10263a2abe970c3b6 and committed e41004fe86dacdca366b5a069b8b4d0efadead023666d9a9a5a91b27ae4147e6: A and B agree on all 23 symbols in each file, and the files agree symbol for symbol (harmony-stl-raw.json, harmony-stl-committed.json)
Claim checks (second step, not the gate): bars 1-4: 1 E (major triad E-G♯-B, I) | 2 A7 (A-C♯-E-G, IV7: the quick IV) | 3 E, B7 at 2 (B-D♯-F♯-A, V7) | 4 E. AGREE, both readers, both files
Claim checks (second step, not the gate): bars 1-12 under the repeat: E | A7 | E, B7 at 2 | E | A7 | (no symbol: A7 carried) | E, B7 at 2 | E | B7 | (B7 carried) | E, E/G♯ at 2 | B7: a twelve-bar blues in E with the IV in bar 2 and V in bars 9 and 10. Bars 13-28: Em7 at 13, 21; B7 at 15, 20, 23, 28; Em7, F♯m at 2 in bar 19; E7, E/G♯ at 2 in bar 27. AGREE, both readers
Claim checks (second step, not the gate): the consumer: chartSegments gives 28 bars, no conflict; today's chartBars drops bar 3's B7 (and the second symbol of bars 7, 11, 19 and 27); bars 1, 2 and 4 show E, A7, E as written

History: one former identity: sha256 c53d25a4f014ae88194c5e9aebb15060e1f1c00059882465eb9ade4a7d4330c5, dated 2026-09-14 (tools/content/former_identities.json:580), committed in 2aef1c0d (2026-09-15); replaced in e9aa34fd (2026-10-01, E59's tempo transform). No retirement
Personal library admission: RE-ADMITTED - 2026-10-07, song.classical.st-louis-blues.pdmx (G1-G9, G11, G13 re-checked; G10 and G14 not run on this identity)
Curriculum admission: CANDIDATE - blues.6, optional transfer with no song credit, for the quick IV (A7a.3 step 13; docs/review/responses/a7a-drafts.md section 5); placed today on blues.3 and blues.4. No D2 event id
Public export: out of scope (owner decision 2026-10-05); not a gate, not recorded as a decision
By hand: G4, G6, G7, G11's credit reading; by the A7a.3 probe builder
Unverified: not heard; the arranger ("Berkman style") and how far the arrangement's harmony is Handy's; the D.C. al Fine with no Fine; the chart's sound (unverified as music)
