# Datasets, corpora and open-source generators for PianoProject: a survey (2026-10-03)

Research only. No repo file was changed. The probes used blob-less `git clone` of
public repositories, `music21` 10.5.0 (system python3) and `ms3` 2.6.5 (a throwaway venv,
since deleted). All downloads were samples and have been deleted.

**What the probes checked.** Each sampled file was parsed. Every interior bar was compared
with its time signature (`barcheck2`). The check forgives an adjacent pair that sums to one
full bar (a volta or repeat split) and a bar that complements the anacrusis. Key signatures
and openings were checked against known editions where I could name one. A clean bar check
does not show that the pitches are right. Where I compared pitches against a second
encoding, the comparison is listed.

**Already used by the project** (`content/scores/imported/SOURCES.md`, `content/sources/*.json`):
PDMX, Mutopia, MuseTrainer, these craigsapp Humdrum repositories (Bach chorales, Beethoven,
Haydn and Mozart sonatas, Chopin mazurkas and preludes, Joplin, Scarlatti), and the NIFC
Chopin first editions (CC BY 4.0). They are listed here only where they bear on another
candidate.

**Network limits met.** kern.humdrum.org returned 503 throughout. cpdl.org and musopen.org
returned 403, and WebFetch was blocked for several domains. The `gh` API was not enabled for
these repositories, but anonymous `git clone` worked. Where those limits apply, the entry is
marked UNKNOWN or "unverified".

---

## 1. Symbolic corpora

### 1.1 OpenScore Lieder — https://github.com/OpenScore/Lieder
- **Content:** 19th-century songs for voice and piano, in MuseScore `.mscx`. The
  repository HEAD (2026-09-09) holds **702 `.mscx` files from 92 composers** (observed).
  Other sources say "over 1,300 songs". The repo mirrors https://musescore.com/openscore-lieder-corpus.
- **Licence:** **CC0 1.0** (LICENSE.txt, observed).
- **Provenance:** crowd-sourced transcription from IMSLP scans under the OpenScore
  project (MuseScore and IMSLP). Each file maps to a MuseScore score id. The repository
  ships `data/check_scores.py`.
- **Probe:** 11 files (Brahms Op. 49/4 *Wiegenlied* plus every 70th file).
  - 10 parsed with ms3 and showed **0 irregular interior bars**.
  - One file was in **MuseScore 2.3.2 format**. ms3 refused it and needs a conversion step.
  - Brahms *Wiegenlied*: key signature 3 flats (E♭, the original key), 3/4 with a
    quaver anacrusis. The voice opens G4 G4 | B♭4… E♭5 D5 C5, which matches the known
    melody.
- **Fit (observed):** vocal line on its own staff, with a two-staff piano accompaniment.
  This is not solo-piano repertoire. Some files have up to 7 staves (choral songs).
- **Limitations:** `.mscx` needs MuseScore or ms3 to convert, because music21 cannot read
  it. Versions are mixed (2.x and 3.x). Coverage is uneven: for example, no Schubert
  *Heidenröslein* or *Erlkönig* in this tree.
- **Adaptation:** convert to MusicXML (with `mscore -j`, or the MusicXML copies that
  When in Rome ships), drop or cue the voice staff, and check the result as an
  accompaniment or song arrangement.
- **Leaves unsolved:** solo-piano beginner repertoire, difficulty and fingering.

### 1.2 OpenScore String Quartets — https://github.com/OpenScore/StringQuartets
CC0 (observed). This is not piano music. It is listed only so that it is not mistaken
for a piano corpus. **No OpenScore piano corpus was found.** The public OpenScore piano
material sits on MuseScore.com, which is the PDMX source the project already uses.

### 1.3 DCML corpora and the Distant Listening Corpus — https://github.com/DCMLab/dcml_corpora, https://github.com/DCMLab/distant_listening_corpus
- **Content:** MuseScore 3 `.mscx` scores with expert harmony labels (the DCML standard),
  plus TSV files (notes, measures, chords, harmonies) and per-piece metadata that links
  IMSLP, MusicBrainz and Wikidata.
- **Piano sub-corpora** (observed in the listing): Mozart sonatas, Beethoven sonatas,
  Chopin mazurkas, Schumann *Kinderszenen*, Tchaikovsky *Seasons*, Grieg *Lyric Pieces*,
  Dvořák *Silhouettes*, Debussy *Suite bergamasque*, Medtner *Tales*, and Liszt
  *Pèlerinage*. The Distant Listening Corpus adds Bartók Bagatelles, CPE Bach, JC Bach,
  WF Bach, Couperin, Handel, Kozeluch, Scarlatti, Sweelinck, Rachmaninoff, Ravel,
  Poulenc, Schulhoff and the Bach suites.
- **Licence:** **CC BY-NC-SA 4.0** (LICENSE file and README badge, observed).
- **Provenance and quality:**
  - The harmony labels were "entered into the scores by professional music theorists".
    The metadata names annotators, reviewers and a `score_integrity` checker (for
    Kinderszenen no. 1: annotators "Tal Soker, John Heilig", score integrity "Tom Schreyer").
  - The scores themselves started as MuseScore.com community uploads. For example,
    Kinderszenen n01's `source` is `musescore.com/user/22249306/scores/4778176`.
  - The repository carries a correction log (`Korrektur Schumann Kinderszenen Notizen.txt`)
    and an issue tracker for corrections.
- **Probe:** Kinderszenen no. 1 note table against Mutopia's independent edition
  (*Leichte Stücke*, 1900, MIDI).
  - First 16 quarter-beats: 81 against 81 (onset, pitch) events. **Pitches identical.**
  - The only differences are three onsets at 2.75 against 2.667 quarter-beats: the
    dotted-quaver-plus-semiquaver figure, which Mutopia's MIDI aligns with the triplet.
    This is a playback convention, not a pitch error.
  - Measures TSV: 2/4, `act_dur` 1/2 in every bar listed.
- **Fit:** two-staff piano scores with Roman-numeral harmony labels. Kinderszenen and the
  Tchaikovsky and Grieg sets include intermediate pieces.
- **Limitations:** the NC licence. The project already has an `--allow-nc` switch in
  `kern.json`, so this is a governed decision. The scores are `.mscx` (MuseScore 3 and
  ms3). There are no difficulty labels.
- **Use:** verification of harmony and key claims (supported by the "known musical
  knowledge from a maintained source" rule), and a second encoding to cross-check
  existing imports note for note.

### 1.4 When in Rome — https://github.com/MarkGotham/When-in-Rome
- **Content:** 1,124 `analysis.txt` RomanText analyses (observed count). Scores are local
  `score.mxl` files or links in `remote.json`.
- **Keyboard material:** Beethoven sonatas (86), Mozart sonatas (54), Grieg Lyric Pieces
  (66), Bach WTC I complete plus 5 WTC II fugues (31), Medtner (17), Schumann
  Kinderszenen (13), Tchaikovsky (12), Debussy (4), and Variations (Beethoven, Mozart).
  It also has 371 Bach chorales and Lieder analyses.
- **Licence:** README badge **CC BY-SA 4.0**. **However, files converted from DCML carry
  DCML's licence.** The K545 `analysis.txt` header says "Licence CC-BY-NC-SA. This file is
  automatically converted from …DCMLab/mozart_piano_sonatas". The Kinderszenen
  `remote.json` points at DCML too. So the effective licence is per file.
- **Probe:** Mozart K545/1.
  - `score.mxl`: 2 parts, 73 bars each, 0 irregular bars, key C, opening RH C5 E5 G5 B4
    C5 D5. This is correct.
  - Analysis: 121 Roman numerals ending at m. 73, matching the score. Opening I, V43, I,
    IV64, I, V6, V65, I is plausible.
- **Extras:** `analysis_automatic.rntxt` files (AugmentedNet machine output) sit beside
  the human analyses and must not be confused with them. `feedback_on_analysis.txt` is
  automatic proof-reading output.
- **Fit:** reference annotations, mainly for intermediate-to-advanced pieces. It is not a
  score source of its own.

### 1.5 Essen Folksong Collection (kern) — https://github.com/ccarh/essen-folksong-collection
- **Content:** about 6,255 monophonic folk melodies (8,473 `.krn` files observed),
  mostly German (5,370), including **213 German Kinderlieder**. Each melody has origin
  metadata.
- **Licence: restrictive.** The repository's `license.txt` is the **CCARH MuseData licence**:
  - "for the purpose of academic research"
  - "under no circumstance is the data to be embedded or included in teaching materials
    for commercial or non-commercial distribution"
  - single-user, with "Copyright is claimed by CCARH on its data files".
  - music21's copy (`corpus/essenFolksong/license.txt`) says "The legal status of the
    Essen folksong database is unclear" and that permission covers "non-commercial
    distribution and use of these files in music21".
- **Probe:** the music21 ABC conversion `kinder0.abc`, 213 tunes.
  - All parsed. 2 tunes have unexplained short bars.
  - Final note: tonic of the key signature in 152, 3rd degree in 35, 5th in 22, 2nd in 3
    and 6th in 1. Most of these are normal folk endings. I did not check them against
    printed sources.
  - Titles are uppercase without umlauts (SCHOENSTEN), and the ABC carries no lyrics.
- **Verdict:** the encodings look clean, but **the licence forbids embedding them in
  teaching materials**. Avoid.

### 1.6 Other KernScores and Humdrum repositories (via https://github.com/humdrum-tools/humdrum-data)
- **Polish Music Heritage (POPC), Chopin Institute** — https://github.com/pl-wnifc/humdrum-polish-scores
  - **CC BY 4.0** (LICENSE.txt and README, observed). The same institute's Chopin first
    editions are already used.
  - 8,918 `.krn` files. Every file carries source siglum, shelfmark, scan URL, encoder and
    editor (`!!!EED`). A named team of encoders and editors is listed, with counts.
  - **The repertoire is mostly sacred, choral and orchestral.** In a 30-file systematic
    sample, about 3 were piano solo (an anonymous Valc, Stefani's *Polka Mazurek*, and a
    Moniuszko cavatina in piano score).
  - Probe: Valc (34 bars) and Polka Mazurek (78 bars) had 0 irregular bars. The cavatina
    had 2 irregular bars (m. 7 at 2 beats and m. 8 at 8 beats in 4/4). This is likely a
    cadenza and was not adjudicated.
  - Fit: a licence-clean source of 19th-century Polish salon and dance piano miniatures.
    It needs a filter by instrumentation (`*Ipiano`, two `**kern` spines).
- **Bach Inventions** (humdrum-tools/inventions) and **WTC** (humdrum-tools/bach-wtc):
  `!!!YEC: Copyright 1994, David Huron`, `!!!YEM: Rights to all derivative electronic
  formats reserved`. Source: Bach-Gesellschaft. **Not redistributable as is.**
- **Hummel Preludes Op. 67** (craigsapp/hummel-preludes): `!!!YEC: Copyright 2008 by
  Craig Stuart Sapp`. The repo has no LICENSE file, so its licence is UNKNOWN. These are
  very short preludes in all keys.
- **Erk *Deutscher Liederschatz*** (craigsapp/erk-liederschatz): 232 songs from a
  19th-century source edition, encoded by Sapp. No LICENSE file, so its licence is UNKNOWN.
- **Foster songs and Schubert songs** (humdrum-tools): no LICENSE file. Rights UNKNOWN.
- **Mozart *Musikalisches Würfelspiel*** (craigsapp/Musikalisches-Wuerfelspiel): one
  `.krn` file plus a web page. No licence file. It is a historical rule-based generator
  (dice selection of pre-composed bars). The music is PD, but the encoding's rights are
  UNKNOWN.
- **KernScores website** (kern.humdrum.org): 503 during this survey. Per-collection
  licences are UNKNOWN from here. The Humdrum files' own `!!!YEC`/`!!!YEM` records are
  the authority, and the project's `import_kern.py` already reads them.

### 1.7 The Session data dump — https://github.com/adactio/TheSession-data
- Weekly CSV and JSON of tunes (`tunes.csv` is about 18 MB), sets, aliases and popularity.
  The content is ABC fiddle and folk tunes, monophonic, often with chord symbols.
- **Licence:** `LICENSE.md` is ODbL with an added clause: "**You may not use, adapt,
  modify, or process the material in any way with Large Language Models** … including
  utilizing LLM tools". The only exception is for accessibility. Because of that clause I
  did not process the tune data.
- **Verdict:** this project's work is done by LLM agents, so the licence rules out
  agent-driven ingestion. Avoid. Encoding quality was **not probed** for this reason.

### 1.8 Nottingham Music Database (cleaned by Jukedeck) — https://github.com/jukedeck/nottingham-dataset
- **Content:** 1,037 tunes (observed `X:` count) of British and Irish folk dance music
  (jigs, reels, hornpipes, waltzes and so on), as ABC melody with chord symbols. The repo
  also has MIDI melody and chord renderings, and the original and cleaned ABC side by side.
- **Licence:** the repository is **GPL-3.0** (Jukedeck's cleaning). The original NMD
  (abc.sourceforge.net/NMD) licence is UNKNOWN.
- **Copyright of the tunes:** **not all are traditional.** 7 `S:` lines credit named
  composers, such as "By Hugh Barwell, via Phil Rowe" and "by Pat Shuldam-Shaw". These
  may be modern copyrighted compositions.
- **Cleaning record:** the README lists edits: chord notation normalised, repeats made
  explicit, D.C./D.S. expanded into parts, walking-bass notes inside chords removed, and
  lyrics removed.
- **Probe:** `jigs.abc` (340 tunes) and `ashover.abc` (46 tunes).
  - Everything parsed with music21.
  - 7 of 340 jigs have unexplained bar lengths. "Joan of Arc" is a legitimate split
    ending plus anacrusis. "Double Rise" has a volta starting mid-bar, plus a spurious
    `M:4/4` header before `M:6/8`.
  - Other irregular bars were volta or pickup splits.
- **Fit:** monophonic melody plus chord symbols, in the folk-dance idiom.
- **Adaptation:** filter out tunes with a named composer, and add a left-hand
  realisation (it needs one to be piano material).

### 1.9 abcnotation.com — https://abcnotation.com/searchCopyright
- This is a search engine over ABC files hosted elsewhere, not a corpus with a licence.
- Policy (observed): "Copyright music is never knowingly returned in search results
  unless the composer gives their explicit consent". Tunes with a `C:` composer field are
  "usually excluded".
- No licence is granted for the transcriptions themselves. Quality depends on each
  contributor's file.
- **Treat with caution:** the provenance and rights have to be traced to each origin site.

### 1.10 music21 built-in corpus (local, `music21/corpus`)
- 3,194 core files (observed).
- **Licence statement** (`corpus/license.txt`): "Some encodings … may not be used for
  commercial uses or have other restrictions: please see the licenses embedded in
  individual compositions or directories". The licence is per item.
- **Piano-relevant items:**
  - `mozart/k545`, `joplin/maple_leaf_rag.mxl`, `chopin/mazurka06-2.krn`
  - Clara Schumann polonaises Op. 1 (`schumann_clara/polonaise_op1n1-4.mxl`)
  - Beach *Prayer of a Tired Child*, `schubert/Lindenbaum.xml`, `cpebach/h186`
  - `leadSheet` (Berlin *Alexander's Ragtime Band*, Foster)
  - `theoryExercises`
  - Most Beethoven and Haydn items are string quartets.
- **Monophonic folk:** Essen (31 ABC files, 8,514 tunes; see 1.5 for the licence),
  `oneills1850`, `ryansMammoth` (1,059), `airdsAirs`. These are 19th-century collections,
  but the ABC transcribers' rights are not stated.
- **Bach chorales:** 433 files. These are four-voice SATB music, not piano.
- **Fit:** small. Mainly useful as test fixtures and a cross-check, not as content.

### 1.11 OpenEWLD (public-domain subset of the Wikifonia lead sheets) — https://github.com/00sapo/OpenEWLD
- **Content:** 486 `.mxl` lead sheets (observed), each a single melody voice with chord
  symbols and lyrics.
- **Licence:** the repository is **MIT**. It claims "All content … should be free of
  copyright".
- **Status of Wikifonia:** shut down on 25 Dec 2013 when its collective licence (Musicopy,
  NL) ended (https://en.wikipedia.org/wiki/Wikifonia). The full EWLD is "Restricted".
- **Probe:** 13 files (every 40th).
  - All parsed, with **0 unexplained irregular bars** and between 24 and 68 chord symbols
    each.
  - *Sweet Hour of Prayer* has **no key signature stored**. The README admits this bug:
    "no key signature is saved if setted in highest object hierarchy". It also admits that
    `getTimeSignatures()` defaults to 4/4.
- **Copyright problems found in the sample** (dates from my knowledge, not verified in
  this session):
  - Gershwin, *I Was Doing All Right* (1938): US copyright to about 2034.
  - Alter and Mitchell, *You Turned the Tables on Me* (1936).
  - Dubin and Franklin, *Anniversary Waltz* (1941).
  - The public-domain filter appears to be death-year based, so it is **not valid for US
    publication-date rules**.
- **Treat with caution.** Each item would need US public-domain re-verification. The
  transcriptions are user-made Wikifonia arrangements.

### 1.12 POP909 — https://github.com/music-x-lab/POP909-Dataset
- **Content:** 909 Chinese pop songs as MIDI with MELODY, BRIDGE and PIANO tracks, plus
  beat and chord annotations extracted from audio and MIDI.
- **Licence:** the repository is MIT. That cannot license the underlying commercial pop
  compositions; this is inference, and the songs are not PD.
- **Fit:** MIDI only, with no notation spelling or engraving information.
- **Verdict:** avoid for content. A possible research reference for pop accompaniment
  patterns only.

### 1.13 Hooktheory and TheoryTab — https://www.hooktheory.com/api/trends/docs
- The API exposes chord-transition probabilities and "songs containing a progression".
  It needs authentication with a Hooktheory account. There is no licence grant on the
  data page. The data is analyses of copyrighted songs.
- **Fit:** statistics only. These could be cited as frequencies but are not content.
  Terms of use: UNKNOWN (not fetched).

### 1.14 iReal Pro charts — https://forums.irealpro.com/threads/copyrights-and-rules.48/
- These are chord-only charts. Melodies and lyrics are banned for copyright reasons. They
  are user-posted with no open licence and use a proprietary format.
- **Avoid as a source.** Chord progressions as such are generally not protectable, but
  the forum dumps carry no grant.

### 1.15 IMSLP, Musopen, CPDL and Mutopia
- **IMSLP:** almost entirely PDF scans. Some new engravings attach MusicXML under their
  own CC licences, which vary per file (for example CC BY-NC-ND 3.0 or CC BY-SA 4.0). It
  is useful as the **reference edition** for checking openings. As a MusicXML source it is
  only practical per file.
- **Musopen:** musopen.org returned 403. The claim that it offers PD, CC0 and CC BY-SA
  scores comes from a weak secondary source and is **unverified**. MusicXML availability
  is UNKNOWN.
- **CPDL:** cpdl.org was blocked. Per search results, the default "CPDL licence" is
  copyleft and GPL-like, and some editions use CC licences. Coverage is choral; it
  sometimes includes MusicXML, NWC or Sibelius files. **Not piano music.** Licence per
  edition.
- **Mutopia:** already used. In the probe, Kinderszenen no. 1 (`Leichte Stücke`, 1900,
  "Public Domain") agreed in pitch with the DCML encoding (see 1.3).

### 1.16 Piano Booster course ("BoosterMusic") — https://github.com/pianobooster/BoosterMusic
- **Content:** a beginner course of 8 pieces (Middle C, C and F chords, up and down,
  intervals for each hand) and a song book of 8 (Clair de la lune, Lavender's Blue, Skip
  to My Lou, Frère Jacques, Scarborough Fair, Greensleeves, Amazing Grace). Each comes as
  ABC (piano), MMA (accompaniment) and Markdown (lesson text).
- **Licence:** **CC BY 4.0** (`license.txt`, observed). The application code is GPL.
- **Probe:** all 16 ABC files parsed.
  - The only irregular bars were zero-length artifacts at repeat signs.
  - music21 merged the inline `[V: RH1]` and `[V: LH1]` voices into one part, so a
    voice-aware ABC importer (abcjs or abc2xml) is needed.
  - Frère Jacques is in C, RH melody over a LH bass of E, then C, then G.
- **Fit:** a handful of beginner two-hand arrangements.
- **Limitation:** tiny, and a single anonymous arranger with no editorial review record.

### 1.17 ASAP (Aligned Scores and Performances) — https://github.com/fosfrancesco/asap-dataset
- **Content:** 222 distinct MusicXML and MIDI scores (the README's text says 236) with
  1,067 performances. Composers include Bach (59), Beethoven (57), Chopin (34), Liszt and
  Schubert. Annotations cover beats, downbeats, time and key signatures.
- **Licence:** **CC BY-NC-SA 4.0** (observed).
- **Known quality issues, from the README:** "The scores were written by non-professionals,
  and although we manually corrected them … they still present some problems." It advises
  using the TSV and JSON annotations rather than re-extracting them from the score.
  Version 1.1 lists corrections.
- **Probe:** 10 scores (every 25th).
  - 5 showed 0 unexplained irregular bars.
  - Beethoven Op. 31/2/iii showed 10 one-semiquaver bars at mm. 31, 243 and 244, which
    looks like an encoding problem.
  - Chopin Ballade 2 showed 9, Liszt *Gondoliera* 26 (it has cadenzas), Schumann
    Kreisleriana 2 showed 6, and Rachmaninoff Op. 23/6 showed 2.
  - None of these was adjudicated against an edition.
- **Fit:** mostly advanced concert repertoire.
- **Verdict:** low fit for content, and the error notice is explicit. Useful only for
  performance-timing research.

### 1.18 Performance-only datasets: MAESTRO, GiantMIDI-Piano, PIAST
- **MAESTRO:** about 200 hours of competition performances, as Disklavier MIDI and audio
  aligned to about 3 ms. **CC BY-NC-SA 4.0**
  (https://magenta.tensorflow.org/datasets/maestro). It contains **no scores**.
- **GiantMIDI-Piano:** 10,855 MIDI files (curated subset 7,236), **transcribed
  automatically** from YouTube recordings. Licence **CC BY 4.0** (README). It has no
  notation and is subject to transcription error. Its own README says piece identity
  rests on matching YouTube titles to composer surnames.
- **PIAST:** 9,673 YouTube tracks with transcribed MIDI and text tags (2,023
  expert-annotated). The README shows **both** an MIT badge and "CC-BY-NC 4.0", which
  conflict. It has no notation.
- **Verdict on all three:** not sources of readable scores. Transcribed MIDI cannot
  supply spelling, beaming, voicing or hands.

---

## 2. Annotated datasets for verification or selection

| Dataset | What it labels | Licence (verified where marked) | Notes |
|---|---|---|---|
| **CIPI** (https://zenodo.org/records/8037327) | 652 classical piano pieces, 29 composers, Henle levels 1–9, with MusicXML | Zenodo record: **access "restricted", licence field empty** (observed via API) | Labels are taken from Henle Verlag's published grades and checked by an expert pianist. The scores are "public domain scores" aligned to the labels; their origin is not stated in the record. The best model reached 39.5 % balanced accuracy, which shows the labels cannot be predicted from the notes easily. |
| **Henle levels** (https://www.henle.de/Levels-of-Difficulty/) | Publisher's 1–9 grades (Rolf Koenen) per published piece | Proprietary publisher data, with no open licence found | A level may be cited as a fact about a named piece. Bulk copying is unverified ground. |
| **PSyllabus** (https://zenodo.org/records/14794592) | 7,901 solo piano recordings, levels 0–10, from pianosyllabus.com, which aggregates ABRSM, RCM, Trinity, AMEB, Henle and others | **Conflict:** the Zenodo licence field says CC BY 4.0, but the description says "License: **Research use only**" (both observed) | Probe of the metadata JSON: 7,901 entries. Level counts were 0:224, 1:581, 2:589, 3:792, 4:796, 5:887, 6:842, 7:858, 8:795, 9:586, 10:951. Each entry carries the syllabus name and a per-syllabus level (for example "AMEB PFL", "Piano St"). Many entries are copyrighted modern teaching pieces. Audio is via YouTube links. **No scores.** |
| **Mikrokosmos-difficulty** (https://github.com/PRamoneda/Mikrokosmos-difficulty) | 147 MusicXML files, 3 levels (vols I–II, III–IV, V–VI) | **No licence file.** The music is **in copyright in the USA until 1 Jan 2036** (IMSLP/Boosey; https://imslp.org/wiki/Mikrokosmos,_Sz.107_(Bart%C3%B3k,_B%C3%A9la)) | The MusicXML was made by commercial OMR "and manual corrections". Avoid for a US-distributed app. |
| **DCML harmonies** (1.3) | Expert Roman numerals, cadences and phrases | CC BY-NC-SA 4.0 | Best-documented annotation process. |
| **When in Rome** (1.4) | RomanText analyses | CC BY-SA, **except DCML-derived files (NC)** | Check the licence per file. |
| **Bach chorale analyses** | 371 in When in Rome (`Early_Choral/Bach`); DDMAL flexible chorale annotations (via humdrum-data) | Per file | SATB music, not piano. |
| **ABC (Annotated Beethoven Corpus)** | Beethoven **string quartets** | CC BY-NC-SA | Not piano. |
| **RCM and ABRSM syllabi** | Graded repertoire lists | The syllabi are copyrighted publications. A list of facts (piece X is at grade Y) is citable, but the documents are not reproducible | The project already models levels against ABRSM (`musetrainer.json`). |
| **GiantMIDI / MAESTRO** | Performance data | See 1.18 | Not difficulty labels. |

---

## 3. Open-source generators and trainers

| Project | What it does | Licence (observed) | Notes |
|---|---|---|---|
| **music21** (installed) | Scales, intervals, Roman numerals, keys, `RomanText`, ABC, Humdrum and MusicXML I/O | BSD (software) | Already a dependency. It already provides scale, arpeggio and chord spelling, so do not hand-write these. |
| **Tonal** (https://github.com/tonaljs/tonal) | JS music theory (scales, chords, intervals, keys, Roman numerals, ABC note names) | **MIT** (`docs/LICENSE`) | Client-side spelling and scale generation without Python. |
| **ynot99/sight_reading_practice** (https://github.com/ynot99/sight_reading_practice) | Client-side grand-staff exercise generator with 8 built-in levels (`presets.ts`), melody, harmony and pattern voice generators, and MIDI judging | `package.json` says **MIT** but there is **no LICENSE file** | Active (last commit 2026-10-02). The rule set is project-specific, with no published grading source cited in the README. |
| **evanconway/piano-sight-reading-react** | Random generation by user-set options, plus WebMIDI | **No licence**, so all rights reserved | Not reusable as code. |
| **leafo/sightreading.training** | Random sheet-music generation, plus WebMIDI | `package.json` says **"UNLICENSED"**, with no LICENSE file, despite site claims of "open source" | Do not reuse code. |
| **kchua/SREGen** | Genetic-algorithm sight-reading generator that outputs LilyPond | **No licence**; last commit 2016 | Its scale generator is "temporarily unavailable" per the README. |
| **davidgilbertson/sight-reader** | Note-reading practice | `package.json` ISC, no LICENSE file; last commit 2016 | Note-naming drills only. |
| **ScoreDate** (https://github.com/shlomiv/ScoreDate) | Java: note reading, rhythm, score reading and ear training | **GPL-3.0** | The GPL is incompatible with embedding unless the app is GPL. Can be used as a reference for exercise taxonomy. |
| **Piano Booster** (https://github.com/pianobooster/PianoBooster) | MIDI-following practice player | GPL (app); the course is CC BY 4.0 (1.16) | |
| **Neothesia** (https://github.com/PolyMeilex/Neothesia) | Synthesia-like falling-notes MIDI player | **GPL-3.0** | **Ships no curated content.** |
| **Magenta** (https://github.com/magenta/magenta) | ML music generation | Apache-2.0 | README: "**currently inactive (archived, read only)**". Neural output has no correctness guarantee. |
| **folk-rnn** | ABC tune generation (an LSTM trained on The Session) | UNKNOWN (the clone failed) | Its training data now carries The Session's no-LLM clause (1.7), and the output has no correctness guarantee. |
| **Mozart *Würfelspiel*** (1.6) | Historical rule-based combinatorial minuet generator (K. Anh. C 30.01) | Music PD; encoding rights UNKNOWN | Each output is guaranteed well-formed, because every bar is pre-composed. |

No open-source generator found cites ABRSM, RCM or Trinity sight-reading parameters as
its grading source. Each invents its own levels.

---

## 4. Ranked shortlist: most promising for accurate content expansion

1. **OpenScore Lieder (CC0).**
   - The only large, licence-clean, human-transcribed corpus of new two-stave piano
     writing. Its scans trace to IMSLP.
   - Probe: 10 of 10 parseable files had no irregular bars, and the Brahms *Wiegenlied*
     opening and key were correct.
   - Cost: `.mscx` conversion, with 2.x files needing an upgrade. It is song
     accompaniment, not solo repertoire.
2. **Polish Music Heritage / POPC (CC BY 4.0, Chopin Institute).**
   - Same publisher and pipeline as the Chopin first editions the project already
     imports, so the importer fits.
   - Every file names its source scan and editor. Probe: 2 piano miniatures had 0
     irregular bars.
   - Cost: piano solo is a small share of the sample (about 3 in 30), so an
     instrumentation filter and per-piece checks are needed.
3. **DCML / Distant Listening Corpus (CC BY-NC-SA) as a verification layer, plus
   scores if NC is allowed.**
   - The best-documented editorial process: named annotators, reviewers and integrity
     checker, plus a correction log.
   - Probe: pitch-identical to Mutopia's independent Kinderszenen no. 1.
   - Gives an expert harmony ground truth for the pieces the project already holds
     (Mozart, Beethoven, Chopin mazurkas), and new piano sets (Kinderszenen, Seasons,
     Grieg, Bartók Bagatelles, CPE Bach, Handel, Couperin).
   - Gated by the project's existing NC decision.
4. **When in Rome (per-file licence)**, for Roman-numeral checks on WTC I, Grieg, Mozart
   and Beethoven, after excluding or NC-gating the DCML-derived files. The K545 probe
   aligned exactly with its score.
5. **Piano Booster course (CC BY 4.0).** Small but immediately usable two-hand beginner
   arrangements in ABC. It needs a voice-aware ABC parser and a check for each piece.
6. **Nottingham Music Database (GPL-3.0)**, only if the GPL terms suit the app and tunes
   with a named composer are dropped. The melodies are clean (7 of 340 jigs with notation
   quirks, none clearly wrong), but they need an invented left hand.
7. **Generators:** reuse **music21** and **Tonal** (both permissive) for scales,
   arpeggios and spelling. No sight-reading generator found has both an open licence file
   and a published grading basis.

## 5. Sources to avoid or treat with caution

- **Essen Folksong Collection.** The CCARH licence forbids embedding in "teaching
  materials for commercial or non-commercial distribution", and music21 calls its legal
  status "unclear".
- **The Session data dump.** The licence forbids processing "in any way with Large
  Language Models", and this project is run by LLM agents.
- **OpenEWLD.** Its "public domain" filter let through works still under US copyright
  (Gershwin 1938, 1936 and 1941 songs in a 13-file sample). Key signatures are sometimes
  lost (known bug).
- **Mikrokosmos-difficulty.** The music is US-copyright until 2036. The encodings are
  OMR output and the repo has no licence.
- **CIPI.** The Zenodo record is restricted-access with no licence, and the levels are
  Henle's proprietary data.
- **PSyllabus.** The licence fields conflict (CC BY 4.0 against "Research use only"). It
  has no scores, and many listed pieces are in copyright.
- **POP909, Hooktheory and iReal Pro.** Copyrighted songs, or no open grant.
- **ASAP.** Non-professional scores with known residual errors (the README says so), and
  NC. Probe: irregular bars in 5 of 10 scores.
- **GiantMIDI, MAESTRO and PIAST.** Performance or transcription MIDI with no notation.
  GiantMIDI's transcription and title matching are automatic.
- **David Huron's Bach Inventions and WTC kern.** "Rights to all derivative electronic
  formats reserved".
- **Unlicensed craigsapp and humdrum-tools repositories** (Hummel, Erk, Foster, Schubert
  songs). There is no licence file, so they need an explicit grant before use. The project
  already refuses unlicensed repositories (`kern.json`).
- **abcnotation.com.** An aggregator with no licence grant. Provenance has to be traced
  per tune.
- **Magenta and folk-rnn style neural generators.** The repository is inactive (or the
  generator is trained on restricted data), and the output has no correctness guarantee.
- **Unlicensed sight-reading apps** (evanconway, leafo, SREGen). Code with no licence is
  all rights reserved.

## 6. UNKNOWN or unverified

- KernScores site collection licences: the site returned 503.
- Musopen formats and licences: 403.
- CPDL licence text: blocked; the summary above comes from search results.
- Hooktheory terms of use: not fetched.
- Original NMD licence.
- folk-rnn licence.
- Copyright dates of the OpenEWLD songs: these come from my knowledge and were not
  checked in this session.
- Lieder corpus size: the repo has 702 files, against an external claim of more than 1,300.
- Nothing here has been heard or engraved and looked at. Every check was a parse and an
  arithmetic test.
