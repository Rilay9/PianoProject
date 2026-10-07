"""MT1's second witness: music21's reading of every bundled chart's metres against the app's.

The app's per-source-measure reading comes from `app/tests/unit/chartMetre.test.ts` run with `MT1_CENSUS=<dir>`
(it writes `<dir>/per-measure.json`: file, source ordinal, written signature, beats, beat in quarters, bar in
quarters, bar status). This script parses the same built files with music21, takes the harmony part as the app
does (the first part holding a chord symbol, else the first part; a two-staff MusicXML part is two PartStaffs in
music21, so the first PartStaff holding one), and compares, per (file, source measure), the time signature in force:

    beats          against  TimeSignature.beatCount
    beat quarters  against  TimeSignature.beatDuration.quarterLength
    bar quarters   against  TimeSignature.barDuration.quarterLength

It prints the per-metre table (beatCount / beatDuration / beatDivisionCount / barDuration for every metre seen),
the agreement count, and every disagreement with its file and measure. Nothing is heard.

    py -3.11 docs/prompts/runs/MT1/witness.py <dir>/per-measure.json app/public/content > docs/prompts/runs/MT1/witness.txt
"""

import json
import sys
from collections import Counter, defaultdict
from pathlib import Path

import music21
from music21 import converter, harmony, meter, stream


def harmony_part(score):
    parts = list(score.parts)
    for part in parts:
        if any(True for _ in part.recurse().getElementsByClass(harmony.ChordSymbol)):
            return part
    return parts[0] if parts else None


def signature_in_force(measure):
    ts = measure.timeSignature
    if ts is None:
        ts = measure.getContextByClass(meter.TimeSignature)
    return ts


def main():
    per_measure = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
    content = Path(sys.argv[2])
    by_file = defaultdict(list)
    for file, source, written, beats, beat_q, bar_q, status in per_measure:
        by_file[file].append((source, written, beats, beat_q, bar_q, status))

    metres = {}
    agree = 0
    compared = 0
    disagreements = []
    count_mismatch = []
    unreadable = []
    no_signature = Counter()
    for file in sorted(by_file):
        rows = sorted(by_file[file])
        try:
            score = converter.parse(str(content / file))
        except Exception as error:  # noqa: BLE001 - every failure is listed, none hidden
            unreadable.append((file, repr(error)[:120]))
            continue
        part = harmony_part(score)
        measures = list(part.getElementsByClass(stream.Measure)) if part is not None else []
        if len(measures) != len(rows):
            count_mismatch.append((file, len(rows), len(measures)))
        for (source, written, beats, beat_q, bar_q, status), measure in zip(rows, measures):
            ts = signature_in_force(measure)
            if ts is None:
                no_signature[written] += 1
                if written is not None:
                    disagreements.append((file, source, written, "music21: no signature in force"))
                continue
            key = ts.ratioString
            metres.setdefault(key, (ts.beatCount, float(ts.beatDuration.quarterLength), ts.beatDivisionCount, float(ts.barDuration.quarterLength)))
            compared += 1
            theirs = (ts.beatCount, float(ts.beatDuration.quarterLength), float(ts.barDuration.quarterLength))
            ours = (beats, float(beat_q), float(bar_q))
            if written is None:
                disagreements.append((file, source, "none", f"music21 reads {key} {theirs}"))
            elif theirs == ours:
                agree += 1
            else:
                disagreements.append((file, source, written, f"app {ours} music21 {key} {theirs}"))

    print(f"music21 {music21.__version__}")
    print(f"files compared: {len(by_file) - len(unreadable)} of {len(by_file)}")
    print(f"measures compared (a signature in force on both sides): {compared}")
    print(f"agree on beats, beat length and bar length: {agree}")
    print(f"disagree: {len(disagreements)}")
    print()
    print("Per metre, as music21 reads it: beatCount / beatDuration (quarters) / beatDivisionCount / barDuration (quarters)")
    for key in sorted(metres, key=lambda k: (int(k.split('/')[1]), int(k.split('/')[0]) if k.split('/')[0].isdigit() else 0)):
        count, duration, division, bar = metres[key]
        print(f"  {key:>6}  {count} / {duration} / {division} / {bar}")
    print()
    print("Outside the corpus, the brief's two known disagreements, as music21 reads them (the app: 3/8 three eighth")
    print("beats of 0.5, L120b; 3+2/4 five quarter beats):")
    for key in ("3/8", "3+2/4"):
        ts = meter.TimeSignature(key)
        try:
            beat = str(float(ts.beatDuration.quarterLength))
        except meter.TimeSignatureException:
            # music21 refuses one beat length for a non-uniform grouping: its beats' own lengths instead.
            beat = "beats of " + ", ".join(str(float(b.duration.quarterLength)) for b in ts.beatSequence)
        try:
            division = str(ts.beatDivisionCount)
        except meter.TimeSignatureException:
            division = "-"
        print(f"  {key:>6}  {ts.beatCount} / {beat} / {division} / {float(ts.barDuration.quarterLength)}")
    print()
    print("Measures with no signature in force on music21's side, by the app's reading:", dict(no_signature) or "none")
    print("Files whose harmony part has a different measure count in music21 (compared up to the shorter):")
    for file, ours, theirs in count_mismatch:
        print(f"  {file}: app {ours}, music21 {theirs}")
    if not count_mismatch:
        print("  none")
    print("Unreadable by music21:")
    for file, error in unreadable:
        print(f"  {file}: {error}")
    if not unreadable:
        print("  none")
    print()
    print("Every disagreement:")
    for row in disagreements:
        print("  " + " | ".join(str(x) for x in row))
    if not disagreements:
        print("  none")


if __name__ == "__main__":
    main()
