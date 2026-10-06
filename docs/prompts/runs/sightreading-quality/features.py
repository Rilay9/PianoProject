"""
The real-music reference comparison (brief §4, FABLE §5 method 2): evidence, never a gate.

    py -3.11 features.py reference            # writes REFERENCE.json (before any feature is computed)
    py -3.11 features.py compute <run dir>    # writes <run dir>/features.json

**Reference set per level.** Real items (catalog type `song` or `excerpt`, with a file, whose
provenance source is neither `generated` nor `placeholder`) in the `songOptions` of the rungs
where that level's rows anchor (brief §4's table). A level whose list is empty is UNKNOWN.

**Which staff.** Every (part, staff) pair that sounds is a line. The melody line is the one with
the highest median pitch; the lower line the one with the lowest, when there are two or more.
Melodic features are taken from the melody line's skyline (the highest struck pitch at each
onset; a tie continuation is not struck). A generated item for one hand (`-1`, `-1-left`,
`-2-right`) has one sounding staff, which is its melody; lower-line features are computed only
for generated items with a left hand, and for reference pieces only at levels whose generated
items have one.

**Windows.** A piece is cut into consecutive complete windows of the generated items' bar count
at that level (4 bars at L1-L2, 8 at L3-L7): from the first complete bar (a pickup shorter than
its metre is skipped), never across a change of metre. The per-piece value of a feature is the
median over its windows; the reference distribution is the per-piece medians (each piece
counted once). A generated item is one window. "Within the real-music reference for level L on
feature F" means the generated median lies inside the reference's interquartile range.

**Features** (the same function on both sets, from partitura events; interval and degree names
from music21):

* `motifReuse` - rhythm-motif reuse per four bars: in each 4-bar span, the share of bars whose
  melody rhythm (onset positions and durations within the bar) equals another bar's in the span;
  averaged over the window's spans.
* `stepShare`, `leapShare` - of the melodic moves that change pitch, the share of a 2nd (one
  scale step) and of a 4th or wider (three steps or more), generic intervals from music21.
* `leapRecovery` - of the leaps followed by another move, the share whose next move is a step
  in the opposite direction.
* `contourReversals` - changes of melodic direction (unisons skipped) per bar.
* `intervalRepetition` - the share of directed generic-interval 3-grams that occur more than once
  in the window.
* `stableEnding` - 1 when the window's last melody note is scale degree 1, 3 or 5 of the piece's
  key (catalog `keySig` for a reference piece, the written signature in major for a generated
  item) and lasts longer than the window's median melody duration, else 0.
* `impliedCadence` - lower line only: 1 when the lowest pitch of the penultimate bar is degree 5
  and of the last bar degree 1, else 0.
* `range`, `register` - the melody's range in semitones and its median MIDI pitch.
* `densityUpper`, `densityLower` - struck onsets per bar, per line.
* `handsTogether` - lower line only: |onsets shared by both lines| / |onsets of either line|.
* `strongConsonance` - lower line only: of the strong beats (beat 1, and 3 in 4/4; the dotted
  quarters 1 and 4 in 6/8) where both lines sound, the share where the melody's pitch over the
  lower line's lowest sounding pitch is consonant by music21 `Interval.isConsonant()`.

Diagnostics on the generated items (no bound, brief §4): beams crossing a felt beat; accidental
churn (a step written with two alterations in one bar); ledger lines per bar; articulation and
slur count; parallel fifths and octaves between the melody and the lower line (music21
`voiceLeading.VoiceLeadingQuartet`).
"""
from __future__ import annotations

import json
import statistics
import sys
import warnings
import xml.etree.ElementTree as ET
import zipfile
from collections import Counter, defaultdict
from pathlib import Path

warnings.filterwarnings("ignore")

HERE = Path(__file__).resolve().parent
WORKTREE = HERE.parents[3]
CONTENT = WORKTREE / "app" / "public" / "content"

import partitura as pt  # noqa: E402
import partitura.score as ps  # noqa: E402
from music21 import interval as m21interval  # noqa: E402
from music21 import key as m21key  # noqa: E402
from music21 import note as m21note  # noqa: E402
from music21 import pitch as m21pitch  # noqa: E402
from music21 import voiceLeading  # noqa: E402

LEVEL_RUNGS = {
    1: ("core", "1.3", "2.1"), 2: ("core", "2.2", "4.4"), 3: ("core", "4.5", "4.7"),
    4: ("list", "4.6", "technique.5"), 5: ("list", "theory.6"), 6: ("list", "chords-pop.8", "theory.9"),
    7: ("list", "jazz.8"),
}
WINDOW_BARS = {1: 4, 2: 4, 3: 8, 4: 8, 5: 8, 6: 8, 7: 8}
LEVEL_HAS_LOWER = {1: False, 2: True, 3: True, 4: True, 5: True, 6: True, 7: True}
STEPS = "CDEFGAB"
FEATURES = ["motifReuse", "stepShare", "leapShare", "leapRecovery", "contourReversals", "intervalRepetition",
            "stableEnding", "impliedCadence", "range", "register", "densityUpper", "densityLower",
            "handsTogether", "strongConsonance"]


def name(n) -> str:
    alter = int(n.alter or 0)
    return n.step + ("#" * alter if alter > 0 else "-" * (-alter)) + str(n.octave)


def dia(n) -> int:
    return n.octave * 7 + STEPS.index(n.step)


# --------------------------------------------------------------------------- the reference list


def reference() -> None:
    target = HERE / "REFERENCE.json"
    curriculum = json.loads((CONTENT / "curriculum.json").read_text(encoding="utf-8"))
    catalog = {i["id"]: i for i in json.loads((CONTENT / "catalog.json").read_text(encoding="utf-8"))}
    core = [l["id"] for s in curriculum["stages"] for u in s["units"] if u["track"] == "core" for l in u["lessons"]]
    lessons = {l["id"]: l for s in curriculum["stages"] for u in s["units"] for l in u["lessons"]}
    out = {"written": "before any feature was computed (2026-10-06)",
           "rule": ("Real items (catalog type song or excerpt, with a file, provenance source neither generated nor "
                    "placeholder) in the songOptions of the rungs where the level's rows anchor (brief §4). An "
                    "empty level is UNKNOWN, never padded."),
           "levels": {}}
    for level, spec in LEVEL_RUNGS.items():
        rungs = core[core.index(spec[1]):core.index(spec[2]) + 1] if spec[0] == "core" else list(spec[1:])
        pieces = {}
        for rung in rungs:
            for sid in lessons[rung]["songOptions"]:
                item = catalog.get(sid)
                if not item or item.get("type") not in ("song", "excerpt") or not item.get("file"):
                    continue
                if (item.get("provenance") or {}).get("source") in ("generated", "placeholder"):
                    continue
                entry = pieces.setdefault(sid, {"id": sid, "title": item.get("title"), "file": item["file"],
                                                "keySig": item.get("keySig"), "timeSig": item.get("timeSig"),
                                                "source": (item.get("provenance") or {}).get("source"), "rungs": []})
                entry["rungs"].append(rung)
        out["levels"][str(level)] = {"rungs": rungs, "n": len(pieces), "windowBars": WINDOW_BARS[level],
                                     "status": "UNKNOWN (no real piece on these rungs)" if not pieces else "listed",
                                     "pieces": sorted(pieces.values(), key=lambda p: p["id"])}
    target.write_text(json.dumps(out, indent=1), encoding="utf-8")
    print({k: v["n"] for k, v in out["levels"].items()})


# --------------------------------------------------------------------------- reading a score


def lines_of(path: Path):
    """[(measures, notes by line, metre per measure, fifths)] from partitura."""
    score = pt.load_score(str(path))
    lines = defaultdict(list)
    measures = None
    times = []
    keys = []
    for pi, part in enumerate(score.parts):
        if measures is None:
            measures = [(m.start.t, m.end.t) for m in part.measures]
            times = sorted((t.start.t, t.beats, t.beat_type) for t in part.iter_all(ps.TimeSignature))
            keys = [k.fifths for k in part.iter_all(ps.KeySignature)]
            divs = part._quarter_durations[0] if getattr(part, "_quarter_durations", None) else None
        for n in part.notes:
            lines[(pi, n.staff or 1)].append(n)
    return measures or [], dict(lines), times, keys


def metre_at(times, t):
    cur = None
    for start, beats, beat_type in times:
        if start <= t:
            cur = (beats, beat_type)
    return cur or (4, 4)


def skyline(notes):
    by_t = {}
    for n in notes:
        if n.tie_prev is not None:
            continue
        t = n.start.t
        if t not in by_t or n.midi_pitch > by_t[t].midi_pitch:
            by_t[t] = n
    return [by_t[t] for t in sorted(by_t)]


def lowline(notes):
    by_t = {}
    for n in notes:
        if n.tie_prev is not None:
            continue
        t = n.start.t
        if t not in by_t or n.midi_pitch < by_t[t].midi_pitch:
            by_t[t] = n
    return [by_t[t] for t in sorted(by_t)]


def key_of(keysig: str | None, fifths: int):
    if keysig:
        try:
            tonic, mode = keysig.split()
            return m21key.Key(tonic.replace("b", "-") if len(tonic) > 1 else tonic, mode.lower())
        except Exception:  # noqa: BLE001
            pass
    return m21key.KeySignature(fifths).asKey("major")


def degree(k, n) -> int | None:
    return k.getScaleDegreeFromPitch(m21pitch.Pitch(name(n)[:-len(str(n.octave))]))


# --------------------------------------------------------------------------- one window


def window_features(mel, low, bars, divs_per_bar, metre, k, q) -> dict:
    """mel/low: struck notes (skyline/lowline) inside the window; bars: [(start, end)]."""
    f = {}
    nbar = len(bars)

    def bar_of(t):
        for i, (a, b) in enumerate(bars):
            if a <= t < b:
                return i
        return None

    # rhythm-motif reuse per four bars
    rhythms = defaultdict(list)
    for n in mel:
        i = bar_of(n.start.t)
        if i is not None:
            rhythms[i].append((n.start.t - bars[i][0], n.duration_tied))
    spans = []
    for s in range(0, nbar - nbar % 4 or nbar, 4):
        group = [tuple(rhythms.get(i, [])) for i in range(s, min(s + 4, nbar))]
        c = Counter(group)
        spans.append(sum(1 for g in group if c[g] > 1) / len(group))
    f["motifReuse"] = statistics.mean(spans) if spans else None
    moves = []
    for a, b in zip(mel, mel[1:]):
        w = m21interval.Interval(m21pitch.Pitch(name(a)), m21pitch.Pitch(name(b)))
        moves.append(w.generic.directed)
    changing = [m for m in moves if abs(m) != 1]
    steps = [m for m in changing if abs(m) == 2]
    leaps = [m for m in changing if abs(m) >= 4]
    f["stepShare"] = len(steps) / len(changing) if changing else None
    f["leapShare"] = len(leaps) / len(changing) if changing else None
    rec, tot = 0, 0
    for a, b in zip(changing, changing[1:]):
        if abs(a) >= 4:
            tot += 1
            if abs(b) == 2 and (a > 0) != (b > 0):
                rec += 1
    f["leapRecovery"] = rec / tot if tot else None
    dirs = [1 if m > 0 else -1 for m in changing]
    f["contourReversals"] = sum(1 for a, b in zip(dirs, dirs[1:]) if a != b) / nbar
    grams = [tuple(moves[i:i + 3]) for i in range(len(moves) - 2)]
    cg = Counter(grams)
    f["intervalRepetition"] = sum(1 for g in grams if cg[g] > 1) / len(grams) if grams else None
    if mel:
        last = mel[-1]
        d = degree(k, last)
        med = statistics.median(n.duration_tied for n in mel)
        f["stableEnding"] = 1 if d in (1, 3, 5) and last.duration_tied > med else 0
        f["range"] = max(n.midi_pitch for n in mel) - min(n.midi_pitch for n in mel)
        f["register"] = statistics.median(n.midi_pitch for n in mel)
    else:
        f["stableEnding"] = f["range"] = f["register"] = None
    f["densityUpper"] = len(mel) / nbar
    if low is not None:
        f["densityLower"] = len(low) / nbar
        lows = defaultdict(list)
        for n in low:
            i = bar_of(n.start.t)
            if i is not None:
                lows[i].append(n)
        pen, fin = lows.get(nbar - 2), lows.get(nbar - 1)
        if pen and fin:
            dp = degree(k, min(pen, key=lambda n: n.midi_pitch))
            df = degree(k, min(fin, key=lambda n: n.midi_pitch))
            f["impliedCadence"] = 1 if (dp, df) == (5, 1) else 0
        else:
            f["impliedCadence"] = None
        on_u = {n.start.t for n in mel}
        on_l = {n.start.t for n in low}
        f["handsTogether"] = len(on_u & on_l) / len(on_u | on_l) if on_u | on_l else None
        beats, beat_type = metre
        if beat_type == 8 and beats % 3 == 0:
            strong = [i * q * 3 // 2 for i in range(0, beats // 3, 2)]
        else:
            qq = q * 4 // beat_type
            strong = [0, 2 * qq] if beats == 4 else [0]
        cons, tot = 0, 0
        for a, b in bars:
            for s in strong:
                t = a + s
                u = [n for n in mel if n.start.t <= t < n.start.t + n.duration_tied]
                lo = [n for n in low if n.start.t <= t < n.start.t + n.duration_tied]
                if u and lo:
                    tot += 1
                    w = m21interval.Interval(m21pitch.Pitch(name(min(lo, key=lambda n: n.midi_pitch))),
                                             m21pitch.Pitch(name(max(u, key=lambda n: n.midi_pitch))))
                    cons += 1 if w.isConsonant() else 0
        f["strongConsonance"] = cons / tot if tot else None
    else:
        f["densityLower"] = f["impliedCadence"] = f["handsTogether"] = f["strongConsonance"] = None
    return f


def piece_windows(path: Path, bars_per_window: int, keysig: str | None, want_lower: bool, melody_line=None):
    measures, lines, times, keys = lines_of(path)
    if not lines or not measures:
        return []
    med = {k: statistics.median(n.midi_pitch for n in v) for k, v in lines.items()}
    upper_key = melody_line if melody_line in lines else max(med, key=med.get)
    lower_key = min(med, key=med.get) if len(lines) >= 2 else None
    if lower_key == upper_key:
        lower_key = None
    part0 = pt.load_score(str(path)).parts[0]
    q = int(part0.quarter_duration_map(0)) if hasattr(part0, "quarter_duration_map") else None
    if not q:
        q = 1
    k = key_of(keysig, keys[0] if keys else 0)
    mel_all = skyline(lines[upper_key])
    low_all = lowline(lines[lower_key]) if (want_lower and lower_key) else None
    # complete bars of one metre
    full = []
    for a, b in measures:
        beats, beat_type = metre_at(times, a)
        if b - a == beats * q * 4 // beat_type:
            full.append((a, b, (beats, beat_type)))
    out = []
    i = 0
    while i + bars_per_window <= len(full):
        chunk = full[i:i + bars_per_window]
        contiguous = all(chunk[j][1] == chunk[j + 1][0] for j in range(len(chunk) - 1))
        same_metre = len({c[2] for c in chunk}) == 1
        if contiguous and same_metre:
            a, b = chunk[0][0], chunk[-1][1]
            mel = [n for n in mel_all if a <= n.start.t < b]
            low = [n for n in low_all if a <= n.start.t < b] if low_all is not None else None
            if mel:
                out.append(window_features(mel, low, [(c[0], c[1]) for c in chunk], None, chunk[0][2], k, q))
            i += bars_per_window
        else:
            i += 1
    return out


def summary(values):
    vals = sorted(v for v in values if v is not None)
    if not vals:
        return None
    qs = statistics.quantiles(vals, n=4) if len(vals) >= 2 else [vals[0]] * 3
    return {"n": len(vals), "median": round(statistics.median(vals), 3), "q1": round(qs[0], 3), "q3": round(qs[2], 3)}


# --------------------------------------------------------------------------- diagnostics


def diagnostics(path: Path) -> dict:
    tree = ET.parse(path)
    root = tree.getroot()
    divisions = int(root.find(".//divisions").text)
    beats = int(root.find(".//time/beats").text)
    beat_type = int(root.find(".//time/beat-type").text)
    compound = beat_type == 8 and beats % 3 == 0
    beat = divisions * 3 // 2 if compound else divisions * 4 // beat_type
    crossing, churn, ledgers, bars = 0, 0, [], 0
    for measure in root.iter("measure"):
        bars += 1
        pos = 0
        group_start = None
        seen = defaultdict(set)
        led = 0
        for el in measure:
            if el.tag == "backup":
                pos -= int(el.find("duration").text)
                continue
            if el.tag != "note":
                continue
            dur = int(el.find("duration").text)
            if el.find("chord") is not None:
                continue
            beam = el.find("beam")
            if beam is not None:
                if beam.text == "begin":
                    group_start = pos
                elif beam.text == "end" and group_start is not None:
                    if group_start // beat != (pos + dur - 1) // beat:
                        crossing += 1
                    group_start = None
            p = el.find("pitch")
            if p is not None:
                step = p.find("step").text
                octave = int(p.find("octave").text)
                alter = int(p.find("alter").text) if p.find("alter") is not None else 0
                seen[(step, octave)].add(alter)
                staff = el.find("staff").text if el.find("staff") is not None else "1"
                d = octave * 7 + STEPS.index(step)
                if staff == "1":
                    if d <= 4 * 7 + 0:  # C4 and below on the treble staff
                        led += (4 * 7 + 2 - d) // 2
                    elif d >= 5 * 7 + 5:  # A5 and above
                        led += (d - (5 * 7 + 3)) // 2
                else:
                    if d >= 4 * 7 + 0:  # C4 and above on the bass staff
                        led += (d - (3 * 7 + 5)) // 2
                    elif d <= 2 * 7 + 2:  # E2 and below
                        led += ((2 * 7 + 4) - d) // 2
            pos += dur
        churn += sum(1 for v in seen.values() if len(v) > 1)
        ledgers.append(led)
    return {"beamsCrossingBeat": crossing, "accidentalChurn": churn, "ledgerLinesPerBar": round(sum(ledgers) / max(1, bars), 3),
            "ledgerLinesMaxBar": max(ledgers or [0])}


def parallels(path: Path) -> int | None:
    measures, lines, times, keys = lines_of(path)
    if len(lines) < 2:
        return None
    mel = skyline(lines[(0, 1)]) if (0, 1) in lines else None
    low = lowline(lines[(0, 2)]) if (0, 2) in lines else None
    if not mel or not low:
        return None

    def at(line, t):
        hit = [n for n in line if n.start.t <= t < n.start.t + n.duration_tied]
        return hit[0] if hit else None

    times_l = [n.start.t for n in low]
    count = 0
    for t1, t2 in zip(times_l, times_l[1:]):
        u1, u2, l1, l2 = at(mel, t1), at(mel, t2), at(low, t1), at(low, t2)
        if not (u1 and u2 and l1 and l2) or (u1 is u2 and l1 is l2):
            continue
        vlq = voiceLeading.VoiceLeadingQuartet(m21note.Note(name(u1)), m21note.Note(name(u2)),
                                               m21note.Note(name(l1)), m21note.Note(name(l2)))
        if vlq.parallelFifth() or vlq.parallelOctave():
            count += 1
    return count


# --------------------------------------------------------------------------- compute


def compute(run: Path) -> None:
    ref = json.loads((HERE / "REFERENCE.json").read_text(encoding="utf-8"))
    manifest = json.loads((HERE / "MANIFEST.json").read_text(encoding="utf-8"))
    results = {r["id"]: r for r in json.loads((run / "results.json").read_text(encoding="utf-8"))}
    out = {"levels": {}, "diagnostics": {}}
    gen_by_level = defaultdict(list)
    for item in manifest["items"]:
        r = results[item["id"]]
        if r["outcome"] != "WRITE":
            continue
        path = run / "items" / f"{item['id']}.musicxml"
        level = int(r["options"]["level"])
        hands = r["options"].get("hands", "both")
        out["diagnostics"][item["id"]] = {**diagnostics(path), "parallels": parallels(path), "level": level,
                                          "stratum": item["stratum"]}
        if item["stratum"] != "O":
            continue
        melody = (0, 2) if hands == "L" else (0, 1)
        ws = piece_windows(path, int(r["bars"]), None, hands == "both", melody_line=melody)
        if ws:
            gen_by_level[level].append(ws[0])
    for level in range(1, 8):
        lv = ref["levels"][str(level)]
        pieces = []
        for piece in lv["pieces"]:
            path = CONTENT / piece["file"]
            try:
                ws = piece_windows(path, WINDOW_BARS[level], piece.get("keySig"), LEVEL_HAS_LOWER[level])
            except Exception as error:  # noqa: BLE001
                pieces.append({"id": piece["id"], "error": str(error)[:120]})
                continue
            med = {f: (statistics.median([w[f] for w in ws if w.get(f) is not None])
                       if any(w.get(f) is not None for w in ws) else None) for f in FEATURES}
            pieces.append({"id": piece["id"], "windows": len(ws), "medians": med})
        usable = [p for p in pieces if p.get("windows")]
        table = {}
        for f in FEATURES:
            g = summary([w.get(f) for w in gen_by_level[level]])
            rs = summary([p["medians"][f] for p in usable])
            inside = None
            if g and rs:
                inside = rs["q1"] <= g["median"] <= rs["q3"]
            table[f] = {"generated": g, "reference": rs, "inside": inside}
        out["levels"][str(level)] = {
            "referenceN": len(usable), "referenceListed": lv["n"], "windows": sum(p.get("windows", 0) for p in usable),
            "unusable": [p for p in pieces if not p.get("windows")], "generatedN": len(gen_by_level[level]),
            "status": "UNKNOWN" if not usable else "compared", "features": table,
            "pieces": [{"id": p["id"], "windows": p["windows"]} for p in usable],
        }
        print(level, out["levels"][str(level)]["status"], len(usable), "pieces",
              out["levels"][str(level)]["windows"], "windows")
    (run / "features.json").write_text(json.dumps(out, indent=1, default=str), encoding="utf-8")


if __name__ == "__main__":
    if sys.argv[1] == "reference":
        reference()
    else:
        compute(Path(sys.argv[2]))
