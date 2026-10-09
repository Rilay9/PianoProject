# Reference check, app level 2

**How to work through this list**
1. Go in order. Stop when this level has **8 confirmed pieces** (a suggested target; ideally at least two of each kind the lists name: agile, lyrical, another style; or the RCM periods).
2. For each piece, find a **reference**: an engraved or printed score of the piece that is NOT from MuseScore or PDMX (those are where the candidate files come from). Pianocoda (pianocoda.com) has free PDFs of many RCM-list pieces; other free engraved PDFs are fine. Not IMSLP.
3. Compare the reference's **bars 1–8, both hands**, with the notes listed below (pitch with octave, C4 = middle C; then the note value). Ignore fingering, dynamics and slurs.
4. Record in `results-template.csv`: the reference URL and a verdict:
   - **CONFIRMED**: every note and value in bars 1–8 matches;
   - **ERROR bar N**: the right piece, but bar N differs;
   - **WRONG PIECE**: it is not the piece named;
   - **NO REFERENCE**: none found.
   Say only what you compared; do not judge from memory of the piece.

Facts already checked by script for every row: MusicXML piano score, key signature consistent with the title, no arrangement words in the file title; PDMX's canonical upload where one exists.

## 2.01 R. Schumann: Soldier’s March, op. 68, no. 2 / Soldatenmarsch (Soldiers March) Op 68 No 2

- **On the lists:** PSyllabus:ABRSM=1(ps2); PSyllabus:AMEB=2(ps2); PSyllabus:LCM=2(ps2); PSyllabus:NZMEB=1(ps2); PSyllabus:Piano St=4(ps2); PSyllabus:RCM=2(ps2); PSyllabus:RIAM=2(ps2); PSyllabus:SCSM=2(ps2); RCM=2
- **Candidate file:** `./mxl/0/32/QmaMe5Ru85vNPdhyqhDey5Dz1eYH2cKL6mU7EuigXGXQXj.mxl` (title in file: "Schumann: Soldier's March Op. 68 No. 2"; pdmx; confidence high; key signature 1 sharps; time 2/4; 24 bars)
- **Search:** `R. Schumann Soldier’s March, op. 68, no. 2 / Soldatenmarsch (Soldiers March) Op 68 No 2 piano sheet music pdf` (try Pianocoda first)
- **Already settled:** CONFIRMED (pilot, Pianocoda reference)
- **RH (top staff):**
  - b1: G4+B4 dotted 8th, G4+C5 16th, G4+D5 8th, rest 8th
  - b2: G4+E5 8th, rest 8th, G4+D5 8th, rest 8th
  - b3: F#4+C5 8th, rest 8th, G4+B4 8th, rest 8th
  - b4: F#4+A4 8th, rest 8th, G4 8th, rest 8th
  - b5: G4+B4 dotted 8th, G4+C5 16th, G4+D5 8th, rest 8th
  - b6: G4+E5 8th, rest 8th, G4+D5 8th, rest 8th
  - b7: E5+G5 8th, rest 8th, D5+F#5 8th, rest 8th
  - b8: C#5+E5 8th, rest 8th, D5 8th, rest 8th
- **LH (bottom staff):**
  - b1: G3 dotted 8th, A3 16th, B3 8th, rest 8th
  - b2: C4 8th, rest 8th, B3 8th, rest 8th
  - b3: A3 8th, rest 8th, G3 8th, rest 8th
  - b4: D3+C4 8th, rest 8th, G3+B3 8th, rest 8th
  - b5: G3 dotted 8th, A3 16th, B3 8th, rest 8th
  - b6: C4 8th, rest 8th, B3 8th, rest 8th
  - b7: C#4 8th, rest 8th, D4 8th, rest 8th
  - b8: A3+G4 8th, rest 8th, D4+F#4 8th, rest 8th

## 2.02 Beethoven: Écossaise in G Major, WoO 23 / Ecossaise fur Militarmusik in G major WoO23

- **On the lists:** PSyllabus:ABRSM=2(ps1); PSyllabus:AMEB=1(ps1); PSyllabus:NZMEB=1(ps1); PSyllabus:RCM=2(ps1); PSyllabus:RIAM=2(ps1); RCM=2
- **Candidate file:** `./mxl/9/25/QmRipx42u9ytmDMa37VT6UEZvDJamYHxtrDPCWq4rp5fTe.mxl` (title in file: "Beethoven: Ecossaise in G (WoO 23)"; pdmx; confidence high; key signature 1 sharps; time 2/4; 18 bars)
- **Search:** `Beethoven Écossaise in G Major, WoO 23 / Ecossaise fur Militarmusik in G major WoO23 piano sheet music pdf` (try Pianocoda first)
- **RH (top staff):**
  - b1: B4 16th, C5 16th
  - b2: D5 8th, B4 8th, A4 8th, G4 8th
  - b3: F#4 8th, E5 quarter, D5 8th
  - b4: A4 8th, B4 8th, C5 8th, D5 8th
  - b5: A4 8th, A#4 quarter, B4 16th, C5 16th
  - b6: D5 8th, B4 8th, A4 8th, G4 8th
  - b7: F#4 8th, E5 quarter, D5 8th
  - b8: A4 8th, B4 8th, C5 8th, D5 8th
- **LH (bottom staff):**
  - b1: rest 8th
  - b2: G3 8th, B3+D4 8th, B3+D4 8th, B3+D4 8th
  - b3: D3 8th, A3+C4 8th, A3+C4 8th, A3+C4 8th
  - b4: D3 8th, F#3+C4 8th, F#3+C4 8th, F#3+C4 8th
  - b5: G3 8th, C4+D4 8th, C4+D4 8th, B3+D4 8th
  - b6: G3 8th, B3+D4 8th, B3+D4 8th, B3+D4 8th
  - b7: D3 8th, A3+C4 8th, A3+C4 8th, A3+C4 8th
  - b8: D3 8th, F#3+C4 8th, F#3+C4 8th, F#3+C4 8th

## 2.03 Burgmuller J.F.: Arabesque in A minor Op 100 No 2

- **On the lists:** PSyllabus:ABRSM=2(ps2); PSyllabus:AMEB=1(ps2); PSyllabus:NZMEB=1(ps2); PSyllabus:Piano St=2(ps2); PSyllabus:RCM=3(ps2); PSyllabus:SCSM=2(ps2)
- **Candidate file:** `./mxl/17/19/QmZfHayYiHJJBpxa5yZpMwR9RDMcDRYGvFC25NyyKa8ziH.mxl` (title in file: "Burgmüller: Arabesque - Op. 100 No. 2"; pdmx; confidence high; key signature 0 sharps; time 2/4; 33 bars)
- **Search:** `Burgmuller J.F. Arabesque in A minor Op 100 No 2 piano sheet music pdf` (try Pianocoda first)
- **RH (top staff):**
  - b1: rest half
  - b2: rest half
  - b3: A4 16th, B4 16th, C5 16th, B4 16th, A4 8th, rest 8th
  - b4: A4 16th, B4 16th, C5 16th, D5 16th, E5 8th, rest 8th
  - b5: D5 16th, E5 16th, F5 16th, G5 16th, A5 8th, rest 8th
  - b6: A5 16th, B5 16th, C6 16th, D6 16th, E6 8th, rest 8th
  - b7: rest 8th, E5 8th, E5 8th, F5 8th
  - b8: D5 8th, rest 8th, D5 quarter
- **LH (bottom staff):**
  - b1: A3+C4+E4 quarter, A3+C4+E4 quarter
  - b2: A3+C4+E4 quarter, A3+C4+E4 quarter
  - b3: A3+C4+E4 quarter, A3+C4+E4 quarter
  - b4: A3+C4+E4 quarter, A3+C4+E4 quarter
  - b5: A3+D4+F4 quarter, A3+D4+F4 quarter
  - b6: A3+C4+E4 quarter, A3+C4+E4 quarter
  - b7: G3+C4+E4 quarter, G3+C4+E4 quarter
  - b8: G3+B3+F4 quarter, G3+B3+F4 quarter

## 2.04 Mozart W.: Menuet and Trio in G major K 1 (K 1e)

- **On the lists:** PSyllabus:ABRSM=1(ps3); PSyllabus:LCM=1(ps3); PSyllabus:NZMEB=3(ps3); PSyllabus:Piano St=3(ps3); PSyllabus:RCM=2(ps3); PSyllabus:SCSM=3(ps3)
- **Candidate file:** `./mxl/5/14/QmfCULDvejZyShSRANTgFLGt4TudSaWNcuAfbV89RhdFPP.mxl` (title in file: "Mozart - Minuet & Trio - K. 1"; pdmx; confidence high; key signature 1 sharps; time 3/4; 81 bars)
- **Search:** `Mozart W. Menuet and Trio in G major K 1 (K 1e) piano sheet music pdf` (try Pianocoda first)
- **RH (top staff):**
  - b1: B5 8th, G5 8th
  - b2: B4 quarter, C5 quarter, D5 quarter
  - b3: D5 quarter, C5 quarter, A5 8th, F#5 8th
  - b4: A4 quarter, B4 quarter, C5 quarter
  - b5: C5 quarter, B4 quarter, B5 8th, G5 8th
  - b6: E5 quarter, G5 8th, E5 8th, C#5 quarter
  - b7: E5 8th, C#5 8th, A4 8th, G4 8th, F#4 quarter
  - b8: B4 triplet 8th, A4 triplet 8th, G4 triplet 8th, F#4 quarter, E4 quarter
- **LH (bottom staff):**
  - b1: rest quarter
  - b2: G3 quarter, A3 quarter, B3 quarter
  - b3: B3 quarter, A3 quarter, rest quarter
  - b4: F#3 quarter, G3 quarter, A3 quarter
  - b5: A3 quarter, G3 quarter, rest quarter
  - b6: G3 half, E3 quarter
  - b7: C#3 quarter, A2 quarter, D3 quarter
  - b8: G3 quarter, A3 quarter, A2 quarter

## 2.05 Mozart: Minuet in D, K. 7 / Minuet in D Major, K 7

- **On the lists:** ABRSM=2; PSyllabus:ABRSM=2(ps2); PSyllabus:RCM=3(ps2); RCM=3
- **Candidate file:** `./mxl/0/38/QmaqiaWjuxahsy4GiTg3WNNMEhngex9Jcq448jYfkfCTyU.mxl` (title in file: "Menuett in D KV 7"; pdmx; confidence high; key signature 2 sharps; time 3/4; 22 bars)
- **Search:** `Mozart Minuet in D, K. 7 / Minuet in D Major, K 7 piano sheet music pdf` (try Pianocoda first)
- **RH (top staff):**
  - b1: D5 half, F#5 8th, D5 8th
  - b2: A5 half, F#5 8th, D5 8th
  - b3: E5 8th, G5 8th, F#5 8th, E5 8th, D5 8th, C#5 8th
  - b4: D5 dotted half
  - b5: F#5 half, B5 8th, A5 8th
  - b6: A5 8th, G#5 8th, F#5 8th, E5 8th, A5 quarter
  - b7: F#5 half, B5 8th, A5 8th
  - b8: A5 8th, G#5 8th, F#5 8th, E5 8th, A5 8th, E5 8th
- **LH (bottom staff):**
  - b1: D4 8th, A4 8th, F#4 8th, A4 8th, D4 8th, A4 8th
  - b2: D4 8th, A4 8th, F#4 8th, A4 8th, D4 8th, A4 8th
  - b3: G4 quarter, A4 quarter, A3 quarter
  - b4: rest 8th, D4 8th, F#4 8th, A4 8th, D5 quarter
  - b5: D4 8th, B4 8th, F#4 8th, B4 8th, D#4 8th, B4 8th
  - b6: E4 8th, B4 8th, D4 8th, B4 8th, C#4 8th, A4 8th
  - b7: D4 8th, B4 8th, F#4 8th, B4 8th, D#4 8th, B4 8th
  - b8: E4 8th, B4 8th, D4 8th, B4 8th, C#4 8th, A4 8th

## 2.06 Mozart, Wolfgang Amadeus: Allegro in F Major, K 1c / Allegro - K 1c in F major

- **On the lists:** PSyllabus:ABRSM=1(ps1); PSyllabus:Piano St=1(ps1); PSyllabus:RCM=2(ps1); RCM=2
- **Candidate file:** `./mxl/3/45/QmdTZbbMT8VGXoYtr8S8LCfqDpmCd6go7ydUsMVVTCjP6K.mxl` (title in file: "W. A. Mozart Allegro in F Major K1c."; pdmx; confidence high; key signature -1 sharps; time 2/4; 14 bars)
- **Search:** `Mozart, Wolfgang Amadeus Allegro in F Major, K 1c / Allegro - K 1c in F major piano sheet music pdf` (try Pianocoda first)
- **RH (top staff):**
  - b1: C5 8th
  - b2: F5 8th, F5 8th, G5 8th, G5 8th
  - b3: A5 dotted 8th, Bb5 16th, C6 8th, C6 16th, A5 16th
  - b4: G5 8th, Bb5 16th, G5 16th, F5 8th, E5 8th
  - b5: F5 dotted quarter
  - b6: C6 16th, A5 16th
  - b7: G5 8th, C6 16th, A5 16th, G5 8th, C6 16th, A5 16th
  - b8: G5 dotted 8th, F5 16th, E5 8th, C6 16th, A5 16th
- **LH (bottom staff):**
  - b1: rest 8th
  - b2: rest 8th, F3 8th, E3 8th, D3 8th
  - b3: F3 dotted 8th, G3 16th, A3 8th, A3 8th
  - b4: Bb3 8th, Bb3 8th, C4 8th, C3 8th
  - b5: F3 8th, C3 8th, F2 8th
  - b6: F3 8th
  - b7: E3 8th, F3 8th, E3 8th, F3 8th
  - b8: E3 dotted 8th, D3 16th, C3 8th, F3 8th

## 2.07 Handel: Impertinence, HWV 494

- **On the lists:** RCM=2
- **Candidate file:** `./mxl/2/35/Qmcoy66kBYb1u3xpnPyzD4xidHGTXQcXFk6aTvzXMQX6xS.mxl` (title in file: "Impertinence HWV 494 - Haendel"; pdmx; confidence high; key signature -2 sharps; time 2/2; 22 bars)
- **Search:** `Handel Impertinence, HWV 494 piano sheet music pdf` (try Pianocoda first)
- **RH (top staff):**
  - b1: D4 quarter
  - b2: G4 quarter, Bb4 quarter, A4 quarter, G4 8th, F#4 8th
  - b3: G4 half, D4 half
  - b4: A4 8th, Bb4 8th, C5 quarter, Bb4 quarter, A4 quarter
  - b5: Bb4 half, G4 half
  - b6: Bb4 8th, C5 8th, D5 quarter, C5 quarter, Bb4 quarter
  - b7: C5 half, F4 quarter, D5 quarter
  - b8: Eb5 half, C5 half
- **LH (bottom staff):**
  - b1: rest quarter
  - b2: rest half, rest quarter, D3 quarter
  - b3: G3 quarter, A3 quarter, Bb3 quarter, A3 8th, G3 8th
  - b4: F#3 half, D3 half
  - b5: G3 quarter, G2 8th, A2 8th, Bb2 quarter, C3 quarter
  - b6: D3 quarter, Bb2 quarter, A2 quarter, G2 quarter
  - b7: F2 quarter, F3 quarter, Eb3 quarter, D3 quarter
  - b8: C3 half, Eb3 half

## 2.08 Mozart, Wolfgang Amadeus: Minuet in C Major, from Sonata in C Major, K 6

- **On the lists:** RCM=2
- **Candidate file:** `./mxl/15/46/QmXusicmzuQ9Ph4kVB1e3nP6dSVvyAP6vdRNhaxqBg2iLe.mxl` (title in file: "Mozart Menuet I und II aus der Sonata KV 6"; pdmx; confidence high; key signature 0 sharps; time 3/4; 39 bars)
- **Search:** `Mozart, Wolfgang Amadeus Minuet in C Major, from Sonata in C Major, K 6 piano sheet music pdf` (try Pianocoda first)
- **RH (top staff):**
  - b1: C5 half, E5 8th, C5 8th
  - b2: C#5 8th, D5 8th, D5 half
  - b3: D5 half, F5 8th, D5 8th
  - b4: D#5 8th, E5 8th, E5 half
  - b5: E5 quarter, E5 8th, G5 8th, F#5 8th, A5 8th
  - b6: G5 8th, D5 8th, D5 dotted quarter, D#5 8th
  - b7: E5 8th, C5 8th, B4 8th, A4 8th, G4 8th, F#4 8th
  - b8: F#4 0 beats, G4 dotted half
- **LH (bottom staff):**
  - b1: rest quarter, E3 quarter, C3 quarter
  - b2: rest quarter, B3 quarter, G3 quarter
  - b3: rest quarter, B3 quarter, G3 quarter
  - b4: rest quarter, C4 quarter, C3 quarter
  - b5: rest quarter, C3 quarter, C4 quarter
  - b6: B3 quarter, B3 quarter, B3 quarter
  - b7: C4 quarter, D4 quarter, D3 quarter
  - b8: G3 quarter, D3 quarter, G2 quarter

## 2.09 W.A. Mozart: Minuet in G Major, K 1e

- **On the lists:** RCM=2
- **Candidate file:** `./mxl/10/43/QmSSZAHjALT7zf8hpZpLFXaBHB9ytuBETs4QbhvYDFSAaa.mxl` (title in file: "W. A. Mozart Minuet in G Major K1e."; pdmx; confidence high; key signature 1 sharps; time 3/4; 36 bars)
- **Search:** `W.A. Mozart Minuet in G Major, K 1e piano sheet music pdf` (try Pianocoda first)
- **RH (top staff):**
  - b1: B5 8th, G5 8th
  - b2: B4 quarter, C5 quarter, D5 quarter
  - b3: D5 quarter, C5 quarter, A5 8th, F#5 8th
  - b4: A4 quarter, B4 quarter, C5 quarter
  - b5: C5 quarter, B4 quarter, B5 8th, G5 8th
  - b6: E5 quarter, G5 8th, E5 8th, C#5 quarter
  - b7: E5 8th, C#5 8th, A4 8th, G4 8th, F#4 quarter
  - b8: B4 triplet 8th, A4 triplet 8th, G4 triplet 8th, F#4 quarter, E4 quarter
- **LH (bottom staff):**
  - b1: rest quarter
  - b2: G3 quarter, A3 quarter, B3 quarter
  - b3: B3 quarter, A3 quarter, rest quarter
  - b4: F#3 quarter, G3 quarter, A3 quarter
  - b5: A3 quarter, G3 quarter, rest quarter
  - b6: G3 half, E3 quarter
  - b7: C#3 quarter, A2 quarter, D3 quarter
  - b8: G3 quarter, A3 quarter, A2 quarter

## 2.10 J.S. Bach: Minuet in G Major / Minuet in G Major, BWV Anh. 116 / Minuet in G Major, BWV 843 / Minuet in G major BWV 116 / Minuet in G major BWV 114

- **On the lists:** PSyllabus:ABRSM=3(ps3); PSyllabus:AMEB=2(ps3); PSyllabus:NZMEB=1(ps1); PSyllabus:NZMEB=2(ps3); PSyllabus:NZMEB=3(ps3); PSyllabus:Piano St=2(ps1); PSyllabus:Piano St=3(ps3); PSyllabus:RCM=4(ps3); PSyllabus:RCM=6(ps5); PSyllabus:RIAM=2(ps3); PSyllabus:SCSM=2(ps1); PSyllabus:SCSM=2(ps3); RCM=2; RCM=4; RCM=6
- **Candidate file:** `./mxl/5/41/QmfRTcau5xbKnKfgGqEWjk55geY6SxPCQo29zobWDCvMyY.mxl` (title in file: "Minuet No. 1"; pdmx; confidence medium; key signature 1 sharps; time 3/4; 32 bars)
- **Search:** `J.S. Bach Minuet in G Major / Minuet in G Major, BWV Anh. 116 / Minuet in G Major, BWV 843 / Minuet in G major BWV 116 / Minuet in G major BWV 114 piano sheet music pdf` (try Pianocoda first)
- **RH (top staff):**
  - b1: D5 quarter, D5 quarter, D5 quarter
  - b2: B4 quarter, A4 8th, B4 8th, G4 quarter
  - b3: A4 quarter, D5 quarter, C5 quarter
  - b4: B4 half, A4 quarter
  - b5: D5 quarter, C5 8th, B4 8th, A4 8th, G4 8th
  - b6: E5 quarter, C5 8th, B4 8th, A4 8th, G4 8th
  - b7: F#4 quarter, E4 8th, D4 8th, F#4 quarter
  - b8: G4 dotted half
- **LH (bottom staff):**
  - b1: D5 quarter, D5 quarter, D5 quarter
  - b2: B4 quarter, A4 8th, B4 8th, G4 quarter
  - b3: A4 quarter, D5 quarter, C5 quarter
  - b4: B4 half, A4 quarter
  - b5: D5 quarter, C5 8th, B4 8th, A4 8th, G4 8th
  - b6: E5 quarter, C5 8th, B4 8th, A4 8th, G4 8th
  - b7: F#4 quarter, E4 8th, D4 8th, F#4 quarter
  - b8: G4 dotted half

## 2.11 Kabalevsky D.: A Slow Waltz (No 23) from 24 Pieces for Children Op 39 / Waltz (No 13 from 24 Easy Pieces Op 39)

- **On the lists:** PSyllabus:ABRSM=2(ps1); PSyllabus:ABRSM=4(ps3); PSyllabus:AMEB=0(ps1); PSyllabus:AMEB=3(ps3); PSyllabus:GCSE=4(ps3); PSyllabus:NZMEB=1(ps1); PSyllabus:NZMEB=3(ps3); PSyllabus:RCM=1(ps1); PSyllabus:RCM=5(ps3); PSyllabus:SCSM=2(ps3)
- **Candidate file:** `./mxl/17/3/QmZ4h7B9xHfCQ4FHw7ZzBDUkJm4ieRRA6ePMXrgKDK2Jkz.mxl` (title in file: "Waltz"; pdmx; confidence medium; key signature -1 sharps; time 3/4; 33 bars)
- **Search:** `Kabalevsky D. A Slow Waltz (No 23) from 24 Pieces for Children Op 39 / Waltz (No 13 from 24 Easy Pieces Op 39) piano sheet music pdf` (try Pianocoda first)
- **RH (top staff):**
  - b1: A4 quarter
  - b2: D5 half, A4 quarter
  - b3: F5 half, A4 quarter
  - b4: A5 quarter, F5 quarter, E5 quarter
  - b5: D5 half, A4 quarter
  - b6: C5 half, A4 quarter
  - b7: E5 half, A4 quarter
  - b8: A5 dotted half
- **LH (bottom staff):**
  - b1: rest quarter
  - b2: D4+F4 quarter, D4+F4 quarter, rest quarter
  - b3: D4+F4 quarter, D4+F4 quarter, rest quarter
  - b4: D4+F4 quarter, D4+F4 quarter, rest quarter
  - b5: D4+F4 quarter, D4+F4 quarter, rest quarter
  - b6: C4+E4 quarter, C4+E4 quarter, rest quarter
  - b7: C4+E4 quarter, C4+E4 quarter, rest quarter
  - b8: C4+E4 quarter, C4+E4 quarter, rest quarter

## 2.12 Hook J.: Gavotta in C major Op 81 No 3

- **On the lists:** PSyllabus:ABRSM=1(ps1); PSyllabus:AMEB=0(ps1); PSyllabus:LCM=1(ps1); PSyllabus:NZMEB=0(ps1); PSyllabus:RCM=2(ps1)
- **Candidate file:** `./mxl/9/35/QmRoFSajCk4vvaM9QPDeKhwvWCPShtyDB95r2oT5iHc22Y.mxl` (title in file: "Gavotte"; pdmx; confidence medium; key signature 0 sharps; time 4/4; 16 bars)
- **Search:** `Hook J. Gavotta in C major Op 81 No 3 piano sheet music pdf` (try Pianocoda first)
- **RH (top staff):**
  - b1: C5 quarter, C5 quarter, C5 8th, B4 8th, A4 8th, G4 8th
  - b2: C5 quarter, C5 quarter, C5 8th, B4 8th, A4 8th, G4 8th
  - b3: C5 8th, B4 8th, A4 8th, G4 8th, A4 8th, B4 8th, C5 8th, A4 8th
  - b4: D5 8th, C5 8th, B4 8th, A4 8th, G4 half
  - b5: C5 quarter, C5 quarter, C5 8th, B4 8th, A4 8th, G4 8th
  - b6: C5 quarter, C5 quarter, C5 8th, B4 8th, A4 8th, G4 8th
  - b7: C5 8th, B4 8th, A4 8th, G4 8th, A4 8th, B4 8th, C5 8th, A4 8th
  - b8: B4 8th, C5 8th, D5 8th, B4 8th, C5 half
- **LH (bottom staff):**
  - b1: C3 8th, D3 8th, E3 8th, F3 8th, G3 quarter, G3 quarter
  - b2: C3 8th, D3 8th, E3 8th, F3 8th, G3 quarter, G3 quarter
  - b3: E3 half, F3 half
  - b4: D3 half, G3 8th, F3 8th, E3 8th, D3 8th
  - b5: C3 8th, D3 8th, E3 8th, F3 8th, G3 quarter, G3 quarter
  - b6: C3 8th, D3 8th, E3 8th, F3 8th, G3 quarter, G3 quarter
  - b7: E3 quarter, C3 quarter, F3 quarter, D3 quarter
  - b8: G3 half, C3 half

## 2.13 Schumann R.: Humming Song - op 68 no 3 C major

- **On the lists:** PSyllabus:ABRSM=2(ps3); PSyllabus:Piano St=4(ps3); PSyllabus:RIAM=2(ps3); PSyllabus:SCSM=2(ps3)
- **Candidate file:** `./mxl/15/39/QmXQyNvGu83Zv2JKNFRhJgKmHf6MiFmK9CCxibxnr5x2Wm.mxl` (title in file: "hummingsong120"; pdmx; confidence medium; key signature 0 sharps; time 4/4; 24 bars)
- **Search:** `Schumann R. Humming Song - op 68 no 3 C major piano sheet music pdf` (try Pianocoda first)
- **RH (top staff):**
  - b1: E5 quarter, D5 quarter, C5 quarter, D5 quarter
  - b2: E5 quarter, F5 quarter, G5 half
  - b3: F5 quarter, G5 quarter, E5 quarter, F5 quarter
  - b4: D5 quarter, F5 quarter, C5 quarter, D5 quarter
  - b5: E5 quarter, D5 quarter, C5 quarter, D5 quarter
  - b6: E5 quarter, F5 quarter, G5 half
  - b7: F5 quarter, G5 quarter, E5 quarter, F5 quarter
  - b8: D5 half, C5 quarter, rest quarter
- **LH (bottom staff):**
  - b1: C4 8th, G4 8th, B3 8th, G4 8th, A3 8th, G4 8th, B3 8th, G4 8th
  - b2: C4 8th, G4 8th, D4 8th, G4 8th, E4 8th, G4 8th, E4 8th, G4 8th
  - b3: D4 8th, G4 8th, B3 8th, G4 8th, C4 8th, G4 8th, A3 8th, G4 8th
  - b4: B3 8th, G4 8th, D4 8th, G4 8th, A3 8th, G4 8th, B3 8th, G4 8th
  - b5: C4 8th, G4 8th, B3 8th, G4 8th, A3 8th, G4 8th, B3 8th, G4 8th
  - b6: C4 8th, G4 8th, D4 8th, G4 8th, E4 8th, G4 8th, E4 8th, G4 8th
  - b7: D4 8th, G4 8th, B3 8th, G4 8th, C4 8th, G4 8th, A3 8th, G4 8th
  - b8: B3 8th, G4 8th, B3 8th, F4 8th, C4+E4 quarter, rest quarter

## 2.14 Spindler: Song without Words

- **On the lists:** ABRSM=1; PSyllabus:AMEB=0(ps2); PSyllabus:Trinity=2(ps2)
- **Candidate file:** `./mxl/9/5/QmR6EvqAfwKFoN3pUqZoaGcpjeniWGbqPM6G4VMxwVeEHo.mxl` (title in file: "Song without words"; pdmx; confidence medium; key signature 0 sharps; time 3/8; 33 bars)
- **Search:** `Spindler Song without Words piano sheet music pdf` (try Pianocoda first)
- **RH (top staff):**
  - b1: A4 dotted quarter
  - b2: C5 dotted quarter
  - b3: E5 dotted quarter
  - b4: E5 8th, D5 8th, C5 8th
  - b5: B4 dotted quarter
  - b6: D5 8th, C5 8th, B4 8th
  - b7: A4 dotted quarter
  - b8: A4 quarter, rest 8th
- **LH (bottom staff):**
  - b1: A3 8th, C4 8th, E4 8th
  - b2: A3 8th, C4 8th, E4 8th
  - b3: A3 8th, C4 8th, E4 8th
  - b4: A3 8th, C4 8th, E4 8th
  - b5: G#3 8th, D4 8th, E4 8th
  - b6: G#3 8th, D4 8th, E4 8th
  - b7: A3 8th, C4 8th, E4 8th
  - b8: A3 8th, C4 8th, E4 8th

## 2.15 Armstrong J.: Dusty Blue

- **On the lists:** PSyllabus:ABRSM=2(ps2); PSyllabus:LCM=1(ps2)
- **Candidate file:** `./mxl/17/26/QmZjFTWZhtvzmkVnXk5M7PGBgGBVP69KMs7ZhNXCUwJuqx.mxl` (title in file: "Dusty Blue"; pdmx; confidence medium; key signature 1 sharps; time 4/4; 13 bars)
- **Search:** `Armstrong J. Dusty Blue piano sheet music pdf` (try Pianocoda first)
- **RH (top staff):**
  - b1: rest triplet 8th, D4 triplet 8th, D4 triplet 8th, E4 triplet 8th, D4 triplet 8th, E4 triplet 8th
  - b2: F#4 0 beats, G4 quarter, rest quarter, rest triplet 8th, D4 triplet 8th, D4 triplet 8th, E4 triplet 8th, D4 triplet 8th, E4 triplet 8th
  - b3: F#4 0 beats, G4 quarter, rest quarter, rest triplet 8th, rest triplet 8th, D4 triplet 8th, E4 triplet quarter, D4 triplet 8th
  - b4: G4 quarter, A4 quarter, B4 quarter, D5 quarter
  - b5: rest triplet 8th, rest triplet 8th, E5 0 beats, F5 triplet 8th, F5 triplet quarter, E5 triplet 8th, D5 quarter, D5 triplet 8th, E5 triplet 8th, D5 triplet 8th
  - b6: F#5 0 beats, G5 quarter, rest quarter, rest triplet 8th, rest triplet 8th, F5 triplet 8th, D5 triplet quarter, C5 triplet 8th
  - b7: A4 0 beats, Bb4 triplet quarter, G4 triplet 8th, rest half, rest triplet 8th, rest triplet 8th, G4 triplet 8th
  - b8: A#4 0 beats, B4 triplet quarter, D5 triplet 8th, rest half, E5 triplet quarter, D5 triplet 8th
- **LH (bottom staff):**
  - b1: rest half
  - b2: G2+D3 quarter, G2+E3 quarter, G2+D3 quarter, G2+E3 quarter
  - b3: G2+D3 quarter, G2+E3 quarter, G2+D3 quarter, G2+E3 quarter
  - b4: G2+D3 quarter, G2+E3 quarter, G2+D3 quarter, G2+E3 quarter
  - b5: G2+D3 quarter, G2+E3 quarter, G2+D3 quarter, G2+E3 quarter
  - b6: C3+G3 quarter, C3+A3 quarter, C3+G3 quarter, C3+A3 quarter
  - b7: C3+G3 quarter, C3+A3 quarter, C3+G3 quarter, C3+A3 quarter
  - b8: G2+D3 quarter, G2+E3 quarter, G2+D3 quarter, G2+E3 quarter

## 2.16 Bach, Carl Philipp Emanuel: Minuet in E flat Major, H 171 / Minuet in Eb major H 171

- **On the lists:** PSyllabus:RCM=2(ps2); RCM=2
- **Candidate file:** `./mxl/8/29/QmQKQtmH8DsnA5gc9vu2x1tgZeTdX2gXLP43id8LnKKREH.mxl` (title in file: "Minuet_in_C_Minor"; pdmx; confidence medium; key signature -3 sharps; time 3/4; 24 bars)
- **Search:** `Bach, Carl Philipp Emanuel Minuet in E flat Major, H 171 / Minuet in Eb major H 171 piano sheet music pdf` (try Pianocoda first)
- **RH (top staff):**
  - b1: C5 quarter, C5 quarter, D5 quarter
  - b2: Eb5 quarter, Eb5 quarter, F5 quarter
  - b3: G5 quarter, G5 quarter, Ab5 quarter
  - b4: F#5 half, E5 0 beats, F#5 0 beats, G5 quarter
  - b5: G5 8th, Ab5 8th, F5 8th, E5 8th, F5 quarter
  - b6: F5 8th, G5 8th, Eb5 8th, D5 8th, Eb5 quarter
  - b7: C5 8th, B4 8th, C5 quarter, D5 quarter
  - b8: G4 half, rest quarter
- **LH (bottom staff):**
  - b1: C3 half, rest quarter
  - b2: C3 quarter, C3 quarter, D3 quarter
  - b3: Eb3 quarter, Eb3 quarter, C3 quarter
  - b4: D3 quarter, C3 quarter, B2 quarter
  - b5: Bb2 half, A2 quarter
  - b6: Ab2 half, G2 quarter
  - b7: Ab2 half, F2 quarter
  - b8: G2 quarter, G3 8th, F3 8th, Eb3 8th, D3 8th

## 2.17 John Lennon: Imagine

- **On the lists:** RSL Keys=0; Trinity Rock & Pop=2
- **Candidate file:** `./mxl/8/9/QmQaNdd9Nnu2GC5YKEJhC8eWNBoyRrdk3s46DvbY4Kd37A.mxl` (title in file: "Imagine John Lennon"; pdmx; confidence medium; key signature 0 sharps; time 4/4; 17 bars)
- **Search:** `John Lennon Imagine piano sheet music pdf` (try Pianocoda first)
- **RH (top staff):**
  - b1: E4+G4 8th, C4 8th, E4+G4 8th, C4 8th, E4+G4 8th, C4 8th, G4+B4 8th, C4 8th
  - b2: F4+A4 8th, C4 8th, F4+A4 8th, C4 8th, F4+A4 8th, C4 8th, A4 16th, A#4 16th, B4 8th
  - b3: E4+G4 8th, C4 8th, E4+G4 8th, C4 8th, E4+G4 8th, C4 8th, G4+B4 8th, C4 8th
  - b4: F4+A4 8th, C4 8th, F4+A4 8th, C4 8th, F4+A4 8th, C4 8th, F4+A4 8th, C4 8th
  - b5: A4+C5 8th, F4 8th, A4+C5 8th, F4 8th, G4+B4 8th, E4 8th, G4+B4 8th, E4 8th
  - b6: F4+A4 8th, D4 8th, F4+A4 8th, D4 8th, F4+A4 8th, C4 8th, F4+A4 8th, C4 8th
  - b7: B3+D4 8th, G3 8th, B3+D4 8th, G3 8th, B3+D4 8th, G3 8th, C4+E4 8th, G3 8th
  - b8: D4+F4 whole, G3 whole
- **LH (bottom staff):**
  - b1: E4+G4 8th, C4 8th, E4+G4 8th, C4 8th, E4+G4 8th, C4 8th, G4+B4 8th, C4 8th
  - b2: F4+A4 8th, C4 8th, F4+A4 8th, C4 8th, F4+A4 8th, C4 8th, A4 16th, A#4 16th, B4 8th
  - b3: E4+G4 8th, C4 8th, E4+G4 8th, C4 8th, E4+G4 8th, C4 8th, G4+B4 8th, C4 8th
  - b4: F4+A4 8th, C4 8th, F4+A4 8th, C4 8th, F4+A4 8th, C4 8th, F4+A4 8th, C4 8th
  - b5: A4+C5 8th, F4 8th, A4+C5 8th, F4 8th, G4+B4 8th, E4 8th, G4+B4 8th, E4 8th
  - b6: F4+A4 8th, D4 8th, F4+A4 8th, D4 8th, F4+A4 8th, C4 8th, F4+A4 8th, C4 8th
  - b7: B3+D4 8th, G3 8th, B3+D4 8th, G3 8th, B3+D4 8th, G3 8th, C4+E4 8th, G3 8th
  - b8: D4+F4 whole, G3 whole

## 2.18 Joseph Haydn: German Dance, Hob IX:12 no. 1 / German Dance Hob IX8 No 8

- **On the lists:** PSyllabus:PS=1(ps2); Trinity=2
- **Candidate file:** `./mxl/9/56/QmRzePkxGBAmdoUiwKa6KnBBUQKyJZkfwqy9PFbfzWJpCy.mxl` (title in file: "Haydn - German dance"; pdmx; confidence medium; key signature 0 sharps; time 3/4; 36 bars)
- **Search:** `Joseph Haydn German Dance, Hob IX:12 no. 1 / German Dance Hob IX8 No 8 piano sheet music pdf` (try Pianocoda first)
- **Already settled:** WRONG PIECE, broken file (pilot)
- **RH (top staff):**
  - b1: E5 8th, F5 8th
  - b2: G5 quarter, G5 quarter, E5 8th, F5 8th
  - b3: G5 quarter, G5 quarter, C6 quarter
  - b4: B5 8th, C6 8th, D6 8th, C6 8th, B5 8th, A5 8th
  - b5: G5 quarter, G5 quarter, D5 8th, E5 8th
  - b6: F5 quarter, F5 quarter, A5 8th, G5 8th
  - b7: F5 quarter, F5 quarter, F5 quarter
  - b8: E5 8th, F5 8th, G5 8th, F5 8th, E5 8th, D5 8th
- **LH (bottom staff):**
  - b1: E5 8th, F5 8th
  - b2: G5 quarter, G5 quarter, E5 8th, F5 8th
  - b3: G5 quarter, G5 quarter, C6 quarter
  - b4: B5 8th, C6 8th, D6 8th, C6 8th, B5 8th, A5 8th
  - b5: G5 quarter, G5 quarter, D5 8th, E5 8th
  - b6: F5 quarter, F5 quarter, A5 8th, G5 8th
  - b7: F5 quarter, F5 quarter, F5 quarter
  - b8: E5 8th, F5 8th, G5 8th, F5 8th, E5 8th, D5 8th

## 2.19 Purcell, Henry: Hornpipe, ZT 685 / Hornpipe in E minor, Z 685

- **On the lists:** RCM=2; Trinity=2
- **Candidate file:** `./mxl/13/36/QmVpdcjWdND2L9S47zwYHzUVhhShG2gqGjqCQeuhZMstXB.mxl` (title in file: "Purcell: Hornpipe"; pdmx; confidence medium; key signature 1 sharps; time 3/4; 15 bars)
- **Search:** `Purcell, Henry Hornpipe, ZT 685 / Hornpipe in E minor, Z 685 piano sheet music pdf` (try Pianocoda first)
- **RH (top staff):**
  - b1: E5 16th, F#5 16th
  - b2: G5 8th, E5 8th, E5 8th, D5 16th, C5 16th, B4 16th, C5 16th, D5 8th
  - b3: E5 8th, E4 8th, E4 8th, F#4 16th, G4 16th, A4 8th, B4 16th, C5 16th
  - b4: B4 8th, E5 16th, D5 16th, C5 16th, B4 16th, A4 16th, G4 16th, F#4 16th, G4 16th, A4 16th, F#4 16th
  - b5: G4 8th, E4 8th, E4 8th, B4 8th, E5 8th
  - b6: G5 16th, F#5 16th
  - b7: E5 8th, G5 8th, G5 8th, F#5 16th, E5 16th, D5 16th, E5 16th, D5 16th, C5 16th
  - b8: B4 8th, D5 8th, D5 8th, D5 16th, E5 16th, D5 16th, C5 16th, B4 16th, A4 16th
- **LH (bottom staff):**
  - b1: rest 8th
  - b2: E3 half, D3 quarter, rest quarter, E2 quarter, rest quarter
  - b3: C3 dotted quarter, B2 8th, A2 quarter, rest quarter, C2 8th, rest 8th
  - b4: G2 quarter, A2 quarter, B2 quarter
  - b5: E3 half, E3 8th, rest quarter, B2 quarter, E2 8th
  - b6: rest 8th
  - b7: E3 half, rest quarter, rest quarter, E2 quarter, F#3 quarter
  - b8: G3 half, rest quarter, rest quarter, G2 quarter, A2 quarter

## 2.20 Christian Petzold: Minuet in G minor

- **On the lists:** Trinity=2
- **Candidate file:** `./mxl/13/51/QmVWM6wbvpu5KUmBMSMconXZsAM3AAay5LdxCNFzKpQt7g.mxl` (title in file: "Minuet BWV 115"; pdmx; confidence medium; key signature -2 sharps; time 3/4; 32 bars)
- **Search:** `Christian Petzold Minuet in G minor piano sheet music pdf` (try Pianocoda first)
- **RH (top staff):**
  - b1: Bb5 quarter, A5 quarter, G5 quarter
  - b2: A5 quarter, D5 quarter, D5 quarter
  - b3: G5 quarter, G4 8th, A4 8th, Bb4 8th, C5 8th
  - b4: D5 dotted half
  - b5: Eb5 quarter, F5 8th, Eb5 8th, D5 8th, C5 8th
  - b6: D5 quarter, Eb5 8th, D5 8th, C5 8th, Bb4 8th
  - b7: C5 quarter, D5 8th, C5 8th, Bb4 8th, C5 8th
  - b8: A4 half, rest quarter
- **LH (bottom staff):**
  - b1: G3 dotted half
  - b2: Eb3 dotted half
  - b3: D3 dotted half
  - b4: D3 quarter, D4 8th, C4 8th, Bb3 8th, A3 8th
  - b5: G3+Bb3 half, A3 quarter
  - b6: Bb3 half, G3 quarter
  - b7: A3 quarter, F#3 quarter, G3 quarter
  - b8: D3 quarter, D4 8th, C4 8th, Bb3 8th, A3 8th

## 2.21 Imagine Dragons: Radioactive

- **On the lists:** RSL Keys=2
- **Candidate file:** `./mxl/11/50/QmTwGSN3sTvj2bqqJD3Vy8pzArHwkCNeRhz68GqveUyFJJ.mxl` (title in file: "Radioactive"; pdmx; confidence medium; key signature 3 sharps; time 4/4; 76 bars)
- **Search:** `Imagine Dragons Radioactive piano sheet music pdf` (try Pianocoda first)
- **RH (top staff):**
  - b1: B3 8th, A3 8th, B3 8th, D4 quarter, A3 8th, B3 8th, E4 8th
  - b2: B3 8th, A3 8th, B3 8th, F#4 quarter, B3 8th, A3 8th, B3 8th
  - b3: B3 8th, A3 8th, B3 8th, D4 quarter, A3 8th, B3 8th, E4 8th
  - b4: B3 8th, A3 8th, B3 8th, D4 quarter, B3 8th, A3 8th, B3 8th
  - b5: B3 8th, A3 8th, B3 8th, D4 quarter, A3 8th, B3 8th, E4 8th
  - b6: B3 8th, A3 8th, B3 8th, F#4 quarter, B3 8th, A3 8th, B3 8th
  - b7: B3 8th, A3 8th, B3 8th, D4 quarter, A3 8th, B3 8th, A4 8th
  - b8: A4 8th, B3 8th, A3 8th, B3 8th, D4 8th, B3 8th, A3 8th, B3 8th
- **LH (bottom staff):**
  - b1: B2 whole
  - b2: D3 whole
  - b3: A2 whole
  - b4: E3 whole
  - b5: B1+F#2+B2 half, B2+D3 quarter, B2 8th, F#2 8th
  - b6: D2+A2+D3 half, D3+F#3 quarter, D3 8th, A2 8th
  - b7: A1+E2+A2 half, A2+C#3 quarter, A2 8th, E2 8th
  - b8: E2+B2+E3 half, E3+G#3 quarter, E3 8th, B2 8th

## 2.22 Koji Kondo: The Legend of Zelda: Main Theme

- **On the lists:** Trinity=2
- **Candidate file:** `./mxl/12/0/QmU1nszC4coRA3qvzTpZW7MeKGb5D7P1GqvcGA6ZVr4uXd.mxl` (title in file: "The Legend Of Zelda - Main Theme"; pdmx; confidence medium; key signature -5 sharps; time 4/4; 75 bars)
- **Search:** `Koji Kondo The Legend of Zelda: Main Theme piano sheet music pdf` (try Pianocoda first)
- **RH (top staff):**
  - b1: Bb4 half, Bb4 dotted 8th, Bb4 16th, Bb4 triplet 16th, rest triplet 16th, Bb4 triplet 16th, rest triplet 16th, Bb4 triplet 16th, rest triplet 16th
  - b2: Eb4+Bb4 triplet 8th, rest triplet 8th, Eb4+Ab4 triplet 8th, Eb4+Bb4 half, Eb4+Bb4 triplet 16th, rest triplet 16th, Eb4+Bb4 triplet 16th, rest triplet 16th, Eb4+Bb4 triplet 16th, rest triplet 16th
  - b3: rest quarter, Bb4 half, rest quarter, Db4+Gb4+Bb4 triplet 8th, rest triplet 8th, Db4+Gb4+Ab4 triplet 8th, Db4+Gb4 half, Db4+Gb4+Bb4 triplet 16th, rest triplet 16th, Db4+Gb4+Bb4 triplet 16th, rest triplet 16th, Db4+Gb4+Bb4 triplet 16th, rest triplet 16th
  - b4: C4+F4+A4 8th, F4 16th, F4 16th, F4 8th, F4 16th, F4 16th, F4 8th, F4 16th, F4 16th, C4+F4 8th, C4+F4 8th
  - b5: F4+Bb4 quarter, F4 quarter, F4 8th, Bb4 8th, Bb4 16th, C5 16th, D5 16th, Eb5 16th
  - b6: F5 half, F5 dotted 8th, F5 16th, F5 triplet 8th, Gb5 triplet 8th, Ab5 triplet 8th
  - b7: Bb5 half, Bb5 triplet 8th, Bb5 triplet 8th, Bb5 triplet 8th, Bb5 triplet 8th, Ab5 triplet 8th, Gb5 triplet 8th
  - b8: Db5+Ab5 triplet 8th, rest triplet 8th, Gb5 triplet 8th, F5 half, Db5+F5 quarter
- **LH (bottom staff):**
  - b1: F3+Bb3+D4 dotted half, F3+Bb3+D4 triplet 16th, rest triplet 16th, F3+Bb3+D4 triplet 16th, rest triplet 16th, F3+Bb3+D4 triplet 16th, rest triplet 16th
  - b2: Eb3+Ab3+C4 dotted half, Eb3+Ab3+C4 triplet 16th, rest triplet 16th, Eb3+Ab3+C4 triplet 16th, rest triplet 16th, Eb3+Ab3+C4 triplet 16th, rest triplet 16th
  - b3: Db3+Gb3+Bb3 dotted half, Db3+Gb3+Bb3 triplet 16th, rest triplet 16th, Db3+Gb3+Bb3 triplet 16th, rest triplet 16th, Db3+Gb3+Bb3 triplet 16th, rest triplet 16th
  - b4: F2+F3 quarter, F2+C3+F3 quarter, G2+A2+F3+G3 quarter, A2+C3+F3+A3 quarter
  - b5: D3+F3+Bb3 quarter, rest 8th, D3 8th, F3 8th, Bb3 8th, D4 8th, Bb3 8th
  - b6: Db3+F3+Ab3 quarter, F3 8th, Db3 8th, Ab2 8th, Db3 8th, F3 8th, Ab3 8th
  - b7: Db3+Gb3+Bb3 quarter, Bb3 triplet 8th, Gb3 triplet 8th, Db3 triplet 8th, Bb2 triplet 8th, Db3 triplet 8th, Bb3 triplet 8th, Gb3 triplet 8th, Db3 triplet 8th, Gb2 triplet 8th
  - b8: Ab2+Db3+F3 quarter, F4 triplet 8th, Db4 triplet 8th, Ab3 triplet 8th, F3 quarter, Db3+F3+Ab3 quarter

## 2.23 MARK RONSON FEATURING BRUNO MARS: Uptown Funk

- **On the lists:** Trinity Rock & Pop=2
- **Candidate file:** `./mxl/8/46/QmQuj3qwsYcYAba4B3GknuWjS3bHfkrcGAFb5NCWUfxro5.mxl` (title in file: "uptown funk"; pdmx; confidence medium; key signature -1 sharps; time 4/4; 378 bars)
- **Search:** `MARK RONSON FEATURING BRUNO MARS Uptown Funk piano sheet music pdf` (try Pianocoda first)
- **RH (top staff):**
  - b1: rest quarter, rest quarter
  - b2: C5+F5 dotted 8th, C5+F5 16th, rest quarter, C5+F5 dotted 8th, C5+F5 16th, rest quarter
  - b3: B4+F5 dotted 8th, B4+F5 16th, rest 8th, B4+F5 8th, rest 8th, B4+F5 dotted quarter
  - b4: C5+F5 dotted 8th, C5+F5 16th, rest quarter, C5+F5 dotted 8th, C5+F5 16th, rest quarter
  - b5: B4+F5 dotted 8th, B4+F5 16th, rest 8th, B4+F5 8th, rest 8th, B4+F5 8th, F5 16th, F5 16th, rest 8th
  - b6: F5 dotted 8th, F5 16th, rest 8th, C5 8th, D5 dotted 8th, D5 16th, rest 8th, C5 8th
  - b7: D5 dotted 8th, D5 16th, rest 8th, D5 16th, C5 8th, D5 dotted 8th, D5 16th, rest 8th, rest 8th
  - b8: F5 dotted 8th, F5 16th, rest 8th, C5 16th, C5 8th, D5 dotted 8th, D5 16th, rest 8th, C5 8th
- **LH (bottom staff):**
  - b1: rest quarter, rest quarter
  - b2: C5+F5 dotted 8th, C5+F5 16th, rest quarter, C5+F5 dotted 8th, C5+F5 16th, rest quarter
  - b3: B4+F5 dotted 8th, B4+F5 16th, rest 8th, B4+F5 8th, rest 8th, B4+F5 dotted quarter
  - b4: C5+F5 dotted 8th, C5+F5 16th, rest quarter, C5+F5 dotted 8th, C5+F5 16th, rest quarter
  - b5: B4+F5 dotted 8th, B4+F5 16th, rest 8th, B4+F5 8th, rest 8th, B4+F5 8th, F5 16th, F5 16th, rest 8th
  - b6: F5 dotted 8th, F5 16th, rest 8th, C5 8th, D5 dotted 8th, D5 16th, rest 8th, C5 8th
  - b7: D5 dotted 8th, D5 16th, rest 8th, D5 16th, C5 8th, D5 dotted 8th, D5 16th, rest 8th, rest 8th
  - b8: F5 dotted 8th, F5 16th, rest 8th, C5 16th, C5 8th, D5 dotted 8th, D5 16th, rest 8th, C5 8th

## 2.24 Sam Smith & Jimmy Napes: Writing's on the Wall (from Spectre) (Sam Smith)

- **On the lists:** Trinity=2
- **Candidate file:** `./mxl/4/19/Qmefzkf62X872kvmxmwSifjtzMULe6p9uA3PG2rAsYzCXs.mxl` (title in file: "Writing's On The Wall"; pdmx; confidence medium; key signature -4 sharps; time 4/4; 72 bars)
- **Search:** `Sam Smith & Jimmy Napes Writing's on the Wall (from Spectre) (Sam Smith) piano sheet music pdf` (try Pianocoda first)
- **RH (top staff):**
  - b1: rest quarter, G4+G5 8th, F4+F5 8th, C4+C5 dotted quarter, Bb3+Bb4 8th, Ab3+C4+G4 whole
  - b2: C4+C5 dotted quarter, C4 8th, C4+Bb4 quarter, C4+Ab4 8th, C4+G4 8th
  - b3: rest 8th, F4 8th, G4+G5 8th, F4+F5 8th, E4+E5 8th, F4+F5 8th, C4+C5 8th, Bb3+Bb4 8th, C4+Eb4 whole
  - b4: Bb3+Bb4 8th, C4+C5 dotted quarter, C4+C5 half
  - b5: G4 8th, C4 16th, Ab3 16th, G4 8th, C4 16th, Ab3 16th, G4 8th, C4 16th, Ab3 16th, G4 8th, C4 16th, Ab3 16th
  - b6: G4 8th, C4 16th, Ab3 16th, G4 8th, C4 16th, Ab3 16th, G4 8th, C4 16th, Ab3 16th, G4 8th, C4 16th, Ab3 16th
  - b7: G4 8th, C4 16th, Ab3 16th, G4 8th, C4 16th, Ab3 16th, G4 8th, C4 16th, Ab3 16th, G4 8th, C4 16th, Ab3 16th
  - b8: G4 8th, C4 16th, Ab3 16th, G4 8th, C4 16th, Ab3 16th, G4 8th, C4 16th, Ab3 16th, G4 8th, C4 16th, Ab3 16th
- **LH (bottom staff):**
  - b1: F2+F3 whole
  - b2: Ab2+C3+Eb3+Ab3 whole
  - b3: F2+F3 quarter, F3+Ab3+C4 half, F3+Ab3 quarter
  - b4: Ab2+C3+Eb3+Ab3 whole
  - b5: F2+C3+G3 whole
  - b6: Ab2+Eb3+G3 whole
  - b7: F2+C3+G3 whole
  - b8: Ab2+Eb3+G3 whole
