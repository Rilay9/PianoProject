"""Which chosen pieces (docs/pieces/chosen.csv) show what each skill rung teaches, for the rungs whose activities
include a piece and whose skill can be read off the file (rungs.md, "Learns"). Features are measured on the MusicXML
with music21: meters and changes, note values, tuplets, grace notes, ornaments, pedal marks, dynamics, hairpins,
slurs, accents, sforzando, key signature, range, chord symbols, repeats, and three left-hand patterns (block chords,
waltz bass, Alberti bass). A piece counts for a rung at its own level. Rungs whose skill is not visible in a file
(harmony, cadences, lead-sheet work, voicing, motive and sequence) are listed as "not read from files".

Output: docs/pieces/rung-pieces.md. Usage: python tools/pieces/rung_pieces.py
"""
import csv, os, sys
from collections import defaultdict

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
FILES = os.path.join(ROOT, "build", "pieces", "files")
sys.path.insert(0, os.path.dirname(__file__))
from movements import named_movements, spans  # noqa: E402


def features(path, mvts):
    import music21
    s = music21.converter.parse(path)
    parts = list(s.parts)
    staves = [list(p.getElementsByClass(music21.stream.Measure)) for p in (parts[0], parts[-1])]
    sp = spans(staves)
    a, b = (sp[mvts[0] - 1][0], sp[mvts[-1] - 1][1]) if mvts and max(mvts) <= len(sp) else (0, min(len(x) for x in staves) - 1)
    ms = [m for st in staves for m in st[a:b + 1]]
    f = defaultdict(int)
    tss = []
    for m in staves[0][a:b + 1]:
        for t in m.recurse().getElementsByClass(music21.meter.TimeSignature):
            tss.append(t.ratioString)
    f["meters"] = sorted(set(tss))
    f["meter_change"] = len(set(tss)) > 1
    f["compound"] = any(t.split("/")[0] in ("6", "9", "12") and t.split("/")[1] == "8" for t in tss)
    lo, hi = 200, 0
    for m in ms:
        notes = list(m.recurse().notes)
        prev = None
        for n in m.recurse().notesAndRests:
            q = float(n.quarterLength)
            if n.isRest:
                if abs(q - 0.5) < 1e-6:
                    f["eighth_rest"] += 1
                continue
            if n.duration.isGrace:
                f["grace"] += 1
            if abs(q - 0.5) < 1e-6:
                f["eighth"] += 1
            if abs(q - 0.25) < 1e-6:
                f["sixteenth"] += 1
            if n.duration.tuplets:
                f["tuplet"] += 1
            if prev is not None and abs(prev - 1.5) < 1e-6 and abs(q - 0.5) < 1e-6:
                f["dotted_q_8th"] += 1
            if prev is not None and abs(prev - 0.75) < 1e-6 and abs(q - 0.25) < 1e-6:
                f["dotted_8th_16th"] += 1
            prev = q
            for e in n.expressions:
                nm = type(e).__name__.lower()
                if "trill" in nm or "mordent" in nm or "turn" in nm:
                    f["ornament"] += 1
            for art in n.articulations:
                nm = type(art).__name__.lower()
                if "accent" in nm:
                    f["accent"] += 1
            for p in n.pitches:
                lo, hi = min(lo, p.midi), max(hi, p.midi)
        for d in m.recurse().getElementsByClass(music21.dynamics.Dynamic):
            f["dyn_" + d.value] += 1
        f["hairpin"] += len(list(m.recurse().getElementsByClass(music21.dynamics.DynamicWedge)))
        f["chord_symbol"] += len(list(m.recurse().getElementsByClass(music21.harmony.ChordSymbol)))
        if m.leftBarline is not None and "repeat" in type(m.leftBarline).__name__.lower() or \
                m.rightBarline is not None and "repeat" in type(m.rightBarline).__name__.lower():
            f["repeat"] += 1
    f["slur"] = len(list(s.recurse().getElementsByClass(music21.spanner.Slur)))
    f["pedal"] = sum(1 for x in s.recurse() if "pedal" in type(x).__name__.lower())
    f["sfz"] = f.get("dyn_sfz", 0) + f.get("dyn_sf", 0)
    f["range"] = (lo, hi)
    ks = next(iter(s.recurse().getElementsByClass(music21.key.KeySignature)), None)
    f["keysig"] = ks.sharps if ks else 0
    # left-hand patterns, bar by bar on the bottom staff
    waltz = alberti = block = 0
    for m in staves[1][a:b + 1]:
        ev = [n for n in m.recurse().notes if not n.duration.isGrace]
        ts = m.getContextByClass(music21.meter.TimeSignature)
        if ts and ts.ratioString == "3/4" and len(ev) == 3 and not ev[0].isChord and ev[1].isChord and ev[2].isChord:
            waltz += 1
        if sum(1 for n in ev if n.isChord and len(n.pitches) >= 3) >= 1 and len(ev) <= 4:
            block += 1
        sing = [n.pitch.midi for n in ev if not n.isChord]
        if len(sing) >= 4 and len(sing) == len(ev):
            for i in range(len(sing) - 3):
                x = sing[i:i + 4]
                if x[0] < x[2] < x[1] and x[1] == x[3]:
                    alberti += 1
                    break
    f["waltz_bass"], f["alberti"], f["block_chords"] = waltz, alberti, block
    return f


def mid(n):
    import music21
    return music21.pitch.Pitch(midi=n).nameWithOctave


# rung -> (what it shows in a file, test on features); level = the rung's level
RULES = {
    "B.1": ("notes to two ledger lines, intervals to the octave", lambda f: f["range"][0] <= 43 or f["range"][1] >= 81),
    "B.2": ("eighths with the eighth rest or dotted quarter-eighth; a meter change", lambda f: f["eighth"] and (f["eighth_rest"] or f["dotted_q_8th"] or f["meter_change"])),
    "B.3": ("written in C, D, G, A major or minor (0-3 sharps)", lambda f: f["keysig"] in (0, 1, 2, 3)),
    "B.6": ("block chords or waltz bass in the left hand", lambda f: f["block_chords"] >= 2 or f["waltz_bass"] >= 2),
    "B.7": ("chord symbols in the score", lambda f: f["chord_symbol"] > 0),
    "B.8": ("phrase marks with pedal or hairpins", lambda f: f["slur"] > 0 and (f["pedal"] or f["hairpin"])),
    "1.1": ("ledger lines above and below", lambda f: f["range"][0] <= 43 and f["range"][1] >= 81),
    "1.4": ("compound time or triplets", lambda f: f["compound"] or f["tuplet"]),
    "1.5": ("Alberti or waltz bass", lambda f: f["alberti"] >= 2 or f["waltz_bass"] >= 2),
    "1.6": ("pedal marks, or accents with hairpins", lambda f: f["pedal"] or (f["accent"] and f["hairpin"])),
    "1.7": ("binary or ternary form shown by repeats", lambda f: f["repeat"] > 0),
    "2.4": ("sixteenths, triplets or dotted eighth-sixteenth", lambda f: f["sixteenth"] >= 4 or f["tuplet"] or f["dotted_8th_16th"]),
    "2.6": ("grace notes", lambda f: f["grace"] > 0),
    "3.3": ("compound time or a change of meter", lambda f: f["compound"] or f["meter_change"]),
    "3.4": ("trills, mordents or turns, or sforzando", lambda f: f["ornament"] > 0 or f["sfz"] > 0),
}
NOT_READ = ["B.5", "2.5", "2.10", "3.5", "4.3", "5.3", "6.3", "7.5", "8.5"]


def main():
    chosen = list(csv.DictReader(open(os.path.join(ROOT, "docs", "pieces", "chosen.csv"), encoding="utf-8")))
    feats = {}
    for r in chosen:
        f = r["candidate_file"]
        path = os.path.join(FILES, os.path.basename(f)) if f.startswith("./mxl") else os.path.join(ROOT, f)
        try:
            feats[f] = features(path, named_movements(r["title"]))
        except Exception as e:
            print("  not read:", r["title"][:40], type(e).__name__)
    lines = ["# Chosen pieces by skill rung", "",
             "Generated by `tools/pieces/rung_pieces.py` from `docs/pieces/chosen.csv` and `rungs.md`. A piece is listed under a "
             "skill rung when the file shows what the rung teaches (measured with music21) and the piece is at the rung's level. "
             "Features are read from the files, not heard; a file can show a marking the learner's edition lacks.", "",
             "| Rung | Shows in a file as | Pieces at this level |", "| --- | --- | --- |"]
    empty = []
    for rung, (desc, test) in RULES.items():
        lvl = rung.split(".")[0]
        hits = [r["title"][:38] for r in chosen if r["level"] == lvl and r["candidate_file"] in feats and test(feats[r["candidate_file"]])]
        lines.append(f"| {rung} | {desc} | {'; '.join(hits) if hits else '**none**'} |")
        if not hits:
            empty.append(rung)
    lines += ["", f"Rungs with no piece yet: {', '.join(empty) if empty else 'none'}.", "",
              "Not read from files (harmony, cadences, lead-sheet work, voicing, unseen reading): " + ", ".join(NOT_READ) + ".", ""]
    open(os.path.join(ROOT, "docs", "pieces", "rung-pieces.md"), "w", encoding="utf-8", newline="\n").write("\n".join(lines))
    print("\n".join(lines[5:]))


if __name__ == "__main__":
    main()
