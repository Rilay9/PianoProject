# CF2: content placement — the harmony a score states (N3) — hand-back

## Preflight

| Item | Answer |
|---|---|
| Plan step | CF2 |
| Unit of work | A small music21 reader of the harmony N3's options state |
| Learner problem | "First chords: C, F and G" offers songs whose chords are other chords, and nothing says so |
| Disposition | music21 KEEP: it parses the chord symbols, names the chords and their Roman numerals. Whether a piece belongs on the rung is CURATE and is not decided here |
| Finish condition | The facts for rung 2.3's options, each fact tested on a score built to have it, handed back for curation |

## Reuse gate, as run

1. **Should PianoProject own this?** Not the harmony facts themselves: music21's `harmony.ChordSymbol` and `roman.romanNumeralFromChord` supply them.
2. **What the project does own:**
   - which explicit evidence counts: printed symbols first, else chords written as three or more notes, else none;
   - that "none" stays **unknown**. A tune's notes are never harmonised.
3. **No new schema, report, build step or rung vocabulary.** "Literally C, F and G" is the rung's title read as written, {C, F, G, G7}. "Primary" is {I, IV, V, V7}.
4. **Known issues seen for this use:**
   - music21 spells a flat with "-" in symbols, and the reader prints it as "b".
   - It names *Dark Eyes*' Gm6 as ii7 in D minor. Gm6 has the same notes as E half-diminished 7, so that is music21's reading of the notes, not the edition's label.
5. **Mechanical or judgement?** The facts below are mechanical. Placement is judgement.

## What changed

- `tools/content/harmony_facts.py` reports, per item:
  - the key;
  - where the harmony comes from: `symbols`, `written` or `none`;
  - the chords;
  - `literalCFG`;
  - the numerals;
  - `primaryOnly`.

  Usage: `python3 tools/content/harmony_facts.py <id> ...`.
- `tests/test_harmony_facts.py` tests each fact on a score built to have it, plus a stray chord and the two unknown cases.

## The facts for rung 2.3 (read from the built content at this commit)

| Option | Key (row) | Harmony from | Chords | Literally C/F/G | Numerals | Primary only |
|---|---|---|---|---|---|---|
| Happy Birthday (simple) | C major | symbols | C, F, G7 | yes | I, IV, V7 | yes |
| Happy Birthday | C major | symbols | C, G7 | yes | I, V7 | yes |
| Jingle Bells (in G, block chords) | "1 sharp" | symbols | C, D7, G | no | unknown: the row gives no mode | unknown |
| Was wollen wir trinken | A minor | symbols | Am, C, Dm, G | no | i, III, iv, VII | no |
| Dark Eyes | D minor | symbols | A7, B♭, Dm, Gm6 | no | i, ii7, V7, VI | no |
| Auld Lang Syne | E♭ major | symbols | A♭, B♭7, Cm, E♭, Fm | no | I, ii, IV, V7, vi | no |
| Skip to My Lou | D major | symbols | A, D | no | I, V | yes |
| Cadence, root position | C major | written | C, F, G7 | yes | I, IV, V7 | yes |
| Cadence, voice-led | C major | written | C, F, G7 | yes | I, IV, V7 | yes |

## For curation (no one here decides placement from this table)

- **Two songs, both Happy Birthdays, and both cadences use the rung's own chords literally.**
- **Skip to My Lou uses primary chords in D.** Jingle Bells in G prints G, C and D7, which would be I, IV and V7 in G major. The row's `keySig` says only "1 sharp", so the reader leaves its function unknown. Both are transfer candidates, if the rung teaches I–IV–V beyond C. The lesson already uses them that way.
- **Three songs state chords outside I, IV and V:**
  - *Was wollen wir trinken*: minor, with III and VII;
  - *Dark Eyes*: minor, with VI and a ii7;
  - *Auld Lang Syne*: E♭ major, with ii and vi.

  Whether they stay on this rung is a curation decision. This step moved no song.
- **Corrections to the earlier hand reading.** The earlier read of rung 2.3 is in the plan's evidence section, and its table is wrong. *Was wollen wir trinken* also prints C and Dm, and *Auld Lang Syne* also prints Cm and Fm. The table above is what music21 reads from the whole of each file.

## Evidence for later steps, not acted on

- **A catalogue `keySig` with no mode.** Jingle Bells (G) reads "1 sharp" where other rows read "C major". Any reader of the key, the app included, gets no mode from it. That is a catalogue-metadata question, left for CF4 to assess as a class.
- **Not wired into the build or the rung report.** Doing that would be scaling, which is CF4's job.
