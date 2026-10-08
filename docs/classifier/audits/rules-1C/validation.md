# Rules for area 1.C: validation of the corrected rules (2026-10-08)

**What this is.** The one validation pass on `docs/classifier/rules/area-1C.md` as corrected (input fixed at origin 485f2be2), after the check (`rows.md`) and its application (`applied.md`). Every rule is re-run on its named examples, on every case the check showed failing, and on plausible counterexamples (lessons-chunk1 items 1, 2 and 9); every threshold's basis is recounted. Only this file and the rules page were edited. Nothing was heard.

**How it was run.** The catalogue (`app/public/content`, 2,020 score files) was copied from the main checkout into this worktree's `build/v1c/content`; the main checkout's `content/scores/pdmx` and `content/sources/pdmx.json` were read in place, never written. Scripts in `build/v1c/` (not committed), run with the main checkout's `.venv` (music21 10.5.0, partitura 1.9.0), each an independent implementation of the page's wording, not the writer's or checker's scripts:
- `sync.py` (the corrected `rhythm.syncopation` and `rhythm.ties`; `--all` over 2,020 items to `sync_all.json`, 4 fail to load: Bach Invention No. 1 PDMX, Ballade No. 1, *O mio babbino caro*, Sakamoto, all inside partitura's `load_musicxml`), `summ.py`, `sync_report.py`, `final.py`, `pick.py`, `dump.py`;
- `times.py`, `runs.py`, `bars.py` (signatures, barlines, words per bar); `tup.py` (every `<time-modification>` ratio and bracket); `values.py`, `where.py`; `cue.py`, `same.py`, `same_all.py` (cue size, and the held PDMX files against the app's); `cadenza.py`; `cells.py`, `hemiola.py`, `clave.py`; `runrules.py` (`tools/classifier/rules/rhythm.py` `shuffle` and `secondary_rag`); `misc.py`, `rawmisc.py`, `rawbar.py`, `sixfour.py`, `catq.py`, `loadtest.py`; `count_page.py` (the counts below).
- music21 `TimeSignature.getAccentWeight` measured by import on 12 metres (2/4, 3/4, 4/4, 2/2, 3/8, 6/8, 9/8, 12/8, 6/4, 5/4, 7/8, 3/2).

"Measured" below means one of these, run 2026-10-08. Bar references are 0-based indices ("idx") unless marked "no." (the MusicXML measure number).

## 1. Premise findings that change several rules

1. **The held "original uploads" are the app's own files.** All 544 files mapped by `content/sources/pdmx.json` match their `convertedSha256`, none their `rawSha256`, and all 544 are byte-identical to the app's file for the same id (`same_all.py`). The originals are not held. Section 0 of the page, `rhythm.cadenza`, `rhythm.silence` and `rhythm.values` state the opposite.
2. **The app's files keep cue size.** 26 app files carry `<type size="cue">` (14 PDMX, 12 rep: Ballade No. 4 PDMX 118, the Fantaisie-Impromptu PDMX 256, *Malagueña* 107, *O mio babbino caro* 144, Liebestraum No. 3 368, *La Campanella* 388, Ballade No. 1 89 ...; `cue.py`), and the held "source" shows the same notes with the same marking (`rawbar.py` on Ballade No. 4 no.50 and the Fantaisie-Impromptu no.5). The check's finding N1 ("the re-export makes cue-size notes full size") and the page's "no cue notes in any of the 519 files" are false as measured; `lessons-chunk1.md` item 6 repeats N1 (that page is not edited here; a finding for the orchestrator).
3. **music21's accent weights are not the page's numbers, but their order is.** Measured: 4/4 [1, 0.25, 0.5, 0.25]; 2/4, 6/8 [1, 0.5]; 3/4, 9/8, 3/2 [1, 0.5, 0.5]; 5/4 and 7/8 every non-downbeat beat 0.5; 12/8 as 4/4. The page's table (downbeat 1, beat 3 of four 0.5, other beats 0.25) gives the same order of beats in all 12 metres, and the rules only compare weights, so the outcomes are the same; the page's sentence "0.5 there and less elsewhere" is wrong for two-, three-, five- and seven-beat bars.

## 2. Every rule (30)

| id | status | what was run, on which items | result |
| --- | --- | --- | --- |
| notation.times | failing | `times.py`, `runs.py`, `bars.py` on the Bagatelle, Radetzky, Op. 9 No. 2, *Super Mario Land 2*, and the 49 items with a signature change | Pair clause right on the Bagatelle (idx 8-9 1/4+1/8 at a repeat; idx 26-27 and 35-36 too) and on Mozart K. 1e (three 2/4 bars each followed by a 1-beat bar: 2+1 = 3/4) and K. 1f; final-bar clause right on the Bagatelle idx 60. Words clause right on Op. 9 No. 2 idx 33-36. **Wrong:** the "one-bar signature longer than the bars around it" clause makes measured one-bar changes into cadenza bars and drops them from the changes of metre: *Mariage d'amour* idx 2 (5/4, running sixteenths; 5/4 again at no. 7, 21, 25, 50), *Scarborough Fair* piano solo idx 101 (one 4/4 bar of quarters and eighths in 3/4), *The Lonely Man* idx 3 (5/4, chords and eighths), *Holy, Holy, Holy* idx 15 (the final 6/4 bar, a dotted-whole chord). **Undecidable:** "a one-bar pickup to a new section" has no code test; Radetzky's 1/4 bar idx 71 has no barline, repeat, key change or words in idx 60-80 (measured, the check's open point), while *Rêverie* idx 74 (3/4) and *Wake Me Up* idx 19 (3/4) are single short bars at boundaries that are not pickups. Wording: the bar after a device (the return to 3/8) is literally "a bar whose signature differs from the one before". |
| metre.class | uncertain | `rawmisc.py` on the named items; music21 by import; `sixfour.py` on the 11 files with 6/4 or 12/4 | The table classes 7/8, 12/8, 6/8, Für Elise's 3/8 and Moonlight I's ¢ 4/4 as the page says. Open (T49): no route gives a 6/4 grouping in any of the 11 files (`metre.grouping` reads beams only with denominator 8 or 16, and none of the 11 has counting words), so every 6/4 bar falls to compound duple, Debussy's *Cathédrale* included, which the page reads in three halves. |
| mark.anacrusis | validated | `rawmisc.py` on the 5 named items | *Away in a Manger* first bar 1 quarter of 3; *Alexander's Ragtime Band* 2 of 4; Für Elise 1 eighth of 3/8; *Oh! Susanna* and *Clair de lune* (beginner) full first bars (late entries, the near-misses). T51 has no case to run on (the check's count of 0, not re-run). |
| rhythm.values | validated | `values.py` over 2,020 files; `where.py`, `rawbar.py` on the bars | 512ths 29 in 4 files (5 of them cue size), 256ths 15 in 3, 128ths 11 in 4 (Black Bottom Stomp 3, Prelude Op. 28 No. 15 4, *Ain't Misbehavin'* 1, Yanni 3): the check's counts. The writer's five files are the union of the 512th and 256th files (reconciled). Every sub-128th value sits in a bar that also carries a quantisation ratio (Prelude No. 15 no. 4-5, 23-24; *Ain't Misbehavin'* 12-13, 23-24; *O mio babbino caro* 50-52; *Malagueña* 61, 69; Ballade No. 4 156-157); none in rep or generated files. Text wrong: Ballade No. 4's three 512ths are a 512th rest at a 5:4 ratio at no. 156-157, not the bar-50 fioritura, and the app keeps cue size (section 1). |
| rhythm.dotted-quarter | validated | `misc.py dotted` on the 4 named items | 4 dotted-quarter-eighth pairs; Für Elise 12 dotted-eighth-16th pairs; the 6/8 drill's 7 dotted quarters all in 6/8 bars (beat-length, excluded by the metre); the long-short 6/8 drill has no dot. |
| rhythm.ties | uncertain | `sync.py` on the named items and the catalogue | Tied-across-bar: 2 chains, both from a weak beat (beat 4 into the bar, beat 3 over the bar); the tumbao (`latin-groove.a.son-3-2`) 7 from a weak beat; Waltz Op. 69 No. 2 23; *Cielito lindo* 12; *Alexander's Ragtime Band* 9 from off the beat; `secondary-rag.c.4bar` 1; `ii-v-i.a` 0 (chords tied from the downbeat). Inner chains (applier's choice 1): of 7 items whose only syncopation-shaped chains are inner, read: Bach Prelude in C (the held inner E, no syncopation), *I Got Rhythm* (inner members of a chord whose top note is found as held anyway), Mazurka Op. 68 No. 4 (inner suspensions), Prelude Op. 28 No. 7 (none syncopated on the line); no melody in an inner voice was found or looked for. Open: final notes (as `rhythm.syncopation`): Ode to Joy (easy) and *Sakura* end on a note from beat 3 tied into the last bar, counted from a weak beat. Counts under the corrected rule in the table below. |
| rhythm.syncopation | failing | `sync.py` on every failed case, the named items and counterexamples; `--all` over 2,020 items (`sync_report.py`, `final.py`) | **Found, every case the check showed failing:** tied-across-bar (beat-level held, idx 0 beat 4 and idx 2 beat 3), sixteenth (held at the subdivision idx 0, twice), *Åse's Death* idx 7 beat 2 (both lines), the Vivaldi *Spring* simple arrangement idx 14, *Let It Snow* idx 2, Waltz Op. 69 No. 2 (23), *Cielito lindo* (both ids, 12), the tumbao (beat-level 7, held 8). Recipe cross-check: all 44 generated items whose concepts name syncopation and both `syncopation`-family drills (drill kind) are present (0 absent). **Rejected:** `ii-v-i` (36 items), Alberti, stride, oom-pah (8), scales (252), Hanon (60), arpeggio (120), boogie (36), walking bass (28): 0 present; Bach Prelude in C, BWV 999, `broken7`, `trill`, `repeated-notes`, `tremolo` only the silent-beat report; triplet quarters, *Joyful, Joyful*, the Handel Sarabande none. The weights' order is music21's (section 1). **Wrong:** (1) *Gnossienne* No. 1 (`satie-gnossienne-1`, no `<time>` in the file) gets 14 beat-level events from partitura's default metre; the rule needs UNKNOWN `unmetred`. (2) The bass-then-held-chord test (applier's choice 2) splits one figure: the Tarantella's left hand (bass on 1, chord on 2 tied over the bar) gives 4 bass-then-held-chord and 22 beat-level held events, the 22 being those whose bass is an octave, not "a single note"; and it fires in a right-hand melody (Mazurka Op. 68 No. 4 idx 32, 34). It is right on the PDMX *Gnossienne* No. 1 left hand (30) and on the generated studies' final cadence chords. (3) "Present" includes off-beat attack and bass-then-held-chord: 67 generated items (comping 46, clave 9, montuno 10 ...) and Mazurka Op. 68 No. 4 are present only by them. **Open:** a final note from a weak beat tied into the last bar decides presence in 3 items (*Kum ba yah*, the page's near-miss, now present; Ode to Joy easy; *Sakura*); the accent kind counts an accent on beat 3 of 3/4 and not on beat 2 (Mazurka Op. 17 No. 4: 15). sf/sfz/fz: partitura reads them as `ImpulsiveLoudnessDirection` (Moonlight III 49 and *Hall of the Mountain King* 39, equal to the raw counts); found on beat 4 (Moonlight III) and beats 2 and 4 (Mountain King); the Tarantella's 15 fz on downbeats give no accent. |
| rhythm.triplets | uncertain | `rawmisc.py`, `tup.py` | 3v2: 48 notes at 3:2; Black Bottom Stomp 372 (rests included; the page's 320 not reconciled); 6/8 eighths none; the Fantaisie-Impromptu's 6:4 not 3:2. Open (T52): group delimitation by bracket not run; 576 closed brackets hold fewer notes than their actual-notes because they hold long-short pairs or rests (Black Bottom Stomp 75), so a group cannot be required to hold three notes. |
| rhythm.tuplets-other | failing | `tup.py` over 2,020 files; `rawbar.py` | Kept, right: Polonaise Op. 53 29:20 (174 notes), Ballade No. 1 39:32, 28:16, 21:16, 29:16. Within 5 per cent of 1: 23:24, 40:39, 160:159, 80:79, 320:319, 48:47, 96:95, 160:157 (all in the artefact files) and 8:8, 2:2 (Ständchen, ratio 1); no printed ratio found within 5 per cent. **Wrong:** the 5 per cent bound leaves as tuplets 160:107, 80:53, 120:67, 48:43, 320:179, 320:301, 60:53, 640:321, 320:161, 15:14, 20:17 and 480:371 (*Malagueña*), 320:239 and 160:119 (*O mio babbino caro*), 24:17 and 40:37 (*Ain't Misbehavin'*), 12:11 (*Silent Night* trombone duet), and the irregular test (11+ actual notes) then passes the three-digit ones to `rhythm.cadenza`; the fewer-notes test misses the named 480:371 (a single half rest with no bracket, no.61) and flags 576 real brackets (Black Bottom Stomp's sixteenth-eighth triplets, Chopin's Prelude Op. 28 No. 1 figures with rests, Op. 15 No. 2's 5:4). |
| rhythm.cadenza | failing | `cadenza.py` over 2,020 files (each item's own file); `cue.py`, `same_all.py`, `rawbar.py` | Found: Ballade No. 4 PDMX no.50 (14 cue notes; also no.120, 135-136), Op. 9 No. 2 "Senza tempo" no.33, Berceuse 9 grace notes no.44 and 11:8 no.43, Polonaise Op. 53 29:20 no.46, 78, Op. 9 No. 1 11:6, Prelude No. 18 11:8, Liebestraum No. 3 cue runs no.25, 60, *Malagueña* cue runs no.61-69 beside "a piacere" no.70; grace runs of 6+ also in Moonlight III (alt) no.188 (30). **Wrong:** the cue route reads a "source" that is the app's file (section 1) and answers UNKNOWN for items with no mapped source (applier's choice 3), which is every rep item, though 12 rep files carry cue notes (Liebestraum No. 3 368, *La Campanella* 388); the named positive Fantaisie-Impromptu no.5 is a cue half and quarter in the left hand, and the cue route gives 40 candidate runs in a piece with no cadenza (a near-miss for the agent, not a positive); the irregular route receives the artefact ratios of `rhythm.tuplets-other`. Word list: 9 items, one non-time use ("Pedal Freely", Mabinogi). |
| rhythm.repeated-notes | validated | `misc.py repeated` | Asturias right hand longest run 96; Prelude No. 15 left hand 56; `repeated-notes.c.4x.right` 4; Alberti left hand 0 pairs. |
| rhythm.equal-stream | validated | `misc.py stream` | Hanon 20 241 sixteenths; Prelude No. 2 384 and 408; Étude Op. 10 No. 1 75 from quarter 160.25 (bar 41); Ode to Joy 3; Prelude in C 15 per hand, 529 merged. |
| rhythm.habanera | validated | `cells.py` on 13 named items | Right-hand 2/4 cell as a pattern: *Chrysanthemum* 14, *Cleopha* 11, *Country Club* 4, *Die wilden Hühner* 21, Bizet 26; left hand: Bizet 85, *Carioca* 22, *El Choclo* 9, *Solace* 49, *La Cumparsita* 7, `bass-cell.habanera.c` 8; *Auld Lang Syne* doubled right hand 9 (left hand 0, not the page's 12); `tresillo.c` none. Code names "a habanera" only for the declared generated cells; every other occurrence goes to the agent, so no near-miss reaches a habanera claim. |
| rhythm.tresillo | validated | `cells.py` | `tresillo.c` left hand 8 (doubled); `clave.son-3-2` right hand 4; `tumbao.c` none; `bass-cell.habanera.c` none. Example wrong: *La Cumparsita* holds the habanera cell (left hand 7) and no tresillo bar. |
| rhythm.cinquillo | validated | `cells.py` | *The Entertainer* right hand 7 (idx 58, 66, 75 ...); *Cascades* 11 (page 10); *Chicken Reel* 4 (idx 74-75, 78-79); *Chrysanthemum* 2 scattered; the study 1 bar. Naming goes to the agent. |
| rhythm.secondary-rag | validated | `runrules.py secondary_rag` | 12th Street Rag 10 bars (both editions), *Memphis Blues* 6; `secondary-rag.c.4bar`, Moonlight I, Prelude in C, *Elite Syncopations* 0. |
| rhythm.shuffle | uncertain | `runrules.py shuffle`; `catq.py` | The style field is `tracks` (looked up). Black Bottom Stomp 29 triplet bars, track blues-boogie: shuffle, right. Op. 55 No. 2 21 bars of 12/8 pairs, track classical: no claim, right. **Example contradictions:** *Ain't Misbehavin'* (a named shuffle positive) has 14 marked bars and no notated long-short pair; `exercise.meter.12-8` (named as no claim) has tracks blues-boogie and jazz and concepts shuffle, slow-blues, twelve-bar-blues, so the rule asserts a shuffle for it. Which is musically right for a 12/8 slow-blues drill no one here can hear. |
| notation.swing-mark | validated | `misc.py words` | `swing-pair.c` "Straight" no.1, "Swing: long, then late" no.6; shuffle eighths "Shuffle — ..."; *Lullaby of Birdland* "Med-Swing" (the regex matches); `boogie.a.pinetop` no words. |
| rhythm.backbeat | validated | `cells.py` | Accents kind: *I'm Blue* 6 bars. Onsets kind: *Light the World* left hand 26 bars (a single bass note on 2 and 4 under a held right hand: the agent's question, as the page says); *Blinding Lights* right hand 4, *Arabesque* left hand 4, *Tiger Rag* right hand 11, *Rêverie* left hand 3 go to the residual; `stride.c` none (afterbeat chords excluded); Fantaisie-Impromptu accents 4 bars (residual). |
| rhythm.hemiola | uncertain | `hemiola.py` | Two-bar: Boléro left hand idx 197, *La plus que lente* idx 115, 117; 6/8 as 3/4: *Song of Storms* left hand 12 bars; cross-grouped 3/4: *Carol of the Bells* medley right hand 45 bars, *Scarborough Fair* left hand 4; Sarabande none. Open: "alternate" is not defined (a cross-grouped bar beside one bar of the metre's own grouping gives 2 in each), and present-at-one-occurrence (T26) has no basis. |
| texture.polyrhythm | validated | `misc.py poly` | 3v2 3:2, 2v3 2:3, *Arabesque* 3:2 and 2:3, Fantaisie-Impromptu 4:3, waltz accompaniment 4:3 (the generator defect), Alberti none. Wording: "a span inside one already found is skipped" counts the pair and bar spans too (28 spans in 3v2 against the page's 16 beats); "containing" is meant. |
| rhythm.beat-onset-share | validated | `misc.py share` | Hanon 61 of 62; Für Elise 304 of 312; `ii-v-i.a` 3 of 16; *Hesitating Blues* 80 of 192. |
| mark.tempo-text | validated | `misc.py tempo` | Op. 10 No. 1 quarter = 176; *Scarborough Fair* 165; Asturias no metronome, `<sound tempo>` 144; 6/8 drill quarter = 80, 12/8 drill quarter = 76. |
| mark.tempo-change | validated | `misc.py words` | Op. 9 No. 2 "poco rit." no.10, "a tempo" no.11, "poco rubato" no.26, "Senza tempo" no.33 (page bar numbers one higher); *Malagueña* "accel. poco a poco" no.51; *Clair de lune* "Tempo rubato"; *La plus que lente* "Lent", "Mouvt", "Animez un peu" (the page's "Tempo animé" is not in the file) unclassified. |
| technique.velocity | validated | `misc.py velocity` | Hanon 20 3.89 a second at quarter = 60; Op. 10 No. 1 right hand 11.32, left 0.69 at 176; 6/8 drill 2.67 at quarter = 80 (bar length in quarters); Asturias no printed tempo. |
| technique.endurance | validated | `misc.py endurance` | Hanon 241 onsets, 62 quarters; Prelude No. 2 384 (96 quarters) and 408; Prelude in C short spans; 12/8 drill right hand 1 onset. |
| metre.grouping | validated | `rawmisc.py`, `misc.py words` | 7/8 beams 2+2+3 in bars 1-2 and "Count 2 + 2 + 3"; 5/4 "Count 3 + 2"; 6/8 drill beams 3+3; *Take Five* no counting words (UNKNOWN by code). The 12/8 drill's beams were not re-read (staff 1 holds chords only). |
| rhythm.silence | validated | `misc.py silence` | Swing-pair 4 beats at idx 4; *Weary Blues* 7.5 beats at idx 2; Scherzo No. 2 longest 9; clave gaps 1 to 1.5; *Doctor Gradus* 167.5 (the nonsense the integrity guard is for). The "other parts from the original upload" cannot be read (section 1): the rule's own fallback answers UNKNOWN for every item. |
| rhythm.bar-patterns | validated | `misc.py patterns` | Prelude in C top share 0.91 (34 bars); 7/8 1.0; Für Elise 16 distinct, 0.37; clave 0.5. |
| rhythm.clave-alignment | uncertain | `clave.py` (the page's scoring, reimplemented) | `clave.son-2-3` 2-3 in 4 of 4; `son-3-2` 3-2 in 4; montuno 3-2; `.pulse` left hand neutral; `tumbao.c` neutral; *Recado* 21 2-3, 3 3-2 (as the page). No repertoire item with a declared direction exists in the catalogue (ids searched for clave, son, salsa, mambo, bossa, samba, rumba, montuno, danzón: none declares one), and Mauleón is unread, so repertoire stays unverified. |

## 3. Every threshold (52)

| # | basis now | how |
| --- | --- | --- |
| T1 | open | Pair and final clauses validated (Bagatelle, Mozart K. 1e, K. 1f); the section-pickup clause has no code test (Radetzky unmarked; *Rêverie*, *Wake Me Up* single short bars at boundaries). |
| T2 | failing | Measured one-bar 5/4, 4/4 and final 6/4 bars called cadenza bars (*Mariage d'amour*, *Scarborough Fair*, *The Lonely Man*, *Holy, Holy, Holy*). Words clause right on Op. 9 No. 2. |
| T3 | sourced | Unchanged (OMT). |
| T4 | sourced | Unchanged. |
| T5 | sourced | Unchanged; named items re-run. |
| T6 | validated | Every sub-128th value in a bar with a quantisation ratio, 5 PDMX files, none elsewhere. |
| T7 | sourced | As an order of beats (music21 measured, section 1); the page's "less elsewhere" corrected. |
| T8 | validated | Re-run: Prelude in C, Étude Op. 10 No. 1 figuration gives no syncopation. |
| T9 | validated | Re-run: Prelude in C no rest kind. |
| T10 | validated | Re-run: triplet quarters none. |
| T11 | validated | Re-run: BWV 999, `broken7`, `trill` give only the silent-beat report. |
| T12 | failing | See `rhythm.tuplets-other`. |
| T13 | validated | Re-run: keeps 11:8, 13:8, 15:8, 29:20, 39:32; 9:8 (Ständchen, *Malagueña*) left out. Downstream of T12's failure. |
| T14 | validated | Re-run: runs of 6+ only in Chopin NIFC items and Moonlight III (alt) no.188 (30); PDMX app files none. |
| T15 | open | No published list read; 9 items found, one non-time use ("Pedal Freely"). |
| T16 | open | No source; a written-value bound, not a speed. |
| T17 | validated | Re-run on the named positives and near-misses. |
| T18 | sourced | Unchanged. |
| T19 | validated | Re-run: no near-miss reaches a habanera claim by code. |
| T20 | sourced | Unchanged. |
| T21 | sourced | Unchanged. |
| T22 | validated | Unchanged (`rules/rhythm.md`). |
| T23 | sourced | Unchanged. |
| T24 | validated | Re-run: `stride.c` none. |
| T25 | sourced | Unchanged. |
| T26 | open | No source, no counterexample test. |
| T27 | validated | Re-run (polyrhythm examples). |
| T28 | sourced | Unchanged. |
| T29 | sourced | Unchanged. |
| T30 | validated | Re-run: Asturias. |
| T31 | sourced | Unchanged. |
| T32 | open | Named abbreviations matched; no search for a non-tempo word caught. |
| T33 | open | No source or test. |
| T34 | validated | Re-run: 2.67 a second for the 6/8 drill. |
| T35 | validated | Re-run (endurance examples). |
| T36 | open | No source; the clave's own rests count as silences. |
| T37 | open | Reading only; consequence measured: no 6/4 grouping is reachable (T49). |
| T38 | validated | Re-run: 7/8 and 5/4 words. |
| T39 | validated | Re-run: swing words. |
| T40 | validated | On generated items only (re-run); repertoire open (`rhythm.clave-alignment`). |
| T41 | validated | Finds every failed case; rejects ties from strong beats (`ii-v-i`) and equal-weight holds (the Sarabande). Of the 1,165 generated items whose recipe declares no syncopation, 1,092 are absent; the 73 present are comping off-beats 46, the 4:3 waltz 5, the tresillo bass cell 1, riffs 4 and studies 7 (a half or dotted half on beat 2, or a final cadence chord), shaping 10 (the last note anticipated off the beat). Final held notes open (`rhythm.syncopation`). |
| T42 | sourced | music21's order of beats in 12 metres (section 1). |
| T43 | open | sf/sfz/fz read and run; beat 3 of 3/4 counted, beat 2 not (mazurka accents), unverified as music. |
| T44 | failing | Tarantella octave bass; Mazurka Op. 68 No. 4 right hand. |
| T45 | validated | Re-run on the tie examples. |
| T46 | validated | Re-run (cinquillo). |
| T47 | open | "Alternate" undefined. |
| T48 | open | Field is `tracks`; contradicts the page's own 12/8 example. |
| T49 | open | No route fires in any 6/4 file. |
| T50 | failing | The mapped "source" is the app's file; rep items with cue notes would answer UNKNOWN. |
| T51 | open | No case in the catalogue (the check's count). |
| T52 | open | Not run; brackets with rests and long-short pairs are common. |

## 4. Counts under the corrected syncopation and tie rules (`sync_all.json`, 2,016 items read)

Pipelines here: generated `exercise.*` 1,211; PDMX ids ending `.pdmx` or holding `.pdmx.` 524 (the page's 519 plus `.pdmx.2` and 4 excerpts); rep 285 (4 fail to load).
- Items with each kind (generated / PDMX / rep): beat-level held 22 / 188 / 118; held 35 / 225 / 146; held at the subdivision 7 / 57 / 69; off-beat attack 76 / 53 / 37; accent 0 / 101 / 127; rest 6 / 47 / 22; bass-then-held-chord 6 / 40 / 35. Present (the page's list) 119 / 329 / 211; present without off-beat attack and bass-then-held-chord 52 / 327 / 208.
- Ties (generated / PDMX / rep): chains 219 / 9,696 / 10,107; across the bar 217 / 6,653 / 4,962; syncopating from a weak beat 72 / 1,020 / 671; from off the beat 11 / 3,128 / 2,616; inner chains (not counted) 72 / 3,521 / 4,849.

## 5. Counts (by script)

`build/v1c/count_page.py` over the edited `area-1C.md`, 2026-10-08:
- Sections 30; a validation status line in each: validated 20, uncertain 6, failing 4.
- Threshold rows 52, each id once: sourced 13, validated 21, open 14, failing 4. Before this pass the page's labels were sourced 12, validated 19, neither 21 (the same script on the input page; equal to the page's own count).
This file (PowerShell `Select-String` over its two tables): 30 rule lines (validated 20, uncertain 6, failing 4) and 52 threshold lines (sourced 13, validated 21, open 14, failing 4), equal to the page's.

## 6. Not done

- No published source was read (Mauleón, OMT, a cadenza-terms list); no threshold was tuned; no rule was rewritten: the failing parts are described, not corrected.
- The final-held-note question (`rhythm.syncopation`, `rhythm.ties`), the mazurka accent (T43) and the 12/8 slow-blues drill (`rhythm.shuffle`) are musical judgements no one in this process can make by ear; they stay open.
- Not re-run: the hidden-rest guard (no case), the bracket delimitation of triplets, the dashed-line scope of tempo changes, piecewise tempo, the per-bar beam tiling, the proving run's agreement counts against `detect.ts`, the 115-of-151 velocity split, the anacrusis 90/48 counts, the 12/8 drill's beams.
- `lessons-chunk1.md` item 6 and the check's N1 state that the PDMX files lose cue size; measured false here (section 1). Not edited (outside this pass's two files).
