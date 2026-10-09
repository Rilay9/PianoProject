"""pitch.tone-row: the built scores (positives from music21's table of rows of named works; counterexamples) and the real
counterexamples (music21 corpus: Schoenberg Op. 19 Nos. 2 and 6). Writes MusicXML into row_synth/ and the list row_cases.json.
Positives are BUILT, not real scores: the catalogue holds no twelve-tone piece (measured by row_scan.py: no item has two statements)
and the only serial-era scores in music21's corpus are free-atonal. Construction is the validators' (t_poly_row.py):
 V1 one line: the row P, its inversion about its first note I, and its retrograde R (3 statements, octave 5, quarter notes);
 V2 split between the hands: right hand = notes 1-3, 4-6 of P then of I as three-note chords, left hand = notes 7-9, 10-12, repeated over 8 bars;
 V3 one line with every note struck twice (a repeated-note statement of P, I, R).
V2 and V3 use every sixth row of the table (12 rows); V1 uses all 71.
Usage: python -X utf8 row_build.py"""
from row_lib import *
from music21 import serial, corpus

(HERE / "row_synth").mkdir(exist_ok=True)
HIST = {k: [int(x) for x in serial.getHistoricalRowByName(k).pitchClasses()] for k in sorted(serial.historicalDict)}
cases = []


def forms(row):
    inv = [(-x + 2 * row[0]) % 12 for x in row]
    return inv, row[::-1]


for name, row in HIST.items():
    inv, ret = forms(row)
    line = [f"{N12[pc]}5" for pc in row + inv + ret]
    p = piece(line, ["C3"] * len(line), f"V1_{name}")
    cases.append({"id": f"V1_{name}", "kind": "positive", "variant": "V1 one line P, I, R", "path": str(p), "row": row, "row_source": f"music21 serial.historicalDict['{name}']", "statements_built": 3})
for name in list(HIST)[::6]:
    row = HIST[name]
    inv, ret = forms(row)
    rh = [" ".join(f"{N12[pc]}5" for pc in row[0:3]), " ".join(f"{N12[pc]}5" for pc in row[3:6]), " ".join(f"{N12[pc]}5" for pc in inv[0:3]), " ".join(f"{N12[pc]}5" for pc in inv[3:6])] * 8
    lh = [" ".join(f"{N12[pc]}3" for pc in row[6:9]), " ".join(f"{N12[pc]}3" for pc in row[9:12]), " ".join(f"{N12[pc]}3" for pc in inv[6:9]), " ".join(f"{N12[pc]}3" for pc in inv[9:12])] * 8
    p = piece(rh, lh, f"V2_{name}")
    cases.append({"id": f"V2_{name}", "kind": "positive", "variant": "V2 split between the hands, three-note chords", "path": str(p), "row": row, "row_source": f"historicalDict['{name}']", "statements_built": "P and I, each split across both hands, 8 times"})
    line = [f"{N12[pc]}5" for pc in row + inv + ret for _ in range(2)]
    p = piece(line, ["C3"] * len(line), f"V3_{name}")
    cases.append({"id": f"V3_{name}", "kind": "positive", "variant": "V3 one line, every note struck twice", "path": str(p), "row": row, "row_source": f"historicalDict['{name}']", "statements_built": 3})

# counterexamples
chrom3 = [f"{N12[pc % 12]}5" for pc in range(12)] * 3
chrom_updown = [f"{N12[pc % 12]}4" for pc in list(range(25)) + list(range(23, -1, -1))]
fifths = [f"{N12[(7 * k) % 12]}5" for k in range(12)] * 2
fifths_lh = ["C3", "G3"] * 12
wholetone2 = ["C5", "D5", "E5", "F#5", "G#5", "A#5", "C#5", "D#5", "F5", "G5", "A5", "B5"] * 2   # the two whole-tone scales in succession
for nm, (rh, lh), why in (
        ("N1_chromatic_scale_x3", (chrom3, ["C3"] * len(chrom3)), "chromatic scale, three times (the validators' counterexample)"),
        ("N2_chromatic_up_down_2oct", (chrom_updown, ["C3"] * len(chrom_updown)), "chromatic scale up and down over two octaves"),
        ("N3_circle_of_fifths_x2", (fifths, fifths_lh), "the circle of fifths twice: a tonal sequence with 12 different pitch classes in 12 notes"),
        ("N4_two_whole_tone_scales", (wholetone2, ["C3"] * len(wholetone2)), "the two whole-tone scales one after the other, twice (12 different pitch classes in 12 notes)")):
    p = piece(rh, lh, nm)
    cases.append({"id": nm, "kind": "negative", "variant": why, "path": str(p), "row": None})
for mv in ("movement2", "movement6"):
    p = Path(corpus.getComposer("schoenberg")[0 if mv == "movement2" else 1])
    cases.append({"id": f"N5_schoenberg_op19_{mv}", "kind": "negative", "variant": "REAL score: Schoenberg, Six Little Piano Pieces Op. 19 (free atonal, 1911, before the twelve-tone method; music21 corpus)", "path": str(p), "row": None, "real": True})
json.dump(cases, open(HERE / "row_cases.json", "w"), indent=1)
print(len(cases), "cases:", {k: sum(1 for c in cases if c['id'].startswith(k)) for k in ("V1", "V2", "V3", "N")})
