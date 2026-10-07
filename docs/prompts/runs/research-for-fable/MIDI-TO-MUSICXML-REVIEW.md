# MIDI → MusicXML workflow review for bulk song imports

Research/review only, 2026-10-03. No product code was changed.

This pass re-read the current Python and browser converters and their tests with a different expected input in mind: not only a live two-hand piano performance, but a folder of downloaded/exported song MIDIs, including dense rock/metal arrangements. That changes the answer materially.

## Bottom line

The current converter is a thoughtful **piano-performance cleanup/transcription path**. Its quantisation, hand splitting, tie reconstruction and self-check were designed and tested around MAESTRO Disklavier performances, score-rendered MIDI with timing jitter, and tiny piano fixtures.

It is **not yet a safe general song-MIDI → piano MusicXML path**.

The shortest fix is not to make one converter smarter at everything. Split the responsibility:

1. **Score-like MIDI** (DAW/MuseScore/Guitar Pro/exported arrangements, usually quantised and structured): preserve track/channel/program, PPQ, tempo/meter/key events and written subdivisions; select the piano/keyboard material before conversion; preserve voices where possible; do not run performance cleanup unless requested.
2. **Live/performance MIDI** (one piano performance, expressive timing): keep the existing quantise → hand-split → slice/rebuild logic, with a few bugs fixed.
3. **Band MIDI with no piano reduction**: do not silently turn the whole band into a piano part. That is an arrangement/reduction problem, not a MIDI-format conversion problem.

For the owner's planned Avenged Sevenfold MIDI batch, this distinction is the most important finding.

---

## 1. What the current path actually does well

The browser path is:

`readMidi.ts → quantise.ts → handSplit.ts (sometimes) → slice.ts/notatable.ts → key.ts → musicXmlWriter.ts → readBackMusicXml → importStore`

The Python command follows the same policy in `tools/midi-cleanup/midi_to_musicxml.py`.

Good properties worth preserving:

- reads NOTE_ON/OFF directly rather than trusting a MIDI→score reconstruction that can invent tied note objects;
- quantises once per bar rather than independently per note;
- has explicit triplet and straight-grid handling;
- reconstructs ties across slice/bar boundaries rather than re-striking sustained notes;
- has a moving hand split rather than fixed middle C;
- refuses/flags durations the writer cannot represent instead of silently pretending success;
- compares the emitted score back against the quantised events for note/onset/duration loss;
- stamps converter version/provenance;
- tells the user that hand splitting is uncertain;
- Python and TS ports are held in parity.

Those are good safeguards for the original live-piano problem.

---

## 2. Critical mismatch for multitrack/song MIDI

### 2.1 MIDI channel and instrument identity are thrown away

`app/src/import/midi/readMidi.ts` stores a `MidiTrack` as only:

- index;
- name;
- note events.

For channel messages it computes `high = status & 0xf0`, which deliberately discards the low four channel bits. Program changes are skipped. Control changes and pitch bends are consumed but not retained.

The Python path has the same conceptual problem for this use: its open-note identity is pitch-centric and it does not preserve a normalized track/channel/program structure for later selection.

For a full-band MIDI this is not a cosmetic omission. A format-0 file can carry piano, guitar, bass and drums on different channels inside one MIDI track. Once channel/program identity is discarded, all those notes become one anonymous note stream.

Consequences:

- channel-10 percussion can become pitched “piano” notes;
- guitar, bass and keyboard can be merged into the same apparent piano recording;
- the same pitch on two simultaneous channels can collide in pitch-keyed open-note bookkeeping;
- there is no principled way later to say “keep the keyboard part, ignore drums/guitar.”

This is the largest blocker for generic song MIDI.

### 2.2 The MIDI format number is discarded

`readMidi.ts` advances over the SMF format field rather than retaining it.

That loses a highly useful distinction:

- format 0: one track can contain many channels/instruments;
- format 1: conductor/meta track plus multiple synchronous musical tracks is common;
- format 2: independent sequences require different handling.

The import preflight should know which case it has before deciding what a “track” means.

### 2.3 Two note tracks are trusted as the two piano hands

`convert.ts` deliberately keeps exactly two note tracks “as recorded”: first becomes upper staff, second lower.

That is a good rule for a hand-separated piano MIDI. It is not a safe rule for arbitrary song MIDI. Two tracks can just as easily mean melody+bass, guitar+bass, piano+vocal guide, etc.

There is no program/channel/instrument check before declaring them upper/lower piano staves.

### 2.4 Three or more note tracks are merged before hand splitting

For the current piano-oriented importer, `>=3` note tracks are merged and the combined line is handed to the pitch/voice-leading splitter.

On a multitrack song MIDI this can merge drums, bass, guitars, strings, keyboards and guide tracks before asking a two-hand algorithm to make a piano score.

That is not conversion; it is an accidental piano reduction.

**Required product distinction:** choose source tracks first. If there is no piano/keyboard reduction in the file, either ask the user which tracks to use or route to a future reduction/arrangement tool. Never auto-merge the whole band and label the result piano.

---

## 3. Tempo, meter and key maps are collapsed too aggressively

### 3.1 Only the first tempo survives MIDI import

`readMidi.ts` records only the first SET_TEMPO. `convert.ts` writes one opening BPM.

PianoProject's MusicXML playback code now supports actual tempo maps and later tempo changes, so the converter is behind the rest of the app here.

A song MIDI with ritardando, tempo changes, double-time sections, etc. loses that map even though the MIDI contains it.

Tempo changes do not change MIDI tick positions, so note placement can still be metrically correct, but playback and printed tempo information are wrong/incomplete.

### 3.2 Only the first time signature survives—and this *does* affect notation

The reader keeps only the first 0x58 time-signature event. `convert.ts` computes one constant `barLength` and `beat` for the entire score.

A later meter change therefore makes every subsequent bar boundary/quantisation decision wrong.

For progressive/metal material this is a real concern, not an exotic edge case.

### 3.3 Key signatures are recorded only as counts, without mode or position, and are ignored for the written key

MIDI key-signature meta event 0x59 has both fifths and a major/minor byte. The current reader stores strings such as `1 sharp`, loses mode and event position, and uses them only in the report.

The written key instead comes from a global Aarden–Essen estimate plus the last bass-note relative-major/minor tiebreak, unless the caller passes an explicit key. The app import path does not pass one.

For strongly chromatic or modulating music this can produce poor global spelling even when the source MIDI stated a key.

**Simpler rule:** preserve every key-signature event. If the source explicitly states an opening key/mode, prefer that as source evidence. Preserve later key changes. Estimate only when the file says nothing, and report that it is an estimate.

---

## 4. Score-like MIDI and live-performance MIDI should not share one quantiser

The current defaults are `divisors=[4,3]`: nearest sixteenth or eighth-note triplet grid, selected once per bar.

That was built for a performance transcription problem. It is unnecessarily destructive for a MIDI exported from notation/DAW software whose ticks may already encode exact score timing.

### 4.1 Mixed subdivisions in one bar

One grid is chosen per bar. A bar containing both straight sixteenths and explicit triplets has to choose one grid, so one family can be moved to fit the other.

### 4.2 32nd notes

The browser MusicXML writer uses `DIVISIONS=12` per quarter. A 32nd note is `1/8` quarter, so its MusicXML duration would be 1.5 divisions and cannot be represented by that fixed timebase.

The writer's note-type vocabulary includes `32nd`, but the fixed integer-duration representation still prevents an exact 32nd.

This can be solved without changing every generated score: let imported MusicXML choose a larger/adaptive divisions value (for example 24/48 or the least common multiple needed by the selected MIDI subdivisions), while leaving existing generated identities on 12 unless deliberately migrated.

### 4.3 Better score-like behavior already exists in mature libraries

Partitura's `load_score_midi` is specifically for MIDI that already represents score time. It:

- preserves track/channel structure through configurable part/voice modes;
- can return one part per track, one part per track+channel, etc.;
- estimates voices with Chew/Wu when wanted;
- estimates pitch spelling with PS13;
- chooses a quantisation unit automatically from PPQ when one is not supplied;
- can save score data to MusicXML.

Partitura itself warns not to expect a performance MIDI to become a correct score automatically. That is exactly why it is a good candidate for the **score-like** branch and not a replacement for the performance branch.

Music21 also supports configurable MIDI quantisation divisors and conductor/time-signature insertion, but its default MIDI conversion uses the same `(4,3)` quantisation assumption as PianoProject, so simply calling `converter.parse(mid)` is not the bulk-song solution by itself.

---

## 5. Clear swing-detection false positive

`detectSwing()` currently calls a run swung when:

- enough notes are near the beat;
- at least 8 offbeats are near `2/3` of a beat;
- those `2/3` positions outnumber positions near `1/2` by 2:1.

It never asks how many attacks occur near `1/3`.

That means an explicit triplet pattern at `0, 1/3, 2/3` can satisfy the swing test and have its `2/3` notes moved to `1/2` by `deswing()`.

The same problem is especially obvious in 6/8: `beatLengthOf()` correctly treats a dotted quarter as the beat, so ordinary written eighths occur at `0, 1/3, 2/3` inside that beat. A sufficiently long ordinary 6/8 eighth-note passage can look “swung” to the current heuristic.

This is a concrete correctness bug for song MIDI.

Minimal fixes worth testing:

- if there is a substantial `1/3` population, classify as explicit triplets/compound subdivision, not swing;
- do not auto-deswing score-like MIDI at all unless a source swing marker/explicit choice says to;
- keep performance swing inference for the live-piano path.

Add two small adversaries:

1. repeated straight triplets must not become swing;
2. normal 6/8 eighths must not become swing.

---

## 6. Voice structure is flattened into chord slices

`sliceIntoChords()` puts every event boundary into one timeline. Between boundaries, every sounding pitch is represented as one chord slice. Continuations become ties.

This is a clever way to preserve sounding notes from a performance, but it discards independent voice identity.

For score-like piano MIDI, a sustained melody plus moving inner voice can become a sequence of tied vertical slices. The sounding pitches are preserved but notation can become much harder to read than the source structure.

For bulk song arrangements:

- preserve track/channel/voice information where the source gives it;
- use voice estimation only where necessary;
- reserve chord-slice reconstruction for genuinely performance-like input that has no score voice information.

Partitura's score-MIDI importer is a strong prototype here because voice assignment can explicitly use track/channel structure or a voice-separation algorithm.

---

## 7. Hand splitting remains a heuristic, and its limits are honestly documented

The moving-boundary splitter is substantially better than a fixed middle-C split for a one-track piano performance. Keep it for that purpose.

Its current file already documents the important limits:

- hand crossings swap line identity;
- a left-hand note jumping over the right is assigned to the right;
- same-register simultaneities are split only by pitch;
- third/inner voices are not modelled.

Those are acceptable limits for a fallback heuristic. They are not a reason to throw away track/channel evidence from a score-like MIDI.

One documentation/code mismatch should be cleaned up: `mergeNoteTracks` says equal-onset notes preserve file/track order, but its sort uses `(start, midi)`, so equal onsets are pitch-sorted. The hand splitter also pitch-sorts each onset anyway, so this may not change the final split, but the claimed invariant is false.

---

## 8. Sustain and pitch bend

The current reader deliberately does not extend written durations through CC64 sustain. For notation-oriented MIDI this is usually the right default: pedal sound-off and written finger duration are different facts.

For performance research/inspection, Partitura's performance importer usefully exposes both `note_off` and sustain-adjusted `sound_off`, so we can compare without throwing either fact away.

Pitch bend is currently discarded. That is fine for piano-only material; it is another reason a guitar/band MIDI must not be blindly treated as a piano score.

---

## 9. The self-check is useful but not independent

Browser conversion writes MusicXML with PianoProject's own writer and reads it back with `readBackMusicXml`, a narrow regex parser in the same module family.

Python conversion writes with music21 and reads with music21.

These checks are still useful: they catch note loss/addition and broken bar lengths within the converter's contract. But neither is an independent witness of notation semantics.

For imported MIDI, the strongest simple check is:

`selected source MIDI semantic events → converter → MusicXML → Partitura → compare`

Compare at least:

- pitches;
- onsets in metrical ticks/quarters;
- total tied duration;
- staff/part/voice where source evidence exists;
- meter map;
- tempo map;
- key-signature map when present.

Use another implementation only on disagreements or unusually complex files (humlib/musicxml2hum, Verovio/MuseScore, or the `musicxml-io` TS prototype).

---

## 10. The committed tests prove the original problem, not the future A7X problem

Current real performance inputs are three MAESTRO Disklavier files:

- Bach BWV 885 Prelude;
- Grieg Op. 38 No. 7;
- Scarlatti K. 525.

Other tests use rendered score fixtures with jitter plus small hand-built MIDI fixtures such as `two-hands.mid`, `crossed-hands.mid`, and `left-hand-first.mid`.

That is good coverage of **piano performance cleanup**.

It does not cover these high-value song-MIDI adversaries:

1. format-0, multiple channels/programs in one track;
2. channel-10 drums plus pitched instruments;
3. two tracks that are not two hands;
4. 3+ band tracks with one actual keyboard track;
5. later tempo change;
6. later time-signature change;
7. explicit major/minor key signature and later key change;
8. ordinary 6/8 eighths and explicit triplets (must not be deswung);
9. mixed straight/triplet subdivisions in one bar;
10. 32nd-note passage;
11. independent voices in one hand;
12. pickup/anacrusis.

This does **not** need another enormous test campaign. A dozen tiny synthetic fixtures plus 2–3 real representative song MIDIs are enough to expose the class of problems.

---

## 11. Better parser/library options

### Browser raw MIDI: stop hand-parsing bytes unless bundle measurements prove a library is worse

Two candidates deserve a small bake-off:

#### `midi-file` (MIT)

A low-level Standard MIDI File parser/writer with TypeScript declarations. It returns header + raw tracks/events and preserves the information PianoProject currently discards. It is also the parser underneath `@tonejs/midi`.

This is the cleanest candidate if PianoProject wants to own its normalized semantic layer but not binary parsing.

#### `@tonejs/midi` (MIT)

Higher-level wrapper over `midi-file`. It exposes:

- PPQ;
- all tempo events;
- all time-signature events;
- tracks;
- channel;
- instrument program/name/family/percussion;
- notes with ticks/time/duration/velocity;
- control changes including sustain.

Its `splitTracks` even separates a physical MIDI track by `[program, channel]`, which directly addresses format-0 / multi-channel files.

It is old (2.0.28 was published years ago) but remains widely used. For a stable file format, age is not by itself disqualifying; a representative-file probe and bundle delta matter more.

One limitation to verify before adoption: key-signature access is less prominent in its public high-level format than tempo/meter, so `midi-file` directly may be the cleaner long-term base.

### Python raw MIDI: Mido

Mido already models channel, program/control messages and the complete MIDI meta-message vocabulary, including key signatures and meters. It would remove the need for PianoProject to maintain another binary SMF parser on the Python side.

### Score-like conversion: Partitura prototype

Partitura's score-MIDI importer already addresses several custom responsibilities at once:

- track/channel part assignment;
- voice separation;
- pitch spelling;
- score-oriented quantisation;
- MusicXML output.

Do not assume it is better on every file. Run it on representative song MIDIs beside the current path and compare notation/readability plus exact source-event retention.

### MuseScore

MuseScore remains useful as a visual/engraving witness and conversion comparison, but MuseScore 4's MIDI import controls have historically lagged MuseScore 3's MIDI import panel. Do not make it the sole bulk conversion oracle without testing the exact installed version and import options.

---

## 12. Proposed minimal architecture

### Normalized MIDI intermediate representation

Whichever parser wins should produce one boring structure before any musical guess:

```text
format
ppq
tempoEvents[]       {tick, qpm}
timeSignatureEvents[] {tick, numerator, denominator}
keySignatureEvents[]  {tick, fifths, mode}
tracks[] {
  sourceTrack
  name
  channel
  program
  instrumentName
  percussion
  notes[] {startTick, endTick, pitch, velocity}
  controls[]
  pitchBends[]
}
```

This is MIDI fact, not pedagogy or transcription judgement.

### Path A: score-like MIDI

Use when timing is already grid-aligned and/or file has meaningful track/channel/program/meta structure.

1. Parse without throwing information away.
2. Show/auto-suggest track selection; exclude percussion automatically but visibly.
3. Prefer explicit piano/keyboard tracks where available.
4. Preserve tempo/meter/key maps.
5. Preserve PPQ subdivisions rather than snapping to `[4,3]`.
6. Preserve track/channel voice information; only estimate missing voices/hands.
7. Write MusicXML with sufficient/adaptive divisions.
8. Parse with Partitura and compare back to selected source events.
9. Render for visual review.

### Path B: performance MIDI

Use for a single piano performance or deliberately selected piano stream with expressive timing.

1. Parse complete MIDI facts.
2. Quantise performance timing.
3. Fix the triplet/6-8 swing ambiguity.
4. Split hands only where source does not already say.
5. Rebuild readable slices/ties.
6. Write and independently check.

### Path C: multitrack band with no piano reduction

Say so.

Offer track selection or a future “make a piano reduction” workflow. Do not call track merge + pitch split a faithful conversion.

---

## 13. Practical bulk workflow for the owner's Avenged Sevenfold MIDIs

When the files arrive, do a batch **preflight first**, not one score at a time:

For every MIDI print a row with:

- SMF format + PPQ;
- tempo changes count;
- meter changes and their positions;
- key signatures;
- each track/channel/program/name;
- percussion flag;
- note count;
- pitch range;
- whether timing appears grid-aligned;
- candidate piano/keyboard tracks.

That tells us immediately whether the collection is:

- piano-arrangement MIDI;
- multitrack band MIDI with a usable keyboard/piano track;
- guitar-pro/DAW score-like exports that need track selection;
- live performances needing transcription cleanup.

Then convert by class in batches.

For each converted score, retain:

- original MIDI hash/file identity;
- selected source tracks/channels;
- conversion path/version/options;
- independent comparison result;
- any manual hand/track/key decision.

This should make adding dozens of songs much faster than manually fixing each one while preventing a bad multitrack conversion from looking authoritative.

---

## 14. Priority order for Fable

Do not rewrite the whole converter first.

1. **Prototype a real A7X-like multitrack file** through the current path and through a metadata-preserving parser (`midi-file` / `@tonejs/midi`). Confirm the channel/program/drum problem on an actual representative file.
2. **Add score-like vs performance-like branching.** This removes more bad behavior than tuning quantiser constants.
3. **Preserve/select tracks/channels/programs** before hand splitting.
4. **Preserve all meter/tempo/key events.** Meter changes are correctness-critical.
5. **Fix the triplet/6-8 swing false positive.**
6. **Allow higher/adaptive MusicXML divisions for imports.**
7. **Use Partitura as the independent output reader and as a candidate score-like converter.** Compare before choosing whether to keep custom score-like conversion.
8. Only then tune hand splitting/voice assignment on examples that remain wrong.

The likely end state is *less custom code*: mature MIDI parser + simple normalized facts + Partitura for score-like conversion/verification + the existing PianoProject performance cleanup where it is actually needed.

---

## External references checked in this pass

- Tonejs/Midi README and source (`@tonejs/midi`): https://github.com/Tonejs/Midi
- `midi-file` npm/parser: https://www.npmjs.com/package/midi-file
- Mido meta messages: https://github.com/mido/mido/blob/main/docs/meta_message_types.rst
- Partitura MIDI score/performance import: https://partitura.readthedocs.io/en/latest/introduction.html and `load_score_midi` docs
- music21 MIDI translator/quantisation: https://music21.org/music21docs/moduleReference/moduleMidiTranslate.html
- MuseScore MIDI import/CLI handbook material: https://musescore.org/en/handbook/4/midi-import and the MuseScore handbook command-line/import pages
